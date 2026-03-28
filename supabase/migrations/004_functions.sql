-- Get valid batches for an ingredient (FIFO order)
CREATE OR REPLACE FUNCTION get_valid_batches(p_ingredient_id UUID, p_user_id UUID)
RETURNS TABLE (
  id UUID,
  qty_remaining NUMERIC,
  unit_cost NUMERIC,
  purchase_date DATE,
  expiry_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ib.id,
    ib.qty_remaining,
    ib.unit_cost,
    ib.purchase_date,
    ib.expiry_date
  FROM ingredient_batches ib
  WHERE ib.ingredient_id = p_ingredient_id
    AND ib.created_by = p_user_id
    AND ib.qty_remaining > 0
    AND (ib.expiry_date IS NULL OR ib.expiry_date > CURRENT_DATE)
  ORDER BY ib.purchase_date ASC, ib.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Consume from a batch with logging
CREATE OR REPLACE FUNCTION consume_batch(
  p_batch_id UUID,
  p_amount NUMERIC,
  p_note TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_qty NUMERIC;
BEGIN
  -- Get current quantity
  SELECT qty_remaining INTO v_current_qty
  FROM ingredient_batches
  WHERE id = p_batch_id
  FOR UPDATE;
  
  IF v_current_qty IS NULL THEN
    RAISE EXCEPTION 'Batch not found';
  END IF;
  
  IF v_current_qty < p_amount THEN
    RAISE EXCEPTION 'Insufficient quantity in batch';
  END IF;
  
  -- Deduct quantity
  UPDATE ingredient_batches
  SET qty_remaining = qty_remaining - p_amount
  WHERE id = p_batch_id;
  
  -- Log the consumption
  INSERT INTO inventory_logs (batch_id, change_type, qty_change, note)
  VALUES (p_batch_id, 'consume', -p_amount, p_note);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate dynamic product cost based on current batch prices
CREATE OR REPLACE FUNCTION calculate_product_cost(p_product_id UUID, p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_recipe_id UUID;
  v_total_cost NUMERIC := 0;
  v_item RECORD;
  v_batch RECORD;
  v_needed NUMERIC;
  v_consumed NUMERIC;
BEGIN
  -- Get recipe for product
  SELECT recipe_id INTO v_recipe_id
  FROM products
  WHERE id = p_product_id AND created_by = p_user_id;
  
  IF v_recipe_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- For each ingredient in recipe
  FOR v_item IN 
    SELECT ri.ingredient_id, ri.quantity_required
    FROM recipe_items ri
    WHERE ri.recipe_id = v_recipe_id
  LOOP
    v_needed := v_item.quantity_required;
    v_consumed := 0;
    
    -- Calculate cost from valid batches (FIFO)
    FOR v_batch IN 
      SELECT * FROM get_valid_batches(v_item.ingredient_id, p_user_id)
    LOOP
      IF v_consumed >= v_needed THEN
        EXIT;
      END IF;
      
      IF v_batch.qty_remaining >= (v_needed - v_consumed) THEN
        v_total_cost := v_total_cost + ((v_needed - v_consumed) * v_batch.unit_cost);
        v_consumed := v_needed;
      ELSE
        v_total_cost := v_total_cost + (v_batch.qty_remaining * v_batch.unit_cost);
        v_consumed := v_consumed + v_batch.qty_remaining;
      END IF;
    END LOOP;
    
    -- If not enough inventory, use last known cost or 0
    IF v_consumed < v_needed THEN
      -- Could raise warning or use estimated cost
      NULL;
    END IF;
  END LOOP;
  
  RETURN ROUND(v_total_cost, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
