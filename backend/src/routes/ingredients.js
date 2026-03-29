const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

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
    console.error('Error fetching ingredients:', err);
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
    console.error('Error creating ingredient:', err);
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
    console.error('Error fetching ingredient:', err);
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
    console.error('Error updating ingredient:', err);
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
    console.error('Error deleting ingredient:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
