# CSV and Excel formats

Download templates from the relevant admin page. All exports support `.csv` and `.xlsx`. Imports accept those same formats. Headers are case sensitive. Optional missing values receive defaults; supply complete records when updating.

## Students

| Column | Rule |
| --- | --- |
| studentId | Required; globally unique register number and import match key; preserve leading zeros |
| name | Required; up to 100 characters |
| email | Required; unique contact email; not used for student sign-in |
| dateOfBirth | Required; real date in `YYYY-MM-DD` format, from 1900 through today; used for student sign-in |
| phone | Optional; up to 30 characters |
| department | Optional; up to 100 characters |
| status | `active` (default) or `inactive` |
| courseCodes | Existing course codes separated by `;`; blank clears enrollment |

Administrator accounts cannot be overwritten through student imports. Student imports match by `studentId`. Changing a register number or DOB signs out that student's existing sessions. Student passwords are not accepted; download the updated template instead of using an old password column. Format register numbers as **Text** in Excel to preserve leading zeros. Native Excel date cells are accepted and normalized to date-only strings. Existing students without a DOB need their real date entered by an administrator; other records and exam history are preserved.

## Courses

| Column | Rule |
| --- | --- |
| code | Required; unique, normalized to uppercase; import match key |
| title | Required |
| description | Optional; up to 2,000 characters |
| instructor | Optional |
| status | `active` (default) or `archived` |

## Examinations

| Column | Rule |
| --- | --- |
| code | Required; unique, normalized to uppercase; import match key |
| title | Required |
| courseCode | Required; an existing course code |
| durationMinutes | Integer 1–240; default 30 |
| questionCount | Integer 1–200; default 10 |
| marksPerQuestion | Integer 1–100; default 1 |
| passPercentage | Integer 0–100; default 50 |
| maxAttempts | Integer 1–10; default 1 |
| startsAt | Optional ISO 8601 with timezone |
| endsAt | Optional ISO 8601 with timezone; after startsAt if both provided |
| status | `draft` (default), `published`, or `archived` |
| assignedStudentEmails | Existing student emails separated by `;`; extra assignments beyond course enrollment |
| shuffleQuestions | `true` (default) or `false` |

Create as draft, add questions, then publish. Publishing requires at least `questionCount` questions belonging to that exam and course. After the first attempt, only the status can change. To publish an attempted archived exam, provide the same settings in the import row with the new status.

## Questions

| Column | Rule |
| --- | --- |
| code | Required; unique within the exam |
| examCode | Required; existing exam; combined with code to match an existing question |
| courseCode | Required; must equal the exam's course |
| text | Required; up to 5,000 characters |
| optionA, optionB, optionC, optionD | All required; up to 1,000 characters each |
| correctAnswer | `A`, `B`, `C`, or `D` |
| explanation | Optional; up to 5,000 characters |

The same question code may be used in different exams. Questions lock after the exam has its first attempt. Options are single choice, and all questions in an exam share the configured marks per question.

## Result exports

Export-only columns: `studentId`, `studentName`, `email`, `courseCode`, `examCode`, `examTitle`, `attemptNumber`, `score`, `maxScore`, `percentage`, `passed`, `startedAt`, `submittedAt`.

Every completed attempt is a separate row. Timestamps use UTC ISO 8601. Scores and percentages are numeric in Excel; `passed` is Boolean. Passwords and answer keys are never included in results.
