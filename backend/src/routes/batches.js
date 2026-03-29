const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { consumeIngredientFIFO } = require('../utils/fifo');

// GET / - List all batches (with ingredient name)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('ingredient_batches')
      .select(`
        *,
        ingredients (id, name, unit)
      `)
      .eq('created_by', req.user.id)
      .order('purchase_date', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching batches:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST / - Add batch (also creates inventory_log with change_type='add')
router.post('/', async (req, res) => {
  try {
    const { ingredient_id, qty_total, unit_cost, purchase_date, expiry_date } = req.body;

    if (!ingredient_id || qty_total === undefined || unit_cost === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'ingredient_id, qty_total, and unit_cost are required' 
      });
    }

    // Verify ingredient exists and belongs to user
    const { data: ingredient, error: ingredientError } = await supabaseAdmin
      .from('ingredients')
      .select('id')
      .eq('id', ingredient_id)
      .eq('created_by', req.user.id)
      .single();

    if (ingredientError || !ingredient) {
      return res.status(404).json({ success: false, error: 'Ingredient not found' });
    }

    // Create batch
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('ingredient_batches')
      .insert({
        ingredient_id,
        qty_total: parseFloat(qty_total),
        qty_remaining: parseFloat(qty_total),
        unit_cost: parseFloat(unit_cost),
        purchase_date: purchase_date || new Date().toISOString().split('T')[0],
        expiry_date: expiry_date || null,
        created_by: req.user.id
      })
      .select()
      .single();

    if (batchError) throw batchError;

    // Create inventory log
    const { error: logError } = await supabaseAdmin
      .from('inventory_logs')
      .insert({
        batch_id: batch.id,
        change_type: 'add',
        qty_change: parseFloat(qty_total),
        note: 'Initial batch creation'
      });

    if (logError) {
      console.error('Failed to create inventory log:', logError);
    }

    res.status(201).json({ success: true, data: batch });
  } catch (err) {
    console.error('Error creating batch:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /:id - Get single batch
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('ingredient_batches')
      .select(`
        *,
        ingredients (id, name, unit),
        inventory_logs (id, change_type, qty_change, note, created_at)
      `)
      .eq('id', id)
      .eq('created_by', req.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Batch not found' });
      }
      throw error;
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching batch:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /:id - Update batch
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { qty_total, qty_remaining, unit_cost, purchase_date, expiry_date } = req.body;

    const updates = {};
    if (qty_total !== undefined) updates.qty_total = parseFloat(qty_total);
    if (qty_remaining !== undefined) updates.qty_remaining = parseFloat(qty_remaining);
    if (unit_cost !== undefined) updates.unit_cost = parseFloat(unit_cost);
    if (purchase_date !== undefined) updates.purchase_date = purchase_date;
    if (expiry_date !== undefined) updates.expiry_date = expiry_date;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    const { data, error } = await supabaseAdmin
      .from('ingredient_batches')
      .update(updates)
      .eq('id', id)
      .eq('created_by', req.user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Batch not found' });
      }
      throw error;
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error('Error updating batch:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /:id - Delete batch
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('ingredient_batches')
      .delete()
      .eq('id', id)
      .eq('created_by', req.user.id);

    if (error) throw error;

    res.json({ success: true, message: 'Batch deleted' });
  } catch (err) {
    console.error('Error deleting batch:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /:id/consume - Consume from batch (manual consumption)
router.post('/:id/consume', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, note } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid quantity is required' 
      });
    }

    // Get batch
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('ingredient_batches')
      .select('*')
      .eq('id', id)
      .eq('created_by', req.user.id)
      .single();

    if (batchError || !batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    const qtyRemaining = parseFloat(batch.qty_remaining);
    const qtyToConsume = parseFloat(quantity);

    if (qtyToConsume > qtyRemaining) {
      return res.status(400).json({ 
        success: false, 
        error: `Insufficient quantity. Available: ${qtyRemaining}` 
      });
    }

    // Update batch
    const { data: updatedBatch, error: updateError } = await supabaseAdmin
      .from('ingredient_batches')
      .update({ qty_remaining: qtyRemaining - qtyToConsume })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create inventory log
    const { error: logError } = await supabaseAdmin
      .from('inventory_logs')
      .insert({
        batch_id: id,
        change_type: 'consume',
        qty_change: -qtyToConsume,
        note: note || 'Manual consumption'
      });

    if (logError) {
      console.error('Failed to create inventory log:', logError);
    }

    res.json({ 
      success: true, 
      data: updatedBatch,
      consumed: qtyToConsume,
      cost: qtyToConsume * parseFloat(batch.unit_cost)
    });
  } catch (err) {
    console.error('Error consuming from batch:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /consume-fifo - Consume ingredient using FIFO logic
router.post('/consume-fifo', async (req, res) => {
  try {
    const { ingredient_id, quantity, note } = req.body;

    if (!ingredient_id || !quantity || quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'ingredient_id and valid quantity are required' 
      });
    }

    const result = await consumeIngredientFIFO(
      ingredient_id, 
      parseFloat(quantity), 
      req.user.id, 
      note || 'Manual FIFO consumption'
    );

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error in FIFO consumption:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
