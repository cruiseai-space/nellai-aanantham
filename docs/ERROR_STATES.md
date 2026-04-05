# Error and response states

This document describes how the Nellai Aanantham API and admin frontend represent failures and recoverable states. Use it when debugging 401/503/timeouts or aligning new endpoints with existing behavior.

---

## Backend HTTP status map

### Global (Express)

| Status | When | Response body shape |
|--------|------|----------------------|
| **404** | Unknown `METHOD /api/...` | `{ error: 'Not Found', message: 'Route ...' }` |
| **500** | Unhandled error in global error handler | `{ error: 'Internal Server Error', message: ... }` (message detail only in development) |

### Auth (`/api/auth/*`)

Uses **`error`** + **`message`** (not the `{ success, error }` envelope used by most data routes).

| Status | When | Example body |
|--------|------|----------------|
| **400** | Missing fields, signup failure | `{ error: 'Bad Request' \| 'Signup Failed', message: string }` |
| **401** | Bad password, invalid refresh, invalid JWT | `{ error: 'Login Failed' \| 'Unauthorized' \| 'Refresh Failed', message: string }` |
| **503** | Supabase unreachable (same class as `isSupabaseUnreachableError`) | `{ error: 'Service Unavailable', message: <UNAVAILABLE_MESSAGE> }` |
| **500** | Unexpected exception in auth route catch | `{ error: 'Internal Server Error', message: string }` |

`POST /api/auth/login` and refresh use the **anon** Supabase client; other admin calls use the service client. Both use the custom `fetch` in `backend/src/config/supabase.js` (undici `Agent` with extended connect timeout).

### Protected data routes (`/api/ingredients`, `/batches`, `/recipes`, `/products`, `/orders`, `/transactions`)

Envelope: **`{ success: boolean, data?: ..., error?: string }`** (some deletes return `message` instead of `data`).

| Status | When | Body |
|--------|------|------|
| **400** | Validation (missing required fields, empty update, business rule) | `{ success: false, error: string }` |
| **403** | Wrong user on nested resource (e.g. transaction) | `{ success: false, error: string }` |
| **404** | Row not found (`PGRST116` / explicit checks) | `{ success: false, error: string }` |
| **503** | Infrastructure / Supabase unreachable (`respondRouteError` + `isInfrastructureUnavailableError`) | `{ success: false, error: <UNAVAILABLE_MESSAGE> }` |
| **500** | Other thrown errors (PostgREST, bugs) | `{ success: false, error: err.message }` |

### Auth middleware (Bearer JWT on protected routes)

| Status | When | Body |
|--------|------|------|
| **401** | No/invalid `Authorization` header, or invalid/expired token (non-network) | `{ error: 'Unauthorized', message: string }` |
| **503** | Cannot reach Supabase for `getUser` (after retries), or middleware catch with connect timeout | `{ error: 'Service Unavailable', message: string }` |

---

## Supabase “unreachable” detection

Shared helpers:

- **`backend/src/utils/supabaseReachability.js`** — `isSupabaseUnreachableError(e)` for GoTrue-style errors (e.g. `fetch failed`, `UND_ERR_CONNECT_TIMEOUT` on `cause`, etc.) and **`UNAVAILABLE_MESSAGE`** (human-readable string returned in JSON).
- **`backend/src/utils/respondRouteError.js`** — `isInfrastructureUnavailableError(err)` extends that to thrown errors (`ENOTFOUND`, `ECONNRESET`, `fetch failed`, etc.) and maps them to **503** + `UNAVAILABLE_MESSAGE` for CRUD routes.

Auth middleware retries **`getUser`** (`SUPABASE_AUTH_GET_USER_RETRIES`, default 2 extra attempts) only when errors look like transient network.

---

## Timeouts and networking (backend)

| Layer | Role |
|--------|------|
| **undici `Agent`** (`backend/src/config/supabase.js`) | Raises default **TCP connect** above Node’s ~10s default (`SUPABASE_CONNECT_TIMEOUT_MS`, default 45000). |
| **`headersTimeout` / `bodyTimeout`** | Defaults 120s; override with `SUPABASE_HEADERS_TIMEOUT_MS` / `SUPABASE_BODY_TIMEOUT_MS`. |
| **Outer `AbortSignal`** | `SUPABASE_FETCH_TIMEOUT_MS` caps the whole Supabase fetch (default `max(connect + 15s, 60s)`). |

Recommended: run Node with **`--dns-result-order=ipv4first`** (already in `npm run dev` / `start`) if IPv6 paths to Supabase fail.

See **`.env.example`** for variable names.

---

## Frontend error display

### Axios / API

- **`frontend/src/lib/apiErrors.ts` — `getApiErrorMessage(err)`**  
  - Reads `response.data.error` or `response.data.message` (objects or string body).  
  - **`ECONNABORTED`**: timeout copy.  
  - **503**: generic “service temporarily unavailable” copy.  
  - **No `response`**: network / API URL / server down.

### Auth vs data routes

- Auth errors often use **`message`**; CRUD errors often use **`error`** inside `{ success: false }`. `getApiErrorMessage` checks **`error` first**, then **`message`**.

### Admin toasts (`sonner`)

- **`frontend/src/lib/adminToast.ts` — `withAdminToast(promise, successMessage)`**  
  - Success: `toast.success(successMessage)`.  
  - Failure: `toast.error(getApiErrorMessage(e))`, then rethrows.

- **Orders**: `toast.warning` for invalid line-item input; `toast.info` for profit after successful bill.

- **Recipes**: recipe cost fetch failure toasts once per details open (guarded ref).

### Login / refresh

- Login page should surface **`getApiErrorMessage`** or equivalent when `POST /api/auth/login` returns 401/503 (not covered by `withAdminToast` unless wired there).

---

## Common user-visible scenarios

| Symptom | Likely cause | Where it appears |
|---------|----------------|------------------|
| 503 + long message about VPN/firewall/DNS | Machine running API cannot reach Supabase | Auth login, any protected route, middleware |
| Connect timeout ~10s (older builds) | Default undici connect without custom `Agent` | Fixed by current `supabase.js` + `undici` |
| 401 after idle | Expired access token; axios retry refresh may redirect to login | Frontend interceptor |
| `{ success: false, error: '...' }` 400 | Validation / business rule | Modals + toast via `getApiErrorMessage` |
| Toast “Network error…” | Wrong `VITE_API_URL`, CORS, or backend not running | Admin actions |

---

## Tests

- Auth 503 for unreachable Supabase: `backend/src/tests/auth.test.js`.  
- CRUD: `ingredients`, `batches`, `orders`, `products`, `recipes`, etc. under `backend/src/tests/`.

---

## Design references (admin UI)

- Toast and modal tokens: `designs/admin-ui-sources.txt` and the linked HTML under `designs/`.
