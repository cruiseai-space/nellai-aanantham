const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

// GET / - List all recipes with items
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('recipes')
      .select(`
        *,
        recipe_items (
          id,
          ingredient_id,
          quantity_required,
          ingredients (id, name, unit)
        )
      `)
      .eq('created_by', req.user.id)
      .order('name', { ascending: true });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching recipes:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST / - Create recipe with items
router.post('/', async (req, res) => {
  try {
    const { name, items } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    // Create recipe
    const { data: recipe, error: recipeError } = await supabaseAdmin
      .from('recipes')
      .insert({
        name,
        created_by: req.user.id
      })
      .select()
      .single();

    if (recipeError) throw recipeError;

    // Add recipe items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      const recipeItems = items.map(item => ({
        recipe_id: recipe.id,
        ingredient_id: item.ingredient_id,
        quantity_required: parseFloat(item.quantity_required)
      }));

      const { error: itemsError } = await supabaseAdmin
        .from('recipe_items')
        .insert(recipeItems);

      if (itemsError) {
        // Rollback recipe creation
        await supabaseAdmin.from('recipes').delete().eq('id', recipe.id);
        throw itemsError;
      }
    }

    // Fetch complete recipe with items
    const { data: completeRecipe, error: fetchError } = await supabaseAdmin
      .from('recipes')
      .select(`
        *,
        recipe_items (
          id,
          ingredient_id,
          quantity_required,
          ingredients (id, name, unit)
        )
      `)
      .eq('id', recipe.id)
      .single();

    if (fetchError) throw fetchError;

    res.status(201).json({ success: true, data: completeRecipe });
  } catch (err) {
    console.error('Error creating recipe:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /:id - Get recipe with items and ingredient details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('recipes')
      .select(`
        *,
        recipe_items (
          id,
          ingredient_id,
          quantity_required,
          ingredients (id, name, unit)
        )
      `)
      .eq('id', id)
      .eq('created_by', req.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Recipe not found' });
      }
      throw error;
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching recipe:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /:id - Update recipe and items
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, items } = req.body;

    // Update recipe name if provided
    if (name) {
      const { error: recipeError } = await supabaseAdmin
        .from('recipes')
        .update({ name })
        .eq('id', id)
        .eq('created_by', req.user.id);

      if (recipeError) throw recipeError;
    }

    // Update items if provided (replace all)
    if (items && Array.isArray(items)) {
      // Delete existing items
      const { error: deleteError } = await supabaseAdmin
        .from('recipe_items')
        .delete()
        .eq('recipe_id', id);

      if (deleteError) throw deleteError;

      // Insert new items
      if (items.length > 0) {
        const recipeItems = items.map(item => ({
          recipe_id: id,
          ingredient_id: item.ingredient_id,
          quantity_required: parseFloat(item.quantity_required)
        }));

        const { error: insertError } = await supabaseAdmin
          .from('recipe_items')
          .insert(recipeItems);

        if (insertError) throw insertError;
      }
    }

    // Fetch updated recipe
    const { data, error } = await supabaseAdmin
      .from('recipes')
      .select(`
        *,
        recipe_items (
          id,
          ingredient_id,
          quantity_required,
          ingredients (id, name, unit)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    console.error('Error updating recipe:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /:id - Delete recipe
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete recipe items first (due to foreign key)
    await supabaseAdmin
      .from('recipe_items')
      .delete()
      .eq('recipe_id', id);

    // Delete recipe
    const { error } = await supabaseAdmin
      .from('recipes')
      .delete()
      .eq('id', id)
      .eq('created_by', req.user.id);

    if (error) throw error;

    res.json({ success: true, message: 'Recipe deleted' });
  } catch (err) {
    console.error('Error deleting recipe:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
