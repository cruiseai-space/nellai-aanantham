-- =============================================================================
-- Demo inventory data for Nellai Aanantham (runs after migrations on db reset)
-- =============================================================================
-- Rows are owned by your first Auth user so the Express API (filters by JWT
-- sub) returns them after you log in.
--
-- Resolution order for owner id:
--   1) auth.users where email = admin@nellai.com (matches backend seed-admin.js)
--   2) oldest auth.users row by created_at
--
-- If no users exist yet (fresh db reset), this file no-ops with a NOTICE.
-- Create a user (sign up in the app or run `npm run seed:admin` in backend),
-- then run `supabase db reset` again OR paste this file into SQL Editor.
-- =============================================================================

DO $$
DECLARE
  owner uuid;
  i1 uuid;
  i2 uuid;
  i3 uuid;
  b1 uuid;
  b2 uuid;
  r1 uuid;
  p1 uuid;
  o1 uuid;
BEGIN
  SELECT id INTO owner
  FROM auth.users
  WHERE email = 'cli.user.1775390264632@nellai.local'
  LIMIT 1;

  IF owner IS NULL THEN
    SELECT id INTO owner
    FROM auth.users
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF owner IS NULL THEN
    RAISE NOTICE 'nellai-aanantham seed: skipped — no rows in auth.users. Create admin@nellai.com (npm run seed:admin) or sign up, then re-run seed.';
    RETURN;
  END IF;

  INSERT INTO ingredients (name, unit, created_by)
  VALUES ('Wheat Flour', 'kg', owner)
  RETURNING id INTO i1;

  INSERT INTO ingredients (name, unit, created_by)
  VALUES ('Caster Sugar', 'kg', owner)
  RETURNING id INTO i2;

  INSERT INTO ingredients (name, unit, created_by)
  VALUES ('Butter', 'kg', owner)
  RETURNING id INTO i3;

  INSERT INTO ingredient_batches (
    ingredient_id, qty_total, qty_remaining, unit_cost,
    purchase_date, expiry_date, created_by
  ) VALUES (
    i1, 25, 4, 52,
    CURRENT_DATE - 20, CURRENT_DATE, owner
  ) RETURNING id INTO b1;

  INSERT INTO ingredient_batches (
    ingredient_id, qty_total, qty_remaining, unit_cost,
    purchase_date, expiry_date, created_by
  ) VALUES (
    i2, 40, 35, 48,
    CURRENT_DATE - 15, CURRENT_DATE + 200, owner
  ) RETURNING id INTO b2;

  INSERT INTO inventory_logs (batch_id, change_type, qty_change, note)
  VALUES (b1, 'add', 25, 'Demo seed batch');

  INSERT INTO recipes (name, created_by)
  VALUES ('Vanilla Sponge', owner)
  RETURNING id INTO r1;

  INSERT INTO recipe_items (recipe_id, ingredient_id, quantity_required)
  VALUES
    (r1, i1, 0.5),
    (r1, i2, 0.3),
    (r1, i3, 0.2);

  INSERT INTO products (name, recipe_id, sale_price, created_by)
  VALUES ('Vanilla Celebration Cake', r1, 899.00, owner)
  RETURNING id INTO p1;

  INSERT INTO orders (status, scheduled_for, total_amount, created_by)
  VALUES (
    'draft',
    date_trunc('day', now()) + interval '14 hours',
    899.00,
    owner
  ) RETURNING id INTO o1;

  INSERT INTO order_items (order_id, product_id, quantity, cost_at_sale, price_at_sale)
  VALUES (o1, p1, 1, 320.00, 899.00);

  INSERT INTO orders (status, scheduled_for, total_amount, created_by)
  VALUES (
    'scheduled',
    date_trunc('day', now()) + interval '18 hours',
    450.00,
    owner
  );

  INSERT INTO transactions (order_id, txn_id, upi_id, amount)
  VALUES (o1, 'DEMO-UPI-001', 'bakery@upi', 200.00);

  RAISE NOTICE 'nellai-aanantham seed: demo rows created for user %', owner;
END $$;
