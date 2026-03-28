# System Plan v1.0 — Nellai Aanantham Inventory Manager
> **Clean, Data-First Architecture for Homemade Bakery Operations**

---

## Overview

A streamlined inventory and order management system designed for a homemade bakery. Follows data-first principles with batch-aware inventory, dynamic costing, and AI-assisted data entry.

---

## 1. Architecture Summary

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│  Supabase   │
│   (React)   │     │  (Node.js)  │     │  (Postgres) │
│   Vercel    │     │   Railway   │     │    + Auth   │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │    Groq     │
                    │  (AI/OCR)   │
                    └─────────────┘
```

**Core Flow**: `Inventory → Recipes → Products → Orders → Transactions → Analytics`

---

## 2. Authentication & Security

| Layer | Implementation |
|-------|----------------|
| Auth Provider | Supabase Auth (email/password) |
| Password Storage | bcrypt hashing |
| API Security | JWT tokens on all requests |
| Data Protection | Row Level Security (RLS) |
| Secrets | Backend-only (Groq API, service keys) |
| Transport | HTTPS enforced everywhere |

**Rate Limiting**: AI endpoints, bulk import endpoints

---

## 3. User Roles (RBAC)

| Role | Access |
|------|--------|
| admin | Full system access |
| staff | Own data only (future) |
| auditor | Read-only (future) |

**Enforcement**: RLS policies + backend validation

---

## 4. Core User Flows

### 4.1 Inventory Management
```
Add Batch → [Manual | Voice | Image | CSV] → Preview → Confirm → Store
```

### 4.2 Recipe Creation
```
Select Ingredients → Define Quantities → Save Recipe
```

### 4.3 Product Setup
```
Select Recipe → Set Sale Price → System Calculates Cost → Save
```

### 4.4 Order Processing
```
Create Order (Draft) → Add Products → Bill → Deduct Inventory → Save Transaction
```

### 4.5 UPI Payment Flow
```
Upload Screenshot → AI Extract → Preview → Confirm → Link to Order
```

---

## 5. Pricing Model

| Type | Behavior |
|------|----------|
| **Sale Price** | Static, user-defined |
| **Cost Price** | Dynamic, batch-driven (FIFO) |
| **Margin** | Derived: `sale_price - cost_price` |

**Snapshot Rule**: Cost frozen at time of sale in `order_items.cost_at_sale`

---

## 6. Inventory Logic

### Batch Management
- Each ingredient tracked by batch
- Attributes: `qty_total`, `qty_remaining`, `unit_cost`, `expiry_date`

### Consumption Strategy
- **FIFO** (First In, First Out)
- Expiry-aware filtering (exclude expired batches)

### Spoilage Handling
1. Reduce batch quantity
2. Log event in `inventory_logs`
3. Exclude from future cost calculations

---

## 7. Database Schema

### Core Tables

```sql
-- Ingredients
ingredients (id, name, unit)

-- Batch tracking
ingredient_batches (
  id, ingredient_id, qty_total, qty_remaining,
  unit_cost, purchase_date, expiry_date
)

-- Recipes
recipes (id, name)
recipe_items (recipe_id, ingredient_id, quantity_required)

-- Products
products (id, name, recipe_id, sale_price)

-- Orders
orders (id, status, scheduled_for, created_by, created_at)
order_items (order_id, product_id, quantity, cost_at_sale)

-- Payments
transactions (order_id, txn_id, upi_id, amount, raw_json)

-- Audit
inventory_logs (batch_id, change_type, qty_change, created_at)
```

### Key Indexes
- `ingredient_batches(ingredient_id, expiry_date)`
- `orders(created_by, created_at)`

---

## 8. API Endpoints

### Inventory
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/inventory/batch` | Add new batch |
| POST | `/inventory/spoil` | Record spoilage |
| GET | `/inventory` | List all batches |

### Recipes & Products
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/recipes` | Create recipe |
| GET | `/recipes/:id` | Get recipe details |
| GET | `/products` | List products |
| GET | `/products/:id/cost` | Calculate dynamic cost |
| PATCH | `/products/:id/price` | Update sale price |

### Orders & Transactions
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/orders` | Create order (draft) |
| POST | `/orders/:id/bill` | Bill order + deduct inventory |
| GET | `/orders` | List orders |
| POST | `/transactions/extract` | AI extract from screenshot |
| POST | `/transactions` | Save transaction |

### AI/Parsing
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/parse/voice` | Voice → form data |
| POST | `/parse/image` | OCR → form data |
| POST | `/parse/bulk` | CSV → preview data |

### Export
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/export/orders` | Export to Excel/PDF |

---

## 9. UI Pages

| Page | Purpose |
|------|---------|
| Dashboard | Revenue, margins, key metrics |
| Inventory | Batch management, low stock alerts |
| Recipes | Recipe builder |
| Products | Product catalog with dynamic costs |
| Billing | Create and process orders |
| Orders | Order history, status tracking |
| Purchase View | Customer receipt preview |

---

## 10. Input Modes

| Mode | Description |
|------|-------------|
| Manual | Default form entry |
| Voice | Speech-to-text → form autofill |
| Image | OCR/AI extraction → form autofill |
| Bulk Import | CSV upload → preview → confirm |

**UX Rule**: All AI inputs → preview → confirm before save

---

## 11. State Management

| Scope | State | Library |
|-------|-------|---------|
| Global | auth, toast, modal | Zustand/Context |
| Server | tables, lists | React Query |
| Local | forms, filters | useState |
| Derived | cost, margin | Computed (not stored) |

---

## 12. Performance Targets

| Metric | Target |
|--------|--------|
| Indexed reads | < 10ms |
| Writes | < 20ms |
| AI extraction | < 3s |
| Scale | 100k-500k rows |

### Optimizations
- Paginated queries
- Batch inserts
- Short-lived cost cache
- No `SELECT *`

---

## 13. Deployment

| Component | Platform |
|-----------|----------|
| Frontend | Vercel |
| Backend | Railway |
| Database | Supabase |
| AI | Groq |

**CI/CD**: GitHub → Auto deploy on push

**No File Storage**: Images processed in-memory, only structured data saved

---

## 14. Future Scaling Path

1. Add Redis for caching
2. Add job queues for async processing
3. Read replicas for database
4. Partition orders by date

---

*Last Updated: March 2026*
