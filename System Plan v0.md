**1) AUTHENTICATION & SECURITY**

Authentication is fully managed using Supabase Auth (email/password). Passwords are securely hashed (bcrypt) and never exposed. JWT tokens are issued on login and used for all API communication.

Security layers:

* HTTPS enforced across frontend, backend, DB, and AI calls
* Backend verifies JWT using Supabase public keys
* Service role keys are never exposed to frontend
* Row Level Security (RLS) ensures DB-level protection
* AI (Groq) API key is backend-only
* Rate limiting on:

  * AI endpoints
  * Bulk import endpoints

Password reset:

* Supabase built-in email flow
* Token-based secure reset

No custom auth logic → reduces attack surface and improves reliability.

---

**2) USER FLOWS (END-TO-END)**

1. User logs in (Supabase Auth)
2. Lands on dashboard (filtered by created_by)

---

Inventory Flow:

* Add ingredient batches (manual / voice / image / bulk)
* System stores batch-level data (price, qty, expiry)

---

Recipe Flow:

* Create recipe using ingredients
* Define quantity per ingredient

---

Product Flow:

* Create product from recipe
* Set static sale price
* System computes dynamic cost

---

Billing Flow:

* Create order (draft or instant billing)
* Select products + quantity
* If UPI:

  * Upload image → AI extract → preview → confirm
* Save order + transaction

---

Order Flow:

* Draft → scheduled → billed
* Inventory deducted only on billing

---

Dashboard:

* View revenue, margin, filters

---

Export:

* Export orders → Excel / PDF

---

Import:

* Upload CSV → preview → confirm → insert

---

**2.5) RBAC (ROLE-BASED ACCESS CONTROL)**

Current:

* Single role: admin

Future-ready roles:

* admin → full access
* staff → access only their data
* auditor → read-only

Implementation:

* Role stored in Supabase user metadata
* Enforced via:

  1. RLS policies
  2. Backend checks

Principle:

* Always enforce access at DB level (not only backend)

---

**3) SYSTEM PLAN (MVP → SCALABLE, DATA-FIRST)**

System follows:

* Data-first architecture
* No file storage
* AI → structured data → DB

Core principles:

* Static sale price
* Dynamic cost (batch-driven)
* Inventory = batch-based
* Orders = state machine
* Transactions = structured AI output

Flow:
Inventory → Recipes → Products → Orders → Transactions → Analytics

Designed to:

* minimize infra
* maximize correctness
* scale without redesign

---

**4) TECH STACK**

Frontend:

* React 18 (Client Components)
* Zustand / Context
* Vercel (hosting)

Backend:

* Node.js (Express / Fastify)
* Railway (hosting)

Database:

* Supabase (Postgres + Auth)

AI:

* Groq (vision + extraction)

Utilities:

* CSV parser (bulk import)
* PDF/Excel generator

No Docker required for MVP

---

**5) UI / UX (STATE-FIRST DESIGN FOR EASE OF USE)**

Pages:

* Dashboard
* Inventory
* Recipe
* Product
* Billing
* Orders
* Purchase View

---

Input Modes:

* Manual (default)
* Voice (TTS → form)
* Image (OCR → form)
* Bulk import

---

UI Components:

* Drawer (forms)
* Modal (confirmations, AI preview)
* Toast (feedback)
* Table (data view)

---

Key UX:

* All auto inputs → preview → confirm
* Dynamic cost visible but not editable
* Static price editable

---

State:

* global: auth, toast, modal
* page: form, table, filters
* derived: cost, margin

---

**6) RAW LOGIC & IMPLEMENTATION (CORE ENGINE)**

Dual pricing:

* sale_price (static)
* cost_price (dynamic)

---

Batch logic:

* FIFO or weighted average
* expiry-aware filtering

---

Cost computation:

* fetch valid batches
* consume in order
* calculate total cost

---

Spoilage:

* reduce batch qty
* log event
* exclude from future cost

---

Order logic:

* draft → billed
* scheduled orders supported

---

Inventory deduction:

* happens at billing only
* FIFO-based

---

AI pipeline:

* image → Groq → structured JSON → DB

---

Snapshot:

* cost_at_sale stored in order_items

---

Principle:

* no retroactive changes

---

**7) BACKEND CONTROLLERS (FLOW-ORIENTED DESIGN)**

Inventory:

* POST /inventory/batch
* POST /inventory/spoil
* GET /inventory

---

Recipes:

* POST /recipes
* GET /recipes/:id

---

Products:

* GET /products
* GET /products/:id/cost
* PATCH /products/:id/price

---

Orders:

* POST /orders
* POST /orders/:id/bill
* GET /orders

---

Transactions:

* POST /transactions/extract
* POST /transactions

---

Parsing:

* POST /parse/voice
* POST /parse/image
* POST /parse/bulk

---

Export:

* GET /export/orders

---

**8) DB SCHEMA (BATCH-AWARE + SCALABLE)**

ingredients

* id, name, unit

ingredient_batches

* id, ingredient_id, qty_total, qty_remaining
* unit_cost, purchase_date, expiry_date

recipes

* id, name

recipe_items

* recipe_id, ingredient_id, quantity_required

products

* id, name, recipe_id, sale_price

orders

* id, status, scheduled_for, created_by

order_items

* order_id, product_id, quantity, cost_at_sale

transactions

* order_id, txn_id, upi_id, amount, raw_json

inventory_logs

* batch_id, change_type, qty_change

Indexes:

* ingredient_batches(ingredient_id, expiry_date)
* orders(created_at)

---

**9) BACKEND DB SYNC**

Rules:

* DB is source of truth
* backend is logic layer

---

Sync Strategy:

* transactional operations
* atomic updates:
  order + inventory

---

Cache:

* short-lived cost cache

---

Invalidation:

* new batch
* spoilage
* recipe change

---

No duplicated logic in frontend

---

**10) LOGGING METRICS (SERVER)**

Use structured logs:

Format:

```json
{
  "level": "info",
  "route": "/orders",
  "user_id": "...",
  "action": "create_order",
  "duration_ms": 45
}
```

---

Track:

* request time
* errors
* AI latency
* DB latency

---

Levels:

* info
* warn
* error

---

Future:

* integrate Sentry
* log aggregation

---

**11) AUTHORIZATION (USERNAME / PASSWORD + ACCESS CONTROL)**

Identity:

* email = username

Authorization:

* JWT (user_id, role)

---

Rules:

* user accesses own data
* admin accesses all

---

RLS:

* enforced in DB

---

Backend:

* validates JWT
* applies role checks

---

Password reset:

* Supabase default flow

---

No custom auth logic

---

**12) SCALABLE DATABASE DESIGN + PERFORMANCE STRATEGY**

Target:

* 100k–500k rows

---

Indexes:

* primary keys
* foreign keys
* (created_by, created_at)
* (ingredient_id, expiry_date)

---

Queries:

* paginated
* no SELECT *

---

Performance:

* indexed reads < 10ms
* writes < 20ms

---

Optimizations:

* batch inserts
* avoid joins in hot paths
* use JSONB only for raw data

---

Scaling:

* read replicas
* partitioning (orders by date)

---

Encryption:

* TLS everywhere
* Supabase handles at rest

---

**13) STATE MANAGEMENT STRATEGY (PER UI ELEMENT)**

Global:

* authState
* toastState
* modalState

---

Forms:

* local state

---

Tables:

* server state (React Query)

---

Product Page:

* costMap
* marginMap

---

Input:

* parsedDataState
* previewState

---

Orders:

* orderFormState
* transactionState

---

Processing:

* OCR / TTS state

---

Principle:

* derived state not stored
* server is truth

---

**14) DEPLOYMENT STRATEGY (MVP → SCALABLE, ZERO-OVERHEAD FIRST)**

Architecture:

* Frontend → Vercel
* Backend → Railway
* DB/Auth → Supabase
* AI → Groq

---

CI/CD:

* GitHub → auto deploy

---

Env:

* managed via platform

---

No file storage:

* images processed in-memory

---

Scaling path:

1. add Redis (cache)
2. add queues
3. scale DB

---

Security:

* HTTPS
* JWT verification
* backend-only secrets

---

Monitoring:

* logs
* error tracking (future)

---

Goal:

* minimal infra
* maximum flexibility
* scale when needed
