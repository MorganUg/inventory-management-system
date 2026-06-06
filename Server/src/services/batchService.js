import { 
  sendInventoryUpdateNotification, 
  checkAndNotifyLowStock 
} from './emailService.js';

export const completeBatch = async (client, batchId, outputs, userId) => {
  // Fetch batch to get expected_yield + current status for proportional scaling + guards
  const batchRes = await client.query(
    "SELECT expected_yield, status FROM production_batches WHERE id = $1",
    [batchId],
  );
  const batchRow = batchRes.rows[0];
  if (!batchRow) {
    throw Object.assign(new Error("Batch not found"), { status: 404 });
  }

  // Defensive guard inside service (in case called outside the controller)
  if (batchRow.status === "completed") {
    throw Object.assign(new Error("Batch is already completed"), { status: 409 });
  }
  if (batchRow.status === "cancelled") {
    throw Object.assign(new Error("Cannot complete a cancelled batch"), { status: 409 });
  }

  // Calculate total actual yield from the outputs provided at completion time
  const actualTotal = outputs.reduce((sum, o) => {
    return sum + (parseFloat(o.actual_quantity) || 0);
  }, 0);

  const expectedTotal = parseFloat(batchRow.expected_yield) || 0;

  // Company rule (Candy Kingdom / sweet manufacturing):
  // Scale material consumption proportionally to actual output vs expected yield.
  // This keeps raw material inventory accurate when yield varies.
  // Falls back to planned quantities if expected_yield is missing/zero (backward compatible).
  const ratio = expectedTotal > 0 ? actualTotal / expectedTotal : 1;

  // 1. Get planned materials (populated at batch creation from BOM)
  const materials = await client.query(
    "SELECT material_id, quantity_used FROM batch_materials WHERE batch_id = $1",
    [batchId],
  );

  // 2. Deduct *scaled* raw material quantities + log actual usage
  for (const mat of materials.rows) {
    const planned = parseFloat(mat.quantity_used);
    const actualUsed = planned * ratio;

    await client.query(
      `UPDATE raw_materials
				SET quantity_in_stock = quantity_in_stock - $1
				WHERE id = $2`,
      [actualUsed, mat.material_id],
    );
    await client.query(
      `INSERT INTO stock_movements (item_type, item_id, quantity, movement_type, reference_id, created_by)
			VALUES ('raw_material', $1, $2, 'production_use', $3, $4)`,
      [mat.material_id, -actualUsed, batchId, userId],
    );
  }

  // 3. Update each batch output + finished good stock + log
  for (const output of outputs) {
    await client.query(
      `UPDATE batch_outputs SET actual_quantity = $1
			WHERE batch_id = $2 AND finished_good_id = $3`,
      [output.actual_quantity, batchId, output.finished_good_id],
    );
    await client.query(
      `UPDATE finished_goods
				SET quantity_in_stock = quantity_in_stock + $1
				WHERE id = $2`,
      [output.actual_quantity, output.finished_good_id],
    );
    await client.query(
      `INSERT INTO stock_movements (item_type, item_id, quantity, movement_type, reference_id, created_by)
			VALUES ('finished_good', $1, $2, 'production_output', $3, $4)`,
      [output.finished_good_id, output.actual_quantity, batchId, userId],
    );
  }

  // 4. Mark batch as completed and record the actual total yield
  const batch = await client.query(
    `UPDATE production_batches
			SET status = 'completed',
				end_date = CURRENT_DATE,
				actual_yield = $1
			WHERE id = $2 RETURNING *`,
    [actualTotal, batchId],
  );

  // === EMAIL NOTIFICATIONS ===
  try {
    await sendInventoryUpdateNotification('production', {
      id: batchId,
      batch_name: `Batch #${batchId}`,
      actual_yield: actualTotal,
    });

    // Check for low stock after production consumption
    await checkAndNotifyLowStock();
  } catch (emailErr) {
    console.error('[Email] Failed to send production notification:', emailErr.message);
  }

  return batch.rows[0];
};
