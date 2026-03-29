

-- ENUM types
CREATE TYPE order_status AS ENUM ('draft', 'scheduled', 'billed', 'cancelled');
CREATE TYPE inventory_change_type AS ENUM ('add', 'consume', 'spoil', 'adjust');

-- Ingredients
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ingredient Batches
CREATE TABLE ingredient_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  qty_total NUMERIC(10,2) NOT NULL,
  qty_remaining NUMERIC(10,2) NOT NULL,
  unit_cost NUMERIC(10,2) NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT qty_remaining_positive CHECK (qty_remaining >= 0)
);

-- Recipes
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipe Items
CREATE TABLE recipe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity_required NUMERIC(10,3) NOT NULL,
  UNIQUE(recipe_id, ingredient_id)
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  sale_price NUMERIC(10,2) NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status order_status DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  total_amount NUMERIC(10,2),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  billed_at TIMESTAMPTZ
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  cost_at_sale NUMERIC(10,2),
  price_at_sale NUMERIC(10,2)
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  txn_id TEXT,
  upi_id TEXT,
  amount NUMERIC(10,2) NOT NULL,
  raw_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Logs
CREATE TABLE inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES ingredient_batches(id) ON DELETE CASCADE,
  change_type inventory_change_type NOT NULL,
  qty_change NUMERIC(10,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
