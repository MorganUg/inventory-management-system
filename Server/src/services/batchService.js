export const completeBatch = async (client, batchId, outputs, userId) => {

    // 1. Get all materials used in this batch
    const materials = await client.query(
        'SELECT material_id, quantity_used FROM batch_materials WHERE batch_id = $1',
        [batchId]
    );

    // 2. Deduct each raw material + log
    for (const mat of materials.rows) {
        await client.query(
            `UPDATE raw_materials
             SET quantity_in_stock = quantity_in_stock - $1
             WHERE id = $2`,
            [mat.quantity_used, mat.material_id]
        );
        await client.query(
            `INSERT INTO stock_movements (item_type, item_id, quantity, movement_type, reference_id, created_by)
             VALUES ('raw_material', $1, $2, 'production_use', $3, $4)`,
            [mat.material_id, -mat.quantity_used, batchId, userId]
        );
    }

    // 3. Update each batch output + finished good stock + log
    for (const output of outputs) {
        await client.query(
            `UPDATE batch_outputs SET actual_quantity = $1
             WHERE batch_id = $2 AND finished_good_id = $3`,
            [output.actual_quantity, batchId, output.finished_good_id]
        );
        await client.query(
            `UPDATE finished_goods
             SET quantity_in_stock = quantity_in_stock + $1
             WHERE id = $2`,
            [output.actual_quantity, output.finished_good_id]
        );
        await client.query(
            `INSERT INTO stock_movements (item_type, item_id, quantity, movement_type, reference_id, created_by)
             VALUES ('finished_good', $1, $2, 'production_output', $3, $4)`,
            [output.finished_good_id, output.actual_quantity, batchId, userId]
        );
    }

    // 4. Mark batch as completed
    const batch = await client.query(
        `UPDATE production_batches
         SET status = 'completed', end_date = CURRENT_DATE
         WHERE id = $1 RETURNING *`,
        [batchId]
    );

    return batch.rows[0];
};