const express = require('express');
const { logRouteError } = require('../utils/log');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { checkRecipeAvailability } = require('../utils/fifo');

// GET / - List all products with recipe info
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        recipes (
          id,
          name,
          recipe_items (
            ingredient_id,
            quantity_required,
            ingredients (id, name, unit)
          )
        )
      `)
      .eq('created_by', req.user.id)
      .order('name', { ascending: true });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    logRouteError("products Error fetching products:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST / - Create product
router.post('/', async (req, res) => {
  try {
    const { name, recipe_id, sale_price } = req.body;

    if (!name || !recipe_id || sale_price === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'name, recipe_id, and sale_price are required' 
      });
    }

    // Verify recipe exists and belongs to user
    const { data: recipe, error: recipeError } = await supabaseAdmin
      .from('recipes')
      .select('id')
      .eq('id', recipe_id)
      .eq('created_by', req.user.id)
      .single();

    if (recipeError || !recipe) {
      return res.status(404).json({ success: false, error: 'Recipe not found' });
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        name,
        recipe_id,
        sale_price: parseFloat(sale_price),
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (err) {
    logRouteError("products Error creating product:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /low-stock — before /:id (schema may not have stock columns; return [] until modeled)
router.get('/low-stock', async (req, res) => {
  try {
    res.json({ success: true, data: [] });
  } catch (err) {
    logRouteError("products Error fetching low-stock products:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /:id - Get product with calculated cost
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        recipes (
          id,
          name,
          recipe_items (
            ingredient_id,
            quantity_required,
            ingredients (id, name, unit)
          )
        )
      `)
      .eq('id', id)
      .eq('created_by', req.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
      throw error;
    }

    // Calculate cost based on recipe ingredients and current batch prices
    let calculatedCost = null;
    let costBreakdown = null;
    
    if (product.recipe_id) {
      const availability = await checkRecipeAvailability(product.recipe_id, 1);
      if (availability.available !== undefined) {
        calculatedCost = availability.totalCost;
        costBreakdown = availability.items;
      }
    }

    res.json({ 
      success: true, 
      data: {
        ...product,
        calculated_cost: calculatedCost,
        cost_breakdown: costBreakdown,
        profit_margin: calculatedCost !== null 
          ? parseFloat(product.sale_price) - calculatedCost 
          : null
      }
    });
  } catch (err) {
    logRouteError("products Error fetching product:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /:id - Update product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, recipe_id, sale_price } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (recipe_id !== undefined) updates.recipe_id = recipe_id;
    if (sale_price !== undefined) updates.sale_price = parseFloat(sale_price);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    // If updating recipe_id, verify it exists
    if (recipe_id) {
      const { data: recipe, error: recipeError } = await supabaseAdmin
        .from('recipes')
        .select('id')
        .eq('id', recipe_id)
        .eq('created_by', req.user.id)
        .single();

      if (recipeError || !recipe) {
        return res.status(404).json({ success: false, error: 'Recipe not found' });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', id)
      .eq('created_by', req.user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
      throw error;
    }

    res.json({ success: true, data });
  } catch (err) {
    logRouteError("products Error updating product:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /:id - Delete product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id)
      .eq('created_by', req.user.id);

    if (error) throw error;

    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    logRouteError("products Error deleting product:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
