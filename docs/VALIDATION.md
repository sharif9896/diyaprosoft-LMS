# Package validation

Current changes verified on 30 October 2026 using Node.js 24.12.0. Earlier broad browser and dependency-audit checks below were recorded on 28 October 2026.

| Check | Result |
| --- | --- |
| React/Vite production build | Passed; compiled JavaScript and CSS generated successfully |
| Domain and spreadsheet tests | 9 passed |
| API integration tests | 5 passed: administration/exams, demo seeding, result visibility, student register/DOB authentication and shared sign-in rate limiting |
| Loading lifecycle tests | 3 passed; overlapping operations, response-body completion, HTTP/network failures, and quiet background answer saving |
| Browser workflows | 16 workflows verified across administrator and focused student runs; includes status colors, animated dialogs, imports/exports, submission retry, reduced motion, and desktop/mobile logout |
| Theme and loading browser checks | 7 passed; startup emblem, all 8 admin and 6 student pages, overlapping requests, dialog loading, error recovery, reduced motion, quiet answer saving, and mobile submission |
| Greeting and account-menu browser checks (30 October) | 8 passed; full typing cycle, keyboard controls, profiles, logout/retry, mobile and reduced motion |
| Student sign-in browser checks (30 October) | 7 passed; role-specific login, invalid DOB, student manual entry/import, managed settings and mobile login/logout |
| MVC architecture refactor (30 October) | 9 server unit/spreadsheet, 5 API integration, 3 loading tests and all 16 browser workflows passed; server tests run from src/test |
| Production dependency audit (28 October) | 0 advisories reported; dependencies unchanged in this update |

The integration suite uses its own disposable MongoDB instance. It verifies authentication and roles, record creation, publishing, course-based eligibility, simultaneous exam starts, saved answers, grading, late submission, attempt quotas, CSV/Excel imports and exports, row error reporting, formula rejection, profile changes, password changes/resets, session invalidation, protected deletion, and demo seeding. Logout checks cover both roles, cookie clearing, rejected access after logout, repeated logout, and signing in again.

The browser suite verifies the logout controls in a 1366 × 605 desktop window and a 390 px mobile viewport. It checks the top bar and scrolling sidebar, a failed logout followed by a successful retry, session clearing, and direct navigation to protected pages after logout.

The feedback checks verify green answered questions, red unanswered questions, yellow review flags, and the current-question outline. They cover administrator create/update/delete confirmations, validation failures, export completion, successful and partial imports, nested dialog scroll locking, and reduced-motion rendering. Student checks cover failed submission and retry, the animated completion dialog on desktop/mobile, scored results, and reloading a completed attempt without replaying the popup. Screenshots were visually reviewed.

For a focused student run, use `node scripts/ui-smoke.mjs --student-only`. This starts a smaller disposable fixture with one student and five exams; the default run uses the complete demo workspace and includes administrator checks.

The appearance run (`node scripts/ui-smoke.mjs --appearance-only`) also creates a temporary administrator. It pauses real requests against its disposable backend to verify the supplied emblem during authentication, page reloads, concurrent data loads, open forms, and submission. It checks the dark navy blue/white/gray palette, verifies loading cleanup after an error, confirms that the examination timer continues during background saving, and preserves the green/red/yellow question states. Startup, login, dashboards, forms, examination, and mobile result-dialog screenshots were reviewed.

Run `node --test client/test/loading.test.js` to verify the request activity lifecycle without a database or browser.

The spreadsheet regression test round-trips generated CSV and XLSX files with the patched export dependencies and verifies that scores remain numeric in Excel and formula-like text remains literal.

Reproduce the checks with `npm test`, `npm run test:integration`, `npm run build`, and `npm audit --omit=dev`. An optional isolated browser smoke test is provided in `scripts/ui-smoke.mjs`; see the README for requirements and commands.

The focused enhancement run (`node scripts/ui-smoke.mjs --enhancements-only`) passed 8 checks: dark navy accents and scrollbars, continuous book/medal motion, the persistent admin visibility button, required instruction acknowledgment before attempt creation, a finite party-popper burst after successful submission, withheld scores/history/reviews, release of historical scores and correct-answer reviews, and 390px/reduced-motion behavior. Desktop dashboard/settings, instructions, submission, receipt, answer-review and mobile screenshots were visually inspected.

The new `npm run test:visibility -w server` scenario uses a separate disposable database. It checks role authorization, strict Boolean validation, default-on behavior, persistence across Express instances, active-exam answer-key secrecy, dashboard/best-score suppression, submitted-attempt receipt allowlists, repeated/manual/expired submissions, late answer-save responses, ownership, resistance to client policy overrides, continued admin CSV/XLSX exports, and release of past attempts. It is included in `npm run test:integration`. No configured application database is used.

A final isolated visual fixture verified the rebuilt client after adjusting confetti layering: the burst renders above the native dialog backdrop, stops after its finite duration, allows confirmation-button clicks and removes its overlay when dismissed. The final screenshot was visually inspected.

The greeting/account run (`node scripts/ui-smoke.mjs --greetings-only`) verified the rebuilt client against a disposable MongoDB database: dark navy waving hand, all five messages typed in order with the exact developer credit, cursor blink, text pause/resume, removal of standalone header logout, account-menu profile navigation for both roles, keyboard arrows/Home/End/Escape and focus return, outside-click dismissal, failed logout/retry and protected routes, a 390px account dropdown and static reduced-motion greetings. Desktop and mobile screenshots were visually inspected. That greeting/account-only update changed no backend code or dependencies.

The register-number/DOB authentication update passed the production build, 9 domain/spreadsheet tests, 3 loading tests and all 5 API integration tests. The dedicated authentication scenario verifies calendar validation (including valid/invalid leap days), leading-zero register numbers, private DOB serialization, no student password requirement, prevention of legacy email/password access, admin/student role boundaries, inactive/missing-DOB accounts, prevention of student credential edits, session revocation after register/DOB changes, register-based import updates, CSV/XLSX exports and native Excel date imports. Both login endpoints share the existing rate limit, verified with 429 responses.

`node scripts/ui-smoke.mjs --signin-only` passed 7 browser checks using a disposable database: student register/DOB form and invalid-DOB error, admin email/password login, missing-DOB flags, student creation with DOB, DOB import/templates, a newly created student login and managed settings, and an imported student signing in/out at 390px. Login, admin student form, student settings and mobile screenshots were visually inspected. Existing students and exam records are not migrated or reseeded; administrators must enter real DOBs for legacy students.

The MVC refactor was verified using all existing test suites after moving the five server test files to `server/src/test`. The browser suite passed all 16 administrator/student workflows against disposable data through the refactored routers, controllers, services and models. Configuration still resolves `server/.env`, and production React static hosting resolves the same client build. Startup and seed entry points, collection names, indexes, session behavior and API contracts are preserved. `server/test` and the obsolete flat modules have been removed. Packaging now starts with fresh staging to exclude obsolete paths from updated archives. See [ARCHITECTURE.md](ARCHITECTURE.md).
