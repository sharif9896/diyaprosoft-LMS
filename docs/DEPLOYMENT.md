# Render backend and Vercel frontend

This configuration uses your existing URLs:

- Backend: https://diyaprosoft-lms-2.onrender.com
- Frontend: https://diyaprosoft-lms.vercel.app
- Login: https://diyaprosoft-lms.vercel.app/login

Both hosting projects must use the updated repository. Local edits take effect online after pushing the files to the branch used by each service and redeploying. Existing MongoDB records need no migration or reseeding.

## 1. Render: existing Node web service

Use these settings in the existing backend service:

| Setting | Value |
| --- | --- |
| Root Directory | Leave empty (repository root) |
| Build Command | `npm ci --omit=dev && npm run build -w server` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

This is an npm workspace repository with one lockfile at the root. The backend runs JavaScript directly; its build script checks the entry point's syntax. It does not build the React client. This also resolves the earlier `Missing script: build` error. Render supplies `PORT`; the server binds that port on `0.0.0.0`.

Set these **Render environment variables** (not Vercel variables):

```dotenv
NODE_ENV=production
CLIENT_ORIGIN=https://diyaprosoft-lms.vercel.app
SERVE_CLIENT=false
COOKIE_SAME_SITE=lax
TRUST_PROXY=1
```

Keep your existing `MONGODB_URI` and `JWT_SECRET` in Render. `MONGODB_URI` must point to your hosted MongoDB database, with its network access configured for the service. `JWT_SECRET` must contain at least 32 random characters. Never commit these values or place them in the client. Your local `server/.env` is excluded from the source ZIP and does not configure Render automatically.

`CLIENT_ORIGIN` is a website origin: use the value above without `/login`. Multiple exact origins can be separated by commas. The server also permits Render's own automatically supplied `RENDER_EXTERNAL_URL`. Preview deployment URLs must be explicitly added if you want their login/mutations to work; the production domain is configured by default in the Blueprint.

`TRUST_PROXY=1` trusts the nearest hosting proxy when deriving client IPs for sign-in limits. Keep this aligned with your hosting network; the application does not enable unrestricted proxy trust. `SERVE_CLIENT=false` makes the Render service API-only even if `client/dist` happens to exist.

The root `render.yaml` provides these settings for a **new Blueprint service**. For your existing service, update its dashboard settings instead of creating a duplicate backend. A new Blueprint can receive a different public hostname; update the Vercel API rewrite if you change the backend URL.

Deploy the backend, then open:

| URL | Expected response |
| --- | --- |
| https://diyaprosoft-lms-2.onrender.com/ | `Server is running` (200, plain text) |
| https://diyaprosoft-lms-2.onrender.com/api/health | `{"status":"ok","service":"Diyaprosoft LMS"}` when MongoDB is connected |

The root is a process liveness response. The health endpoint reports database readiness and returns 503 when disconnected. The startup entry point waits for the initial database connection before opening the listening port.

## 2. Vercel: existing frontend project

Set the Vercel project's **Root Directory to the repository root** (leave the field empty). The included root `vercel.json` supplies:

| Setting | Value |
| --- | --- |
| Framework Preset | Vite |
| Install Command | `npm ci --include=dev` |
| Build Command | `npm run build:vercel` |
| Output Directory | `client/dist` |

In Vercel's environment variables, set:

```dotenv
VITE_API_BASE_URL=/api
```

This is also the code's default. Replace any old value that points at localhost or directly at the Render domain. The supplied `build:vercel` command explicitly sets `/api` for the Vite build, overriding stale dashboard or dotenv values. Normal local `npm run build` still supports a configured API base for other hosting arrangements. Vite embeds this public value at build time, so redeploy the frontend after changing it. No server secrets belong in Vercel's frontend variables. Keep development dependencies installed for the Vite build.

The first rewrite forwards `/api/:path*` to `https://diyaprosoft-lms-2.onrender.com/api/:path*`. The following SPA rewrite serves `index.html` for routes such as `/login`, `/admin`, and `/student/exams`, including direct navigation and browser refresh. Static build assets are served normally.

Requests follow this path:

```text
Browser -> https://diyaprosoft-lms.vercel.app/api/...
Vercel  -> https://diyaprosoft-lms-2.onrender.com/api/...
```

The browser receives its session cookie on the frontend host through this proxy. Cookies remain HTTP-only, Secure in production, and SameSite=Lax, with the same attributes on logout. This supports browsers that block third-party cookies. Login, saved answers, management imports, and CSV/Excel downloads all use `/api`; authentication responses are marked `no-store` and external rewrite caching is disabled by the API response header.

After the Vercel redeployment:

1. Open https://diyaprosoft-lms.vercel.app/api/health and confirm the JSON health response. HTML or a Vercel 404 here means the proxy configuration is not active.
2. Open https://diyaprosoft-lms.vercel.app/login directly and refresh the page.
3. Sign in as an administrator using your existing email/password, then sign out.
4. Sign in as a student using the register number and DOB entered by the administrator, then sign out.
5. Check a management export/import and an assigned exam using your normal accounts/data.

The backend URL was updated to `https://diyaprosoft-lms-2.onrender.com` on 30 October 2026. A read-only check of its `/api/health` endpoint returned 200 with `status: "ok"`. Redeploy Vercel with the updated rewrite to use this backend. Earlier checks of the original deployment found its root and the frontend's `/login` returning 404 before the routing changes were deployed. Local tests do not modify those hosted services.

## Fixing the reported CORS / Failed to fetch error

The reported console requests went directly to the previous backend hostname. A client build with an absolute `VITE_API_BASE_URL` bypasses the Vercel proxy; changing source code alone does not update a previously published bundle. The local client setting also contained an `onrender.co` hostname typo. The local setting is now `/api`, and the Vercel build command forces `/api` even when an old hosting environment variable is present.

Apply these settings to the hosting dashboards and deploy the updated branch:

1. In **Render > Environment**, set `CLIENT_ORIGIN=https://diyaprosoft-lms.vercel.app`, `NODE_ENV=production`, `COOKIE_SAME_SITE=lax`, `SERVE_CLIENT=false`, and `TRUST_PROXY=1`. Save and redeploy the existing backend. Updating `server/.env` locally does not update Render. A public preflight check found the new API healthy but missing `Access-Control-Allow-Origin` for this frontend, so its current allowed-origin setting needs correcting. The API also checks request origins on mutations when accessed through the proxy.
2. In **Vercel > Settings**, leave **Root Directory** empty so the root `vercel.json` is read. It uses **Install Command** `npm ci --include=dev`, **Build Command** `npm run build:vercel`, and **Output Directory** `client/dist`. Set `VITE_API_BASE_URL=/api` for Production and any Preview environments you use. Deploy the updated branch to Production; an old deployment cannot pick up new environment values.
3. Confirm the project's **Domains** tab lists `diyaprosoft-lms.vercel.app` and points to the current production deployment. Read-only checks during this error investigation received Vercel 404 responses for both `/login` and `/api/health` at that domain. If it remains 404, correct the domain/project/deployment association before attempting login.
4. Once deployed, open `/api/health` on the frontend domain and confirm it returns the backend JSON. Open `/login` and refresh with Ctrl+Shift+R. The browser Network tab should show login requests going to `https://diyaprosoft-lms.vercel.app/api/auth/...`. It should not call Render directly with this configuration.

For local development, keep `client/.env` at `VITE_API_BASE_URL=/api`, use development settings in `server/.env`, restart `npm run dev`, and open `http://localhost:5173`. No data needs reseeding to fix routing or CORS.

## Optional: direct cross-site API calls

The Vercel proxy above is the supplied configuration. For another host without proxying, the client supports an absolute `VITE_API_BASE_URL`, including the `/api` suffix:

Use the ordinary `npm run build` for this optional direct configuration. `npm run build:vercel` deliberately selects the proxy instead.

```dotenv
# Frontend build environment
VITE_API_BASE_URL=https://diyaprosoft-lms-2.onrender.com/api
# Backend environment (both services must use HTTPS)
COOKIE_SAME_SITE=none
NODE_ENV=production
CLIENT_ORIGIN=https://diyaprosoft-lms.vercel.app
```

Both API calls and downloads retain credentials; CORS permits the exact frontend origin and exposes download filenames. Direct requests between unrelated sites depend on the browser permitting third-party cookies, even with SameSite=None and Secure. Use the supplied proxy or same-site custom domains when that policy prevents login. Do not mix this direct configuration with the default Lax cookie setting.

## Local development and checks

Local development still uses Vite's `/api` proxy on port 5173 and Express on port 5000. Use the values in `server/.env.example` locally; keep `NODE_ENV=development` for HTTP. The compiled client can still be served by Express with `SERVE_CLIENT=true` for single-server hosting.

```sh
npm test
npm run test:integration
node --test client/test/loading.test.js
npm run build
node scripts/ui-smoke.mjs --deployment
```

The browser command requires an installed Chrome/Edge browser and runs the complete workflow through two local services, simulating the frontend proxy to an API-only backend. It checks production cookie attributes on the frontend host. The loopback test uses the browser's trusted-localhost exception for Secure cookies; hosted services must use HTTPS. It never proxies test traffic to Render. All database tests use disposable MongoDB instances. See [VALIDATION.md](VALIDATION.md) for verification and [API.md](API.md) for endpoints.

Official references: [Render Node web services](https://render.com/docs/web-services), [Render monorepo settings](https://render.com/docs/monorepo-support), [Vercel external rewrites](https://vercel.com/docs/routing/rewrites), [Vercel SPA rewrite configuration](https://vercel.com/docs/project-configuration/vercel-json#rewrites), and [Express proxy configuration](https://expressjs.com/en/guide/behind-proxies/).
