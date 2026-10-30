# API reference

Base path: `/api`. Requests and responses use JSON except multipart imports and CSV/XLSX downloads. Authentication uses the `lms_session` HTTP-only cookie. There is no public registration route. Browser clients must include credentials. Mutations must originate from an allowed `CLIENT_ORIGIN` when an Origin header is present.

Errors have `{ "message": "Readable error" }`. Typical statuses: 400 invalid data, 401 unauthenticated, 403 unauthorized, 404 missing resource, 409 linked-history or uniqueness conflict.

Implementation folders and MVC responsibilities are documented in [ARCHITECTURE.md](ARCHITECTURE.md). The refactor retains these endpoint paths and payloads.

For API-only hosting (`SERVE_CLIENT=false`, the Render default), `GET /` returns plain text `Server is running` with status 200. This route is outside `/api`. `GET /api/health` returns 200 with `status: "ok"` when MongoDB is connected, or 503 with `status: "unavailable"` when disconnected. See [DEPLOYMENT.md](DEPLOYMENT.md) for the supplied Vercel proxy and production session configuration.

## Account routes

| Method | Path | Body / response |
| --- | --- | --- |
| GET | `/health` | Service/database readiness; public; 200 ready, 503 unavailable |
| POST | `/auth/login` | Admin only: `{email,password}` → `{user}` + cookie |
| POST | `/auth/student-login` | `{registerNumber,dateOfBirth:"YYYY-MM-DD"}`; active student only; `{user}` + cookie |
| POST | `/auth/logout` | Clears cookie |
| GET | `/auth/me` | `{user}` |
| PATCH | `/profile` | `{name,phone,department,bio,preferences?}` → `{user}` |
| POST | `/profile/password` | Admin only: `{currentPassword,newPassword}` |

Preferences: `{emailNotifications:boolean,timezone:string}`. Timezone must be an IANA timezone recognized by Node.js.

## Administrator routes

Administrator role required. `entity` is `students`, `courses`, `exams`, or `questions`. JSON field names match the import format, but `courseCodes` and `assignedStudentEmails` are arrays in JSON. Dates are ISO strings or null. `shuffleQuestions` is a Boolean. Unknown fields are discarded by validation.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/admin/settings` | `{studentResultsVisible:boolean}`; defaults to true |
| PATCH | `/admin/settings` | Strict `{studentResultsVisible:boolean}`; administrator only, persists in MongoDB |
| GET | `/admin/dashboard` | Counts, activity, enrollments, recent results |
| GET | `/admin/:entity?search=...` | `{records:[...]}` |
| POST | `/admin/:entity` | Create record; `{record}` |
| PUT | `/admin/:entity/:id` | Full record update; `{record}` |
| DELETE | `/admin/:entity/:id` | Protected record deletion |
| GET | `/admin/:entity/template?format=csv` | Sample import template; `csv` or `xlsx` |
| GET | `/admin/:entity/export?format=xlsx` | All records for the entity |
| POST | `/admin/:entity/import` | Multipart file under field `file` |
| GET | `/admin/results?search=...` | Completed attempts with student details |
| GET | `/admin/results/export?format=xlsx&search=...` | CSV or XLSX result file |

Example course creation:

```json
{"code":"WEB101","title":"Web Development","instructor":"Dr. Maya Rao","description":"Modern web fundamentals","status":"active"}
```

Example student creation:

```json
{"studentId":"STU-101","name":"Sample Student","email":"student101@example.com","dateOfBirth":"2005-01-15","courseCodes":["WEB101"],"status":"active"}
```

Example import report:

```json
{"total":3,"created":1,"updated":1,"failed":1,"errors":[{"row":3,"message":"title: String must contain at least 1 character(s)"}]}
```

Imports are row-wise upserts and are intentionally not atomic across the entire upload. MongoDB unique indexes enforce record identity; [Mongoose validation](https://mongoosejs.com/docs/validation) is supplemented by request schemas and reference checks.

## Student routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/student/dashboard` | `{courses,exams,results,resultsVisible}` for signed-in user |
| GET | `/student/exams` | `{records,resultsVisible}` of assigned published exams |
| POST | `/student/exams/:id/start` | Starts or resumes an active attempt; `{attempt}` |
| GET | `/student/attempts/:id` | Own attempt only; `{attempt}` |
| PUT | `/student/attempts/:id/answers` | `{answers:{questionId:"A"},revision:1}`; replaces complete saved answer set; monotonically increasing integer revision prevents stale overwrites |
| POST | `/student/attempts/:id/submit` | Optional complete `{answers}`; `{attempt}` with score/review or a submission receipt, according to visibility |

Starting is guarded by course/direct assignment, publication status, schedule, question availability, and attempt quota. Simultaneous starts return the same active attempt. The response contains question IDs, text, and options; correct answers/explanations are omitted for active attempts. They are included only on submitted-attempt responses when results are visible. Attempt snapshots preserve historic grading. Submission is idempotent. Submissions arriving after the deadline use the already-saved answer set and ignore new answers. Scores use the configured marks, with zero marks for wrong or unanswered questions and no negative marking. The pass decision uses the unrounded percentage; the displayed percentage rounds to 2 decimals.

The UI consumes `serverTime` and `deadline` to show a server-aligned countdown. The server remains authoritative if a device clock is wrong. Expired attempts can finalize on reads, submission, dashboard loads, or the periodic expiry sweep.

## Student result visibility

`studentResultsVisible` is a single global switch (default true), read from MongoDB for every student request. An admin updates it through `PATCH /admin/settings`. When false, submitted-attempt responses use an allowlist containing only receipt identifiers, exam/course names, status, attempt number, and timestamps, plus `resultsVisible:false` and `serverTime`. They omit all grade fields, saved answers, question snapshots, correct answers and explanations. This applies to dashboard history, individual reads, first/repeated submissions, and expired-attempt responses from reads and answer saving. Exam lists return `bestScore:null`. Active attempts still receive their working questions/options and their own saved answers, never answer keys.

When true, completed attempts contain scores, saved answers and question snapshots with correct answers/explanations for review. Dashboard history remains a summary; fetch the individual attempt for review. Releasing results also releases historical submissions. Admin result routes and CSV/XLSX exports always retain full access. No student query/body parameter overrides this policy. Changing visibility does not change grading or stored attempts. Student screens refresh the policy when their page data or submission detail is fetched.

## Student sign-in details

`registerNumber` maps to the existing unique `studentId` field. It is a string, trimmed, case sensitive, and preserves leading zeros. `dateOfBirth` must be an exact, valid calendar date in `YYYY-MM-DD` format, from 1900 through today; invalid dates and extra login keys return 400. Unknown register numbers, incorrect DOBs, inactive accounts and missing legacy DOBs share a generic 401 response. Admin accounts cannot use student sign-in; student accounts cannot use the email/password endpoint, even if an old password hash remains. Both sign-in endpoints share the existing 30-per-15-minute IP request limit.

DOB is excluded from normal user queries and all public user/profile/session responses. Only administrator student CRUD/import/export explicitly accesses it. Student profile updates cannot change register numbers or DOBs. Admin corrections to either increment the session version and invalidate that student's existing sessions. Password changes are restricted to admins. New student records require a DOB and do not require or accept a password. Student imports upsert by `studentId`, including when the contact email changes. Legacy records remain intact; an admin must supply the real DOB before DOB sign-in is available.
