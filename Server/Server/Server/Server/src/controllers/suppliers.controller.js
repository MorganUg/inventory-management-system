import pool from '../config/db.js';

export const getAll = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT
                s.*,
                COUNT(DISTINCT rm.id)  AS materials_supplied,
                COUNT(DISTINCT r.id)   AS total_restocks
             FROM suppliers s
             LEFT JOIN raw_materials rm ON rm.supplier_id = s.id
             LEFT JOIN restocks r ON r.supplier_id = s.id
             GROUP BY s.id
             ORDER BY s.name`
        );
        res.json(result.rows);
    } catch (err) { next(err); }
};

export const getOne = async (req, res, next) => {
    try {
        const supplier = await pool.query(
            'SELECT * FROM suppliers WHERE id = $1',
            [req.params.id]
        );
        if (!supplier.rows[0]) return res.status(404).json({ error: 'Supplier not found' });

        // Materials this supplier provides
        const materials = await pool.query(
            `SELECT id, name, unit, quantity_in_stock, reorder_level
             FROM raw_materials WHERE supplier_id = $1 ORDER BY name`,
            [req.params.id]
        );

        // Restock history from this supplier
        const restocks = await pool.query(
            `SELECT r.*, rm.name AS material_name, rm.unit
             FROM restocks r
             JOIN raw_materials rm ON rm.id = r.material_id
             WHERE r.supplier_id = $1
             ORDER BY r.received_at DESC`,
            [req.params.id]
        );

        res.json({
            ...supplier.rows[0],
            materials: materials.rows,
            restocks: restocks.rows
        });
    } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
    try {
        const { name, contact_name, phone, email, address } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Supplier name is required' });
        }

        const result = await pool.query(
            `INSERT INTO suppliers (name, contact_name, phone, email, address)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name, contact_name || null, phone || null, email || null, address || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
    try {
        const { name, contact_name, phone, email, address, is_active } = req.body;

        const result = await pool.query(
            `UPDATE suppliers
             SET name         = COALESCE($1, name),
                 contact_name = COALESCE($2, contact_name),
                 phone        = COALESCE($3, phone),
                 email        = COALESCE($4, email),
                 address      = COALESCE($5, address),
                 is_active    = COALESCE($6, is_active)
             WHERE id = $7 RETURNING *`,
            [name || null, contact_name || null, phone || null,
             email || null, address || null, is_active ?? null, req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Supplier not found' });
        res.json(result.rows[0]);
    } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
    try {
        // Check if supplier has raw materials linked
        const check = await pool.query(
            'SELECT id FROM raw_materials WHERE supplier_id = $1 LIMIT 1',
            [req.params.id]
        );
        if (check.rows.length > 0) {
            return res.status(409).json({
                error: 'Cannot delete supplier with linked raw materials. Deactivate instead.'
            });
        }

        const result = await pool.query(
            'DELETE FROM suppliers WHERE id = $1 RETURNING id',
            [req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Supplier not found' });
        res.json({ message: 'Supplier deleted successfully' });
    } catch (err) { next(err); }
};