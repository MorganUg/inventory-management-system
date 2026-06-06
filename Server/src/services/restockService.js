import { 
  sendInventoryUpdateNotification, 
  checkAndNotifyLowStock 
} from './emailService.js';

export const restockMaterial = async (client, payload, userId) => {
    const { material_id, supplier_id, quantity_received, cost_per_unit, notes } = payload;

    // 1. Insert restock record
    const restock = await client.query(
        `INSERT INTO restocks (material_id, supplier_id, quantity_received, cost_per_unit, received_by, notes)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [material_id, supplier_id, quantity_received, cost_per_unit, userId, notes]
    );

    // 2. Update raw material stock
    await client.query(
        `UPDATE raw_materials
         SET quantity_in_stock = quantity_in_stock + $1
         WHERE id = $2`,
        [quantity_received, material_id]
    );

    // 3. Log stock movement
    await client.query(
        `INSERT INTO stock_movements (item_type, item_id, quantity, movement_type, reference_id, created_by)
         VALUES ('raw_material', $1, $2, 'restock', $3, $4)`,
        [material_id, quantity_received, restock.rows[0].id, userId]
    );

    // === EMAIL NOTIFICATIONS ===
    try {
      // Enrich data for email
      const materialRes = await client.query(
        `SELECT rm.name, rm.unit, s.name as supplier_name 
         FROM raw_materials rm 
         LEFT JOIN suppliers s ON s.id = rm.supplier_id 
         WHERE rm.id = $1`,
        [material_id]
      );
      const mat = materialRes.rows[0] || {};

      // Send purchase order / incoming inventory notification
      await sendInventoryUpdateNotification('restock', {
        id: restock.rows[0].id,
        material_name: mat.name || 'Unknown Material',
        quantity_received,
        unit: mat.unit || '',
        supplier_name: mat.supplier_name || null,
        received_by_name: null,
        notes,
      });

      // Check for low stock (though we just added stock, useful if it was very low before)
      await checkAndNotifyLowStock();
    } catch (emailErr) {
      console.error('[Email] Failed to send restock notification:', emailErr.message);
    }

    return restock.rows[0];
};