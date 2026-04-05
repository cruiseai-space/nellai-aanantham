const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { logRouteError } = require('../utils/log');

// GET / - List all ingredients for user
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('ingredients')
      .select('*')
      .eq('created_by', req.user.id)
      .order('name', { ascending: true });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    logRouteError("ingredients Error fetching ingredients:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST / - Create ingredient
router.post('/', async (req, res) => {
  try {
    const { name, unit } = req.body;

    if (!name || !unit) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and unit are required' 
      });
    }

    const { data, error } = await supabaseAdmin
      .from('ingredients')
      .insert({
        name,
        unit,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (err) {
    logRouteError("ingredients Error creating ingredient:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /low-stock — must be registered before /:id (otherwise "low-stock" is parsed as an id)
router.get('/low-stock', async (req, res) => {
  try {
    const { data: ingredients, error: ingErr } = await supabaseAdmin
      .from('ingredients')
      .select('*')
      .eq('created_by', req.user.id);

    if (ingErr) throw ingErr;

    const { data: batches, error: batchErr } = await supabaseAdmin
      .from('ingredient_batches')
      .select('ingredient_id, qty_remaining')
      .eq('created_by', req.user.id);

    if (batchErr) throw batchErr;

    const byIngredient = {};
    for (const b of batches || []) {
      const id = b.ingredient_id;
      byIngredient[id] = (byIngredient[id] || 0) + parseFloat(b.qty_remaining);
    }

    const DEFAULT_LOW_THRESHOLD = 5;
    const rows = (ingredients || []).map((ing) => {
      const current = byIngredient[ing.id] ?? 0;
      const minStock =
        ing.min_stock != null ? parseFloat(ing.min_stock) : DEFAULT_LOW_THRESHOLD;
      return {
        ...ing,
        current_stock: current,
        min_stock: ing.min_stock != null ? parseFloat(ing.min_stock) : 0,
        _threshold: minStock,
      };
    });

    const low = rows.filter((ing) => ing.current_stock <= ing._threshold).map((ing) => {
      const { _threshold, ...rest } = ing;
      return rest;
    });

    res.json({ success: true, data: low });
  } catch (err) {
    logRouteError("ingredients Error fetching low-stock ingredients:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /:id - Get single ingredient with batches
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: ingredient, error: ingredientError } = await supabaseAdmin
      .from('ingredients')
      .select('*')
      .eq('id', id)
      .eq('created_by', req.user.id)
      .single();

    if (ingredientError) {
      if (ingredientError.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Ingredient not found' });
      }
      throw ingredientError;
    }

    // Get batches for this ingredient
    const { data: batches, error: batchError } = await supabaseAdmin
      .from('ingredient_batches')
      .select('*')
      .eq('ingredient_id', id)
      .order('purchase_date', { ascending: true });

    if (batchError) throw batchError;

    res.json({ 
      success: true, 
      data: { 
        ...ingredient, 
        batches: batches || [] 
      } 
    });
  } catch (err) {
    logRouteError("ingredients Error fetching ingredient:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /:id - Update ingredient
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, unit } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (unit !== undefined) updates.unit = unit;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No fields to update' 
      });
    }

    const { data, error } = await supabaseAdmin
      .from('ingredients')
      .update(updates)
      .eq('id', id)
      .eq('created_by', req.user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Ingredient not found' });
      }
      throw error;
    }

    res.json({ success: true, data });
  } catch (err) {
    logRouteError("ingredients Error updating ingredient:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /:id - Delete ingredient
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('ingredients')
      .delete()
      .eq('id', id)
      .eq('created_by', req.user.id);

    if (error) throw error;

    res.json({ success: true, message: 'Ingredient deleted' });
  } catch (err) {
    logRouteError("ingredients Error deleting ingredient:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
