const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { consumeIngredientFIFO, checkRecipeAvailability } = require('../utils/fifo');
const { logRouteError } = require('../utils/log');
const { respondRouteError } = require('../utils/respondRouteError');

// GET / - List all orders with items
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          cost_at_sale,
          price_at_sale,
          products (id, name, sale_price)
        )
      `)
      .eq('created_by', req.user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    respondRouteError(res, err, 'orders Error fetching orders:');
  }
});

// POST / - Create order (status='draft')
router.post('/', async (req, res) => {
  try {
    const { scheduled_for } = req.body;

    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert({
        status: 'draft',
        scheduled_for: scheduled_for || null,
        total_amount: 0,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (err) {
    respondRouteError(res, err, 'orders Error creating order:');
  }
});

// GET /today — before /:id
router.get('/today', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          cost_at_sale,
          price_at_sale,
          products (id, name, sale_price)
        )
      `)
      .eq('created_by', req.user.id)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    const today = new Date().toISOString().slice(0, 10);
    const filtered = (data || []).filter((o) => {
      const d = o.scheduled_for || o.created_at;
      return d && String(d).slice(0, 10) === today;
    });

    const mapped = filtered.map((o) => ({
      ...o,
      customer_name: o.customer_name ?? 'Customer',
      delivery_date: o.delivery_date ?? (o.scheduled_for || o.created_at),
      delivery_time: o.delivery_time ?? null,
      total_amount: o.total_amount ?? 0,
      advance_paid: o.advance_paid ?? 0,
      notes: o.notes ?? null,
      status: o.status,
    }));

    res.json({ success: true, data: mapped });
  } catch (err) {
    respondRouteError(res, err, 'orders Error fetching today orders:');
  }
});

// GET /status/:status — before /:id
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          cost_at_sale,
          price_at_sale,
          products (id, name, sale_price)
        )
      `)
      .eq('created_by', req.user.id)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (err) {
    respondRouteError(res, err, 'orders Error fetching orders by status:');
  }
});

// GET /:id - Get order with items, products, costs
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          cost_at_sale,
          price_at_sale,
          products (
            id, 
            name, 
            sale_price,
            recipes (
              id,
              name,
              recipe_items (
                ingredient_id,
                quantity_required,
                ingredients (id, name, unit)
              )
            )
          )
        ),
        transactions (id, txn_id, upi_id, amount)
      `)
      .eq('id', id)
      .eq('created_by', req.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      throw error;
    }

    res.json({ success: true, data });
  } catch (err) {
    respondRouteError(res, err, 'orders Error fetching order:');
  }
});

// PUT /:id - Update order (status, scheduled_for)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, scheduled_for } = req.body;

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (scheduled_for !== undefined) updates.scheduled_for = scheduled_for;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', id)
      .eq('created_by', req.user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      throw error;
    }

    res.json({ success: true, data });
  } catch (err) {
    respondRouteError(res, err, 'orders Error updating order:');
  }
});

// DELETE /:id - Delete order
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if order is billed
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('id', id)
      .eq('created_by', req.user.id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.status === 'billed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete billed order' 
      });
    }

    // Delete order items first
    await supabaseAdmin
      .from('order_items')
      .delete()
      .eq('order_id', id);

    // Delete order
    const { error } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    respondRouteError(res, err, 'orders Error deleting order:');
  }
});

// POST /:id/items - Add item to order
router.post('/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity || quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'product_id and valid quantity are required' 
      });
    }

    // Verify order exists, belongs to user, and is not billed
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .eq('id', id)
      .eq('created_by', req.user.id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.status === 'billed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot modify billed order' 
      });
    }

    // Verify product exists and get price
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, sale_price')
      .eq('id', product_id)
      .eq('created_by', req.user.id)
      .single();

    if (productError || !product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Check if item already exists in order
    const { data: existingItem } = await supabaseAdmin
      .from('order_items')
      .select('id, quantity')
      .eq('order_id', id)
      .eq('product_id', product_id)
      .single();

    let orderItem;
    if (existingItem) {
      // Update existing item
      const { data, error } = await supabaseAdmin
        .from('order_items')
        .update({ quantity: existingItem.quantity + parseInt(quantity) })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (error) throw error;
      orderItem = data;
    } else {
      // Create new item
      const { data, error } = await supabaseAdmin
        .from('order_items')
        .insert({
          order_id: id,
          product_id,
          quantity: parseInt(quantity),
          price_at_sale: parseFloat(product.sale_price)
        })
        .select()
        .single();

      if (error) throw error;
      orderItem = data;
    }

    // Update order total
    await updateOrderTotal(id);

    res.status(201).json({ success: true, data: orderItem });
  } catch (err) {
    respondRouteError(res, err, 'orders Error adding order item:');
  }
});

// DELETE /:id/items/:itemId - Remove item from order
router.delete('/:id/items/:itemId', async (req, res) => {
  try {
    const { id, itemId } = req.params;

    // Verify order belongs to user and is not billed
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .eq('id', id)
      .eq('created_by', req.user.id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.status === 'billed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot modify billed order' 
      });
    }

    const { error } = await supabaseAdmin
      .from('order_items')
      .delete()
      .eq('id', itemId)
      .eq('order_id', id);

    if (error) throw error;

    // Update order total
    await updateOrderTotal(id);

    res.json({ success: true, message: 'Item removed' });
  } catch (err) {
    respondRouteError(res, err, 'orders Error removing order item:');
  }
});

// POST /:id/bill - Bill order (consume inventory via FIFO, snapshot costs)
router.post('/:id/bill', async (req, res) => {
  try {
    const { id } = req.params;

    // Get order with items and products
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          products (
            id,
            recipe_id,
            sale_price,
            recipes (
              recipe_items (
                ingredient_id,
                quantity_required
              )
            )
          )
        )
      `)
      .eq('id', id)
      .eq('created_by', req.user.id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.status === 'billed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Order already billed' 
      });
    }

    if (!order.order_items || order.order_items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Order has no items' 
      });
    }

    // Pre-check: verify all ingredients are available
    const ingredientRequirements = {};
    
    for (const item of order.order_items) {
      const recipeItems = item.products?.recipes?.recipe_items || [];
      
      for (const recipeItem of recipeItems) {
        const needed = parseFloat(recipeItem.quantity_required) * item.quantity;
        const ingredientId = recipeItem.ingredient_id;
        
        if (ingredientRequirements[ingredientId]) {
          ingredientRequirements[ingredientId] += needed;
        } else {
          ingredientRequirements[ingredientId] = needed;
        }
      }
    }

    // Check availability for all ingredients
    for (const [ingredientId, quantity] of Object.entries(ingredientRequirements)) {
      const availability = await checkRecipeAvailability(ingredientId, quantity);
      if (availability.error || !availability.available) {
        return res.status(400).json({
          success: false,
          error: `Insufficient inventory for ingredient`,
          details: availability.missing || availability.error
        });
      }
    }

    // Process each order item
    let totalCost = 0;
    let totalAmount = 0;
    const consumptionLog = [];

    for (const item of order.order_items) {
      const product = item.products;
      const recipeItems = product?.recipes?.recipe_items || [];
      let itemCost = 0;

      // Consume ingredients for this item
      for (const recipeItem of recipeItems) {
        const quantityNeeded = parseFloat(recipeItem.quantity_required) * item.quantity;
        
        const result = await consumeIngredientFIFO(
          recipeItem.ingredient_id,
          quantityNeeded,
          req.user.id,
          `Order #${id} - ${product.id}`
        );

        if (!result.success) {
          return res.status(400).json({
            success: false,
            error: `Failed to consume ingredient: ${result.error}`
          });
        }

        itemCost += result.totalCost;
        consumptionLog.push({
          ingredient_id: recipeItem.ingredient_id,
          quantity: quantityNeeded,
          cost: result.totalCost,
          batches: result.consumedBatches
        });
      }

      // Update order item with cost snapshot
      const { error: updateError } = await supabaseAdmin
        .from('order_items')
        .update({
          cost_at_sale: itemCost,
          price_at_sale: parseFloat(product.sale_price)
        })
        .eq('id', item.id);

      if (updateError) {
        logRouteError("orders Failed to update order item cost:", updateError);
      }

      totalCost += itemCost;
      totalAmount += parseFloat(product.sale_price) * item.quantity;
    }

    // Update order status and totals
    const { data: billedOrder, error: billError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'billed',
        total_amount: totalAmount,
        billed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (billError) throw billError;

    res.json({
      success: true,
      data: billedOrder,
      summary: {
        total_cost: totalCost,
        total_amount: totalAmount,
        profit: totalAmount - totalCost,
        consumption_log: consumptionLog
      }
    });
  } catch (err) {
    respondRouteError(res, err, 'orders Error billing order:');
  }
});

// Helper function to update order total
async function updateOrderTotal(orderId) {
  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('quantity, price_at_sale, products(sale_price)')
    .eq('order_id', orderId);

  let total = 0;
  if (items) {
    for (const item of items) {
      const price = item.price_at_sale || item.products?.sale_price || 0;
      total += price * item.quantity;
    }
  }

  await supabaseAdmin
    .from('orders')
    .update({ total_amount: total })
    .eq('id', orderId);
}

module.exports = router;
