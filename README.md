# Diyaprosoft LMS — MERN Examination System

A complete local-source project built with **MongoDB, Express, React, and Node.js**. It includes an administrator workspace and a student portal, with persistent data in MongoDB. No hosted backend or browser-only database is substituted for the MERN backend.

## Included features

| Area | Features |
| --- | --- |
| Authentication | Administrator email/password, student register number/date-of-birth sign-in, HTTP-only session cookies, sign-out, inactive account protection |
| Appearance | Dark navy blue, white, and gray theme with matching scrollbars; continuously animated book/medal illustrations; supplied VMES emblem with scaling animation during startup and data loading; reduced-motion support |
| Students | Manual create/edit/delete, course enrollment, direct exam assignment, account activation, administrator-managed register number and DOB, CSV/XLSX import and export |
| Courses | Manual create/edit/delete/archive, instructor and description, CSV/XLSX import and export |
| Examinations | Draft/publish/archive, course assignment, extra student assignments, availability windows, time limits, question counts, marks, pass thresholds, maximum attempts, random question selection, CSV/XLSX import and export |
| Questions | Four options (A–D), one correct answer, explanation, specific exam and course, manual entry, CSV/XLSX import and export |
| Taking exams | Instructions popup with required acknowledgment before the timer starts, question navigation, mark for review, debounced answer saving, resume saved attempts, server-controlled deadlines, automatic submission, server-side grading |
| Results | Admin and student views, score and pass/fail, post-submission answer review, global admin visibility button, admin CSV and Excel exports |
| Profiles/settings | Personal information, admin password changes, student sign-in details, saved timezone and email notification preferences |
| Dashboard | Real database counts, monthly attempt chart, enrollment breakdown, recent results |

Email preferences are stored; an email delivery service is not configured. Dates and times display in your saved profile timezone. Admin schedule inputs use the browser's local timezone. This project does not include webcam proctoring, payments, essays, negative marking, or an email password-recovery service.

Both administrator and student workspaces have a top-right **account dropdown** with **My profile** and **Log out**, plus the existing sidebar logout. The dropdown works on desktop/mobile, supports keyboard navigation and Escape, and closes when clicking outside or navigating. Logging out clears the session and returns to the login page.

During an exam, question numbers are **green when answered**, **red when unanswered**, and **yellow when marked for review**. The current question has a separate outline; review flags take priority over answered status. Student submissions and administrator create, update, delete, import, and export actions show animated completion dialogs after the server confirms success. Partial imports show a warning with counts and keep the detailed report available. Dialog animations respect the device's reduced-motion preference.

The supplied emblem is stored at `client/public/vmes-emblem.png`. It appears before React starts, during session checks and page-data loading, and in pending-request indicators within the workspace or open forms. The emblem scales gently while loading. Background answer saving uses the quiet examination save status. The loading indicators clear when requests finish or fail, including overlapping requests. All loading animations respect reduced motion. Replace that PNG to change the loading emblem.

Administrators can open **Settings > Student results visibility** and use **Turn off visibility / Turn on visibility**. This global setting is stored in MongoDB and defaults to on. Turning it off withholds scores, pass/fail outcomes, and submitted/correct answers across student APIs and pages; students receive a submission receipt. Turning it on releases past attempts too. It applies on the next page load or request without signing in again. Admin reports and Excel/CSV exports remain available, and grading continues while results are hidden. Correct answers are never sent during an active attempt.

Dashboard greetings include a dark navy waving hand and a typewriter line with a blinking cursor. Four exam-motivation messages rotate before the fifth message, **Developed By - SHARIF RAYAN**. A small pause/resume button lets you stop the text; reduced motion uses a static greeting and developer credit.

Both dashboard illustrations animate continuously. Successful student submissions trigger a finite party-popper confetti burst above the confirmation dialog; no celebration runs after a failed request or when reopening a completed attempt. Decorative motion and confetti respect reduced motion.

## Existing student accounts

The existing Student ID is the register number. For a populated database, open **Admin > Students**, edit each student and enter their **real date of birth**, or import complete student records with the `dateOfBirth` column. Missing DOBs are flagged in the student list. No DOBs are invented or backfilled, and existing student/exam history is preserved. Do not rerun the seed on an existing database. Admin email/password remains unchanged; students can no longer use email/password. `SEED_STUDENT_PASSWORD` in an older `.env` is ignored.

## Quick start

Requirements: **Node.js 22.12+ (24 recommended)**, npm, and **MongoDB 8** locally or a MongoDB Atlas URI. Vite 7's Node requirements are documented in the [official release notes](https://vite.dev/blog/announcing-vite7).

1. Extract the ZIP and open a terminal inside `Diyaprosoft-LMS`.
2. Install the locked dependencies:

   ```sh
   npm ci
   ```

3. Copy `server/.env.example` to `server/.env`:

   ```powershell
   # Windows PowerShell
   Copy-Item server/.env.example server/.env
   ```

   ```sh
   # macOS/Linux
   cp server/.env.example server/.env
   ```

4. Generate a session secret and paste the output into `JWT_SECRET`:

   ```sh
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

5. Set `MONGODB_URI` to your database. Choose `SEED_ADMIN_EMAIL` and a strong `SEED_ADMIN_PASSWORD` of at least 12 characters. `SEED_STUDENT_EMAIL` is contact information. Set `SEED_STUDENT_DOB` as `YYYY-MM-DD` for the primary demo student (default `2005-01-15`); its register number is `STU-001`. Student passwords are no longer used.
6. Start MongoDB, then initialize an empty database with demo data:

   ```sh
   npm run seed
   ```

   The seed refuses to modify a nonempty database. It creates 1 administrator, 12 sample students, 4 courses, 6 examinations, 60 questions, and sample result history. The primary student has no completed attempts and can take the published exams. Other demo students receive synthetic DOBs visible under Admin > Students and in student exports; remove or deactivate demo accounts before real use.

7. Start both applications:

   ```sh
   npm run dev
   ```

8. Open **http://localhost:5173**. Choose **Student** and use register number + DOB, or choose **Administrator** and use admin email + password. The same page routes each role to its portal.

The React development server proxies `/api` to Express on port 5000. Keep that port when using the supplied Vite configuration, or update its proxy if you change `PORT`.

## Production build locally

```sh
npm run build
npm start
```

Express serves both the compiled React application and `/api` at **http://localhost:5000**. For this mode set `CLIENT_ORIGIN=http://localhost:5000,http://127.0.0.1:5000` in `server/.env`. Keep `NODE_ENV=development` for local HTTP; `NODE_ENV=production` requires HTTPS because session cookies become Secure.

## Docker option

Configure `server/.env` as above, then:

```sh
docker compose up --build -d
docker compose exec app node server/src/seed.js
```

Open **http://localhost:5000**. MongoDB data persists in a named volume. The database is not exposed on a host port. The Compose configuration is intended for local HTTP use. The seed command is only needed for the first empty database.

For public hosting, configure HTTPS, set `NODE_ENV=production`, set `CLIENT_ORIGIN` to the exact HTTPS origin, use your own secrets, use an authenticated database, and configure backups. The app listens on port 5000 inside the container. The included Compose file binds the host port to loopback.

## Administrator workflow

1. **Courses:** create courses first, using unique codes such as `WEB101`.
2. **Students:** create accounts with a unique register number (`studentId`), contact email and date of birth. Enroll students in courses. Students sign in with their register number and DOB; only administrators can correct those sign-in details.
3. **Examinations:** create an exam as **draft**. Set its course, time limit, number of questions per attempt, marks, threshold, and allowed attempts. Course enrollment assigns the exam automatically. Additional students can be assigned directly.
4. **Question bank:** create/import questions under that exam code and matching course code. Supply four options and the correct letter.
5. **Publish:** edit the examination, select **published**, and save. Publishing requires at least the configured number of questions. Students can start it during the configured availability window.
6. **Results & reports:** completed attempts appear automatically; export CSV or Excel.

Attempted exams preserve their original content and scoring snapshots. Only publication status can be changed once an attempt exists. To change a test's content, create a new exam and import its questions under the new exam code. Students, courses, and exams with linked history are protected from deletion; use inactive/archive instead.

## Spreadsheet import/export

All four management pages have **Import**, **Export**, and manual entry. The import dialog downloads CSV or XLSX templates. Import the first worksheet of an XLSX workbook. Legacy `.xls` files are not accepted.

- Import order: **courses → students → draft exams → questions → publish exams**.
- Keep the template headers exactly as downloaded.
- Maximum upload: **2 MB**, **1,000 data rows**, **40 columns**.
- `courseCodes` and `assignedStudentEmails` use semicolon-separated values.
- Dates use ISO 8601 with a timezone, e.g. `2026-11-01T09:00:00+05:30`. Leave unrestricted dates blank.
- Correct answers must be `A`, `B`, `C`, or `D`; `shuffleQuestions` must be `true` or `false`.
- Students match by **register number (`studentId`)**; courses/exams match by **code**; questions match by **exam code + question code**. Matching records are updated; other rows are created.
- Imports validate and save each row independently. The report lists successful creations/updates and the spreadsheet row number for each failure. Valid rows remain saved when another row fails.
- Reimport corrected failed rows. Supply complete records: omitted optional columns receive their defaults on an update. Student rows require `dateOfBirth` in `YYYY-MM-DD` format and match existing records by register number (`studentId`).
- Student exports include register numbers and DOBs for administrator management; they contain no passwords or password hashes.
- Formula cells are rejected on XLSX import. Text beginning with a spreadsheet formula prefix is escaped on export. Excel exports keep scores numeric.
- Result exports contain **all completed attempts matching the search text**, including both pass and fail outcomes. The table's outcome filter is a viewing aid only.

See [docs/IMPORT_FORMATS.md](docs/IMPORT_FORMATS.md), the downloadable templates, and the sample CSV files in `samples/`.

## Validation

```sh
npm test
npm run test:integration
npm run build
```

Unit tests cover grading, pass thresholds, exam access, answer validation, answer-key secrecy, spreadsheet formula escaping, and schedule validation.

Integration tests start a disposable MongoDB instance using `mongodb-memory-server`, then exercise login/roles, manual entry, publishing, concurrent starts, save/submit, expiry, maximum attempts, CSV/XLSX results, imports with row errors, profiles, admin password changes, student credential/session invalidation, and deletion protection. The first integration run downloads a MongoDB binary and requires internet access. It does not connect to your configured production database. If MongoDB is already installed, set `MONGOMS_SYSTEM_BINARY` to its `mongod` executable to use it for the disposable test instance and avoid the download. Normal dependency installation does not download this test binary.

An optional browser smoke test uses an installed Chrome, Edge, or Chromium browser:

```sh
npm run build
node scripts/ui-smoke.mjs
```

On Windows it detects common Edge/Chrome installation paths; elsewhere set `BROWSER_BINARY` to the browser executable. It checks administrator and student sign-in, management dialogs, saved exam resumption, submission/results, mobile layout, and logout from the top bar and mobile navigation using a separate temporary database. Logout checks include a failed request and retry, session clearing, and protected page redirects. Screenshots are saved under `.cache/ui/`. This test also honors `MONGOMS_SYSTEM_BINARY`.

The browser checks also cover the exam status colors, animated student submission and admin management dialogs, partial-import warnings, and reduced-motion rendering. Use `node scripts/ui-smoke.mjs --student-only` to run the student workflows with a smaller disposable fixture.

Use `node scripts/ui-smoke.mjs --appearance-only` to check the emblem loader and theme on all administrator/student pages, overlapping requests, open-form loading, error recovery, and mobile submission. Run `node --test client/test/loading.test.js` for the loading lifecycle tests. These checks use temporary data and do not connect to your configured application database.

Run `node scripts/ui-smoke.mjs --enhancements-only` for the dark navy palette/scrollbars, continuously animated dashboards, instruction acknowledgment, party burst, result visibility switch, answer review, mobile layout and reduced motion. Run `npm run test:visibility -w server` for the focused result-release security test. It is also included in `npm run test:integration`.

Use `node scripts/ui-smoke.mjs --greetings-only` to verify both account menus, profile navigation, logout/retry and protected routes, all five typed messages, keyboard controls, mobile layout and reduced motion with a disposable database.

Run `node scripts/ui-smoke.mjs --signin-only` for student/admin login modes, incorrect DOB, manual student creation, CSV imports, student settings and mobile sign-in. Run `npm run test:student-login -w server` for authentication, credential updates, legacy accounts, spreadsheet round trips and the shared login request limit.

## Project layout

```text
client/                         React view layer (Vite)
  src/pages/                    Admin, student, profile/settings screens
  src/components.jsx            Shared UI and data hooks
  src/api.js                    HTTP client and downloads
server/
  src/
    index.js                    Server startup, expiry worker and shutdown
    app.js                      Express composition and React static hosting
    config/                     Environment and database connection
    models/                     Separate Mongoose models and indexes
    controllers/                HTTP request/response handlers
    routes/                     API endpoints and middleware composition
    services/                   Authentication, records, exams, reports, transfers
    middleware/                 Authentication, authorization, uploads and errors
    validators/                 Zod request and record schemas
    utils/                      Grading, date validation and shared helpers
    seed.js                     Non-destructive demo initialization
    test/                       All server unit and integration tests
docs/                           API, architecture and import documentation
samples/                        Example import CSVs
scripts/package.mjs             Recreate the source ZIP
compose.yaml                    Local app + MongoDB containers
```

The server follows MVC with the React client as its view layer. Tests live in `server/src/test`. The existing `npm test` and `npm run test:integration` commands use that location. API paths, database collections and startup commands remain compatible; no reseeding or database migration is required. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full directory map and responsibilities.

## API and implementation notes

See [docs/API.md](docs/API.md). The browser uses HTTP-only cookies and same-origin `/api` requests. Passwords are hashed with bcrypt. Answers are scored on the server; question keys are never sent during active attempts and are released for submitted-attempt review only when the administrator allows it. Deadlines and attempt quotas are enforced by the server, with unique indexes preventing concurrent duplicate attempts. An expiry worker finalizes elapsed attempts every 30 seconds, and reads/submissions also enforce deadlines. After server downtime, elapsed attempts finalize using their last saved answers when the server restarts or the records are accessed.

Answers save after a 650 ms debounce. A lost connection may prevent the latest unsaved choice from reaching the server; the exam screen displays the save status. The timer continues while a student is offline or away. Only answers saved before expiry count after the deadline. Review flags are temporary UI state; saved answers persist across reloads.

Session lifetime is 8 hours. Admin password changes and administrator corrections to student register numbers or DOBs invalidate older sessions. Mutating requests from unapproved browser origins are rejected. The server sets HTTP security headers and rate-limits sign-in attempts. Configure reverse-proxy trust explicitly if you deploy behind a proxy; it is intentionally not trusted by default.

## Recreate the source ZIP

```sh
node scripts/package.mjs
```

Creates `artifacts/Diyaprosoft-LMS-MERN.zip` from a fresh staging directory with source, dependency lockfile, docs, sample templates, and configuration examples. It excludes credentials, dependencies, generated frontend files, caches, and test runtime data. Install dependencies and build after extracting.
