-- Performance indexes
CREATE INDEX idx_batches_ingredient_expiry ON ingredient_batches(ingredient_id, expiry_date);
CREATE INDEX idx_batches_remaining ON ingredient_batches(qty_remaining) WHERE qty_remaining > 0;
CREATE INDEX idx_orders_user_date ON orders(created_by, created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_inventory_logs_batch ON inventory_logs(batch_id, created_at DESC);
CREATE INDEX idx_products_user ON products(created_by);
CREATE INDEX idx_recipes_user ON recipes(created_by);
