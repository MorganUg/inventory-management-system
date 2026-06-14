import pool from '../config/db.js';

// Production Report 
export const getProductionReport = async (req, res, next) => {
    try {
        const { from, to } = req.query;

        const conditions = [];
        const values     = [];
        let idx = 1;

        if (from) { conditions.push(`pb.created_at >= $${idx++}`); values.push(from); }
        if (to)   { conditions.push(`pb.created_at <= $${idx++}`); values.push(to);   }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const batches = await pool.query(
            `SELECT
                pb.id,
                pb.batch_name,
                pb.status,
                pb.expected_yield,
                pb.actual_yield,
                pb.start_date,
                pb.end_date,
                u.username AS created_by,
                CASE
                    WHEN pb.expected_yield > 0
                    THEN ROUND((pb.actual_yield / pb.expected_yield) * 100, 2)
                    ELSE NULL
                END AS efficiency_percent,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'material', rm.name,
                            'quantity_used', bm.quantity_used,
                            'unit', rm.unit,
                            'cost', bm.quantity_used * rm.cost_per_unit
                        )
                    ) FILTER (WHERE bm.id IS NOT NULL), '[]'
                ) AS materials_used
             FROM production_batches pb
             LEFT JOIN users u ON u.id = pb.created_by
             LEFT JOIN batch_materials bm ON bm.batch_id = pb.id
             LEFT JOIN raw_materials rm ON rm.id = bm.material_id
             ${where}
             GROUP BY pb.id, u.username
             ORDER BY pb.created_at DESC`,
            values
        );

        // Summary stats
        const completed  = batches.rows.filter(b => b.status === 'completed');
        const totalYield = completed.reduce((sum, b) =>
            sum + parseFloat(b.actual_yield || 0), 0
        );
        const avgEfficiency = completed.length > 0
            ? completed.reduce((sum, b) =>
                sum + parseFloat(b.efficiency_percent || 0), 0
              ) / completed.length
            : 0;
        const totalMaterialCost = batches.rows.reduce((sum, b) =>
            sum + (b.materials_used || []).reduce((s, m) =>
                s + parseFloat(m.cost || 0), 0
            ), 0
        );

        res.json({
            batches:          batches.rows,
            summary: {
                total_batches:      batches.rows.length,
                completed_batches:  completed.length,
                total_yield:        totalYield,
                avg_efficiency:     Math.round(avgEfficiency),
                total_material_cost: totalMaterialCost
            }
        });
    } catch (err) { next(err); }
};

// Stock Report 
export const getStockReport = async (req, res, next) => {
    try {
        const rawMaterials = await pool.query(
            `SELECT
                rm.id,
                rm.name,
                rm.unit,
                rm.quantity_in_stock,
                rm.reorder_level,
                rm.cost_per_unit,
                rm.quantity_in_stock * rm.cost_per_unit AS stock_value,
                s.name AS supplier_name,
                c.name AS category_name,
                CASE
                    WHEN rm.quantity_in_stock <= 0             THEN 'out_of_stock'
                    WHEN rm.quantity_in_stock <= rm.reorder_level THEN 'low_stock'
                    ELSE 'in_stock'
                END AS stock_status,
                (
                    SELECT MAX(r.received_at)
                    FROM restocks r
                    WHERE r.material_id = rm.id
                ) AS last_restocked_at
             FROM raw_materials rm
             LEFT JOIN suppliers s ON s.id = rm.supplier_id
             LEFT JOIN categories c ON c.id = rm.category_id
             ORDER BY rm.name`
        );

        const finishedGoods = await pool.query(
            `SELECT
                fg.id,
                fg.name,
                fg.unit,
                fg.quantity_in_stock,
                fg.price_per_unit,
                fg.quantity_in_stock * fg.price_per_unit AS stock_value,
                c.name AS category_name,
                CASE
                    WHEN fg.quantity_in_stock <= 0  THEN 'out_of_stock'
                    WHEN fg.quantity_in_stock <= 20 THEN 'low_stock'
                    ELSE 'in_stock'
                END AS stock_status
             FROM finished_goods fg
             LEFT JOIN categories c ON c.id = fg.category_id
             ORDER BY fg.name`
        );

        const totalRawValue = rawMaterials.rows.reduce((sum, m) =>
            sum + parseFloat(m.stock_value || 0), 0
        );
        const totalFinishedValue = finishedGoods.rows.reduce((sum, g) =>
            sum + parseFloat(g.stock_value || 0), 0
        );

        res.json({
            raw_materials:   rawMaterials.rows,
            finished_goods:  finishedGoods.rows,
            summary: {
                total_raw_material_value:  totalRawValue,
                total_finished_good_value: totalFinishedValue,
                total_stock_value:         totalRawValue + totalFinishedValue,
                low_stock_count:           rawMaterials.rows.filter(m =>
                    m.stock_status === 'low_stock').length,
                out_of_stock_count:        rawMaterials.rows.filter(m =>
                    m.stock_status === 'out_of_stock').length,
            }
        });
    } catch (err) { next(err); }
};

// Dispatch Report 
export const getDispatchReport = async (req, res, next) => {
    try {
        const { from, to, group_by = 'product' } = req.query;

        const conditions = ['d.status = \'dispatched\''];
        const values     = [];
        let idx = 1;

        if (from) { conditions.push(`d.dispatched_at >= $${idx++}`); values.push(from); }
        if (to)   { conditions.push(`d.dispatched_at <= $${idx++}`); values.push(to);   }

        const where = `WHERE ${conditions.join(' AND ')}`;

        const dispatches = await pool.query(
            `SELECT
                d.id,
                d.quantity_dispatched,
                d.dispatched_at,
                d.notes,
                fg.name  AS product_name,
                fg.unit  AS product_unit,
                fg.price_per_unit,
                d.quantity_dispatched * fg.price_per_unit AS dispatch_value,
                c.name   AS customer_name,
                u.username AS dispatched_by
             FROM dispatches d
             JOIN finished_goods fg ON fg.id = d.finished_good_id
             LEFT JOIN customers c ON c.id = d.customer_id
             LEFT JOIN users u ON u.id = d.dispatched_by
             ${where}
             ORDER BY d.dispatched_at DESC`,
            values
        );

        // Group by product
        const byProduct = dispatches.rows.reduce((acc, d) => {
            const key = d.product_name;
            if (!acc[key]) acc[key] = { name: key, total_units: 0, total_value: 0, count: 0 };
            acc[key].total_units += parseFloat(d.quantity_dispatched);
            acc[key].total_value += parseFloat(d.dispatch_value || 0);
            acc[key].count++;
            return acc;
        }, {});

        // Group by customer
        const byCustomer = dispatches.rows.reduce((acc, d) => {
            const key = d.customer_name || 'Unknown';
            if (!acc[key]) acc[key] = { name: key, total_units: 0, total_value: 0, count: 0 };
            acc[key].total_units += parseFloat(d.quantity_dispatched);
            acc[key].total_value += parseFloat(d.dispatch_value || 0);
            acc[key].count++;
            return acc;
        }, {});

        const totalValue = dispatches.rows.reduce((sum, d) =>
            sum + parseFloat(d.dispatch_value || 0), 0
        );
        const totalUnits = dispatches.rows.reduce((sum, d) =>
            sum + parseFloat(d.quantity_dispatched || 0), 0
        );

        res.json({
            dispatches:   dispatches.rows,
            by_product:   Object.values(byProduct).sort((a, b) => b.total_units - a.total_units),
            by_customer:  Object.values(byCustomer).sort((a, b) => b.total_units - a.total_units),
            summary: {
                total_dispatches: dispatches.rows.length,
                total_units:      totalUnits,
                total_value:      totalValue,
            }
        });
    } catch (err) { next(err); }
};

// Consumption Report 
export const getConsumptionReport = async (req, res, next) => {
    try {
        const { from, to } = req.query;

        const conditions = [`sm.movement_type = 'production_use'`];
        const values     = [];
        let idx = 1;

        if (from) { conditions.push(`sm.created_at >= $${idx++}`); values.push(from); }
        if (to)   { conditions.push(`sm.created_at <= $${idx++}`); values.push(to);   }

        const where = `WHERE ${conditions.join(' AND ')}`;

        const consumption = await pool.query(
            `SELECT
                rm.id,
                rm.name,
                rm.unit,
                rm.cost_per_unit,
                ABS(SUM(sm.quantity))                           AS total_consumed,
                ABS(SUM(sm.quantity)) * rm.cost_per_unit        AS total_cost,
                COUNT(DISTINCT sm.reference_id)                 AS batches_used_in
             FROM stock_movements sm
             JOIN raw_materials rm ON rm.id = sm.item_id
             ${where}
               AND sm.item_type = 'raw_material'
             GROUP BY rm.id, rm.name, rm.unit, rm.cost_per_unit
             ORDER BY total_consumed DESC`,
            values
        );

        const totalCost = consumption.rows.reduce((sum, r) =>
            sum + parseFloat(r.total_cost || 0), 0
        );

        res.json({
            consumption: consumption.rows,
            summary: {
                total_materials_used: consumption.rows.length,
                total_cost:           totalCost,
            }
        });
    } catch (err) { next(err); }
};

// Chart Data — Production over time
export const getProductionChart = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT
                TO_CHAR(DATE_TRUNC('week', created_at), 'Mon DD') AS week,
                COUNT(*)                                           AS batches,
                SUM(actual_yield)                                  AS total_yield
             FROM production_batches
             WHERE status = 'completed'
               AND created_at >= NOW() - INTERVAL '12 weeks'
             GROUP BY DATE_TRUNC('week', created_at)
             ORDER BY DATE_TRUNC('week', created_at)`
        );
        res.json(result.rows);
    } catch (err) { next(err); }
};

// Chart Data — Dispatches over time
export const getDispatchChart = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT
                TO_CHAR(DATE_TRUNC('week', dispatched_at), 'Mon DD') AS week,
                COUNT(*)                                               AS dispatches,
                SUM(quantity_dispatched)                               AS total_units
             FROM dispatches
             WHERE status = 'dispatched'
               AND dispatched_at >= NOW() - INTERVAL '12 weeks'
             GROUP BY DATE_TRUNC('week', dispatched_at)
             ORDER BY DATE_TRUNC('week', dispatched_at)`
        );
        res.json(result.rows);
    } catch (err) { next(err); }
};

// Chart Data — Top products dispatched
export const getTopProductsChart = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT
                fg.name,
                SUM(d.quantity_dispatched) AS total_dispatched
             FROM dispatches d
             JOIN finished_goods fg ON fg.id = d.finished_good_id
             WHERE d.status = 'dispatched'
             GROUP BY fg.name
             ORDER BY total_dispatched DESC
             LIMIT 6`
        );
        res.json(result.rows);
    } catch (err) { next(err); }
};

// Chart Data — Raw material stock levels
export const getStockLevelsChart = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT
                name,
                quantity_in_stock,
                reorder_level
             FROM raw_materials
             ORDER BY quantity_in_stock ASC
             LIMIT 8`
        );
        res.json(result.rows);
    } catch (err) { next(err); }
};