-- Enable RLS on all tables
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- Ingredients policies
CREATE POLICY "Users can view own ingredients" ON ingredients FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "Users can insert own ingredients" ON ingredients FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update own ingredients" ON ingredients FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can delete own ingredients" ON ingredients FOR DELETE USING (created_by = auth.uid());

-- Ingredient Batches policies
CREATE POLICY "Users can view own batches" ON ingredient_batches FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "Users can insert own batches" ON ingredient_batches FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update own batches" ON ingredient_batches FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can delete own batches" ON ingredient_batches FOR DELETE USING (created_by = auth.uid());

-- Recipes policies
CREATE POLICY "Users can view own recipes" ON recipes FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "Users can insert own recipes" ON recipes FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update own recipes" ON recipes FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can delete own recipes" ON recipes FOR DELETE USING (created_by = auth.uid());

-- Recipe Items policies (inherit from recipe)
CREATE POLICY "Users can view own recipe items" ON recipe_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM recipes WHERE recipes.id = recipe_items.recipe_id AND recipes.created_by = auth.uid()));
CREATE POLICY "Users can insert own recipe items" ON recipe_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM recipes WHERE recipes.id = recipe_items.recipe_id AND recipes.created_by = auth.uid()));
CREATE POLICY "Users can update own recipe items" ON recipe_items FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM recipes WHERE recipes.id = recipe_items.recipe_id AND recipes.created_by = auth.uid()));
CREATE POLICY "Users can delete own recipe items" ON recipe_items FOR DELETE 
  USING (EXISTS (SELECT 1 FROM recipes WHERE recipes.id = recipe_items.recipe_id AND recipes.created_by = auth.uid()));

-- Products policies
CREATE POLICY "Users can view own products" ON products FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "Users can insert own products" ON products FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update own products" ON products FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can delete own products" ON products FOR DELETE USING (created_by = auth.uid());

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "Users can insert own orders" ON orders FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can delete own orders" ON orders FOR DELETE USING (created_by = auth.uid());

-- Order Items policies (inherit from order)
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.created_by = auth.uid()));
CREATE POLICY "Users can insert own order items" ON order_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.created_by = auth.uid()));
CREATE POLICY "Users can update own order items" ON order_items FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.created_by = auth.uid()));
CREATE POLICY "Users can delete own order items" ON order_items FOR DELETE 
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.created_by = auth.uid()));

-- Transactions policies (inherit from order)
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = transactions.order_id AND orders.created_by = auth.uid()));
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = transactions.order_id AND orders.created_by = auth.uid()));

-- Inventory Logs policies (inherit from batch)
CREATE POLICY "Users can view own inventory logs" ON inventory_logs FOR SELECT 
  USING (EXISTS (SELECT 1 FROM ingredient_batches WHERE ingredient_batches.id = inventory_logs.batch_id AND ingredient_batches.created_by = auth.uid()));
CREATE POLICY "Users can insert own inventory logs" ON inventory_logs FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM ingredient_batches WHERE ingredient_batches.id = inventory_logs.batch_id AND ingredient_batches.created_by = auth.uid()));
