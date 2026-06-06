import { 
  sendInventoryUpdateNotification, 
  checkAndNotifyLowStock 
} from './emailService.js';

export const dispatchGoods = async (client, payload, userId) => {
    const { finished_good_id, quantity_dispatched, customer_id, notes } = payload;

    // 1. Check sufficient stock
    const good = await client.query(
        'SELECT quantity_in_stock FROM finished_goods WHERE id = $1',
        [finished_good_id]
    );
    if (!good.rows[0]) throw Object.assign(new Error('Finished good not found'), { status: 404 });
    if (good.rows[0].quantity_in_stock < quantity_dispatched) {
        throw Object.assign(new Error('Insufficient stock for dispatch'), { status: 400 });
    }

    // 2. Insert dispatch record
    const dispatch = await client.query(
        `INSERT INTO dispatches (finished_good_id, customer_id, quantity_dispatched, dispatched_by, notes, status)
         VALUES ($1,$2,$3,$4,$5,'dispatched') RETURNING *`,
        [finished_good_id, customer_id, quantity_dispatched, userId, notes]
    );

    // 3. Deduct finished good stock
    await client.query(
        `UPDATE finished_goods
         SET quantity_in_stock = quantity_in_stock - $1
         WHERE id = $2`,
        [quantity_dispatched, finished_good_id]
    );

    // 4. Log stock movement
    await client.query(
        `INSERT INTO stock_movements (item_type, item_id, quantity, movement_type, reference_id, created_by)
         VALUES ('finished_good', $1, $2, 'dispatch', $3, $4)`,
        [finished_good_id, -quantity_dispatched, dispatch.rows[0].id, userId]
    );

    // === EMAIL NOTIFICATIONS ===
    try {
      // Enrich product info
      const productRes = await client.query(
        `SELECT name, unit FROM finished_goods WHERE id = $1`,
        [finished_good_id]
      );
      const product = productRes.rows[0] || {};

      await sendInventoryUpdateNotification('dispatch', {
        id: dispatch.rows[0].id,
        product_name: product.name || 'Unknown Product',
        quantity_dispatched,
        unit: product.unit || '',
        customer_name: payload.customer_name || null,
        dispatched_by_name: null,
      });

      // Check for low stock on finished goods after dispatch
      await checkAndNotifyLowStock();
    } catch (emailErr) {
      console.error('[Email] Failed to send dispatch notification:', emailErr.message);
    }

    return dispatch.rows[0];
};