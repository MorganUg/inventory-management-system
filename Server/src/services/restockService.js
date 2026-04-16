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

    return restock.rows[0];
};