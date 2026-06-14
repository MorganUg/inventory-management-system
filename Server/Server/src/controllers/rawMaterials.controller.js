import pool from '../config/db.js';

export const getAll = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT rm.*, c.name AS category, s.name AS supplier
             FROM raw_materials rm
             LEFT JOIN categories c ON c.id = rm.category_id
             LEFT JOIN suppliers s ON s.id = rm.supplier_id
             ORDER BY rm.name`
        );
        res.json(result.rows);
    } catch (err) { next(err); }
};

export const getOne = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT rm.*, c.name AS category, s.name AS supplier
             FROM raw_materials rm
             LEFT JOIN categories c ON c.id = rm.category_id
             LEFT JOIN suppliers s ON s.id = rm.supplier_id
             WHERE rm.id = $1`,
            [req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
    try {
        const { name, unit, quantity_in_stock, reorder_level, cost_per_unit, category_id, supplier_id } = req.body;
        const result = await pool.query(
            `INSERT INTO raw_materials
             (name, unit, quantity_in_stock, reorder_level, cost_per_unit, category_id, supplier_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [name, unit, quantity_in_stock, reorder_level, cost_per_unit, category_id, supplier_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
    try {
        const { name, unit, reorder_level, cost_per_unit, category_id, supplier_id } = req.body;

        const safeCategoryId = category_id ? parseInt(category_id) : null;
        const safeSupplierId = supplier_id ? parseInt(supplier_id) : null;

        if (category_id && isNaN (safeCategoryId)) {
            return res.status(400).json({error: 'invalid category_id' });
        }
        if (supplier_id && isNaN (safeSupplierId)) {
            return res.status(400).json({error: 'invalid supplier_id' });
        }

        const result = await pool.query(
            `UPDATE raw_materials SET
             name=$1, unit=$2, reorder_level=$3,
             cost_per_unit=$4, category_id=$5, supplier_id=$6
             WHERE id=$7 RETURNING *`,
            [name, unit, reorder_level, cost_per_unit, category_id, supplier_id, req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
    try {
        const result = await pool.query(
            'DELETE FROM raw_materials WHERE id=$1 RETURNING id',
            [req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (err) { next(err); }
};