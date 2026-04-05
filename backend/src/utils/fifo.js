const { supabaseAdmin } = require('../config/supabase');
const { logRouteError } = require('./log');

/**
 * FIFO Consumption Logic
 * Consumes ingredients from the oldest non-expired batches first
 */

/**
 * Consume ingredient from batches using FIFO
 * @param {string} ingredientId - The ingredient ID to consume
 * @param {number} quantityNeeded - Total quantity to consume
 * @param {string} userId - The user ID performing the action
 * @param {string} note - Note for inventory log
 * @returns {Object} - { success, totalCost, consumedBatches, error }
 */
async function consumeIngredientFIFO(ingredientId, quantityNeeded, userId, note = 'Order consumption') {
  try {
    // Get available batches ordered by purchase_date (FIFO), excluding expired
    const today = new Date().toISOString().split('T')[0];
    
    const { data: batches, error: batchError } = await supabaseAdmin
      .from('ingredient_batches')
      .select('*')
      .eq('ingredient_id', ingredientId)
      .gt('qty_remaining', 0)
      .or(`expiry_date.is.null,expiry_date.gte.${today}`)
      .order('purchase_date', { ascending: true });

    if (batchError) {
      throw new Error(`Failed to fetch batches: ${batchError.message}`);
    }

    if (!batches || batches.length === 0) {
      throw new Error(`No available batches for ingredient ${ingredientId}`);
    }

    // Calculate total available
    const totalAvailable = batches.reduce((sum, b) => sum + parseFloat(b.qty_remaining), 0);
    
    if (totalAvailable < quantityNeeded) {
      throw new Error(`Insufficient stock: need ${quantityNeeded}, available ${totalAvailable}`);
    }

    let remaining = quantityNeeded;
    let totalCost = 0;
    const consumedBatches = [];
    const inventoryLogs = [];

    // Consume from batches in FIFO order
    for (const batch of batches) {
      if (remaining <= 0) break;

      const available = parseFloat(batch.qty_remaining);
      const toConsume = Math.min(available, remaining);
      const newRemaining = available - toConsume;
      const cost = toConsume * parseFloat(batch.unit_cost);

      // Update batch
      const { error: updateError } = await supabaseAdmin
        .from('ingredient_batches')
        .update({ qty_remaining: newRemaining })
        .eq('id', batch.id);

      if (updateError) {
        throw new Error(`Failed to update batch ${batch.id}: ${updateError.message}`);
      }

      // Create inventory log
      const { error: logError } = await supabaseAdmin
        .from('inventory_logs')
        .insert({
          batch_id: batch.id,
          change_type: 'consume',
          qty_change: -toConsume,
          note: note
        });

      if (logError) {
        logRouteError('fifo:inventory_log', logError);
      }

      consumedBatches.push({
        batch_id: batch.id,
        quantity: toConsume,
        unit_cost: parseFloat(batch.unit_cost),
        cost: cost
      });

      totalCost += cost;
      remaining -= toConsume;
    }

    return {
      success: true,
      totalCost,
      consumedBatches
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Calculate cost for an ingredient without consuming
 * @param {string} ingredientId - The ingredient ID
 * @param {number} quantity - Quantity to calculate cost for
 * @returns {Object} - { success, estimatedCost, error }
 */
async function calculateIngredientCost(ingredientId, quantity) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: batches, error } = await supabaseAdmin
      .from('ingredient_batches')
      .select('qty_remaining, unit_cost')
      .eq('ingredient_id', ingredientId)
      .gt('qty_remaining', 0)
      .or(`expiry_date.is.null,expiry_date.gte.${today}`)
      .order('purchase_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch batches: ${error.message}`);
    }

    if (!batches || batches.length === 0) {
      return { success: true, estimatedCost: 0, available: 0 };
    }

    let remaining = quantity;
    let totalCost = 0;
    let totalAvailable = 0;

    for (const batch of batches) {
      totalAvailable += parseFloat(batch.qty_remaining);
      if (remaining <= 0) continue;

      const available = parseFloat(batch.qty_remaining);
      const toConsume = Math.min(available, remaining);
      totalCost += toConsume * parseFloat(batch.unit_cost);
      remaining -= toConsume;
    }

    return {
      success: true,
      estimatedCost: totalCost,
      available: totalAvailable,
      sufficient: totalAvailable >= quantity
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if all ingredients for a recipe are available
 * @param {string} recipeId - The recipe ID
 * @param {number} quantity - Number of recipe units needed
 * @returns {Object} - { available, missing, costs }
 */
async function checkRecipeAvailability(recipeId, quantity = 1) {
  try {
    // Get recipe items with ingredient details
    const { data: items, error } = await supabaseAdmin
      .from('recipe_items')
      .select(`
        ingredient_id,
        quantity_required,
        ingredients (id, name, unit)
      `)
      .eq('recipe_id', recipeId);

    if (error) {
      throw new Error(`Failed to fetch recipe items: ${error.message}`);
    }

    if (!items || items.length === 0) {
      return { available: true, missing: [], totalCost: 0, items: [] };
    }

    const missing = [];
    const itemCosts = [];
    let totalCost = 0;

    for (const item of items) {
      const needed = parseFloat(item.quantity_required) * quantity;
      const costResult = await calculateIngredientCost(item.ingredient_id, needed);

      if (!costResult.success) {
        missing.push({
          ingredient_id: item.ingredient_id,
          ingredient_name: item.ingredients?.name,
          needed,
          available: 0,
          error: costResult.error
        });
        continue;
      }

      if (!costResult.sufficient) {
        missing.push({
          ingredient_id: item.ingredient_id,
          ingredient_name: item.ingredients?.name,
          needed,
          available: costResult.available
        });
      }

      itemCosts.push({
        ingredient_id: item.ingredient_id,
        ingredient_name: item.ingredients?.name,
        quantity_needed: needed,
        cost: costResult.estimatedCost
      });

      totalCost += costResult.estimatedCost;
    }

    return {
      available: missing.length === 0,
      missing,
      totalCost,
      items: itemCosts
    };
  } catch (error) {
    return {
      available: false,
      error: error.message
    };
  }
}

module.exports = {
  consumeIngredientFIFO,
  calculateIngredientCost,
  checkRecipeAvailability
};
