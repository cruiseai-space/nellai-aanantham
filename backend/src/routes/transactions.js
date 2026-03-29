const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

// GET / - List transactions
router.get('/', async (req, res) => {
  try {
    const { order_id } = req.query;

    let query = supabaseAdmin
      .from('transactions')
      .select(`
        *,
        orders (id, status, total_amount, created_at)
      `)
      .order('created_at', { ascending: false });

    // Filter by order if provided
    if (order_id) {
      query = query.eq('order_id', order_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST / - Create transaction (link to order)
router.post('/', async (req, res) => {
  try {
    const { order_id, txn_id, upi_id, amount, raw_json } = req.body;

    if (!order_id || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'order_id and amount are required' 
      });
    }

    // Verify order exists and belongs to user
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status, total_amount, created_by')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Verify user owns this order
    if (order.created_by !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const { data, error } = await supabaseAdmin
      .from('transactions')
      .insert({
        order_id,
        txn_id: txn_id || null,
        upi_id: upi_id || null,
        amount: parseFloat(amount),
        raw_json: raw_json || null
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('Error creating transaction:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /:id - Get transaction
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select(`
        *,
        orders (
          id, 
          status, 
          total_amount, 
          created_by,
          created_at,
          order_items (
            id,
            quantity,
            cost_at_sale,
            price_at_sale,
            products (id, name)
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Transaction not found' });
      }
      throw error;
    }

    // Verify user owns the related order
    if (data.orders?.created_by !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching transaction:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
