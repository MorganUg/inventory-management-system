import pool from '../config/db.js';

export const getAll = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT
                c.*,
                COUNT(d.id)                  AS total_dispatches,
                COALESCE(SUM(d.quantity_dispatched), 0) AS total_units_received
             FROM customers c
             LEFT JOIN dispatches d ON d.customer_id = c.id AND d.status = 'dispatched'
             GROUP BY c.id
             ORDER BY c.name`
        );
        res.json(result.rows);
    } catch (err) { next(err); }
};

export const getOne = async (req, res, next) => {
    try {
        const customer = await pool.query(
            'SELECT * FROM customers WHERE id = $1',
            [req.params.id]
        );
        if (!customer.rows[0]) return res.status(404).json({ error: 'Customer not found' });

        // Also return their dispatch history
        const dispatches = await pool.query(
            `SELECT d.*, fg.name AS product_name
             FROM dispatches d
             JOIN finished_goods fg ON fg.id = d.finished_good_id
             WHERE d.customer_id = $1
             ORDER BY d.dispatched_at DESC`,
            [req.params.id]
        );

        res.json({ ...customer.rows[0], dispatches: dispatches.rows });
    } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
    try {
        const { name, contact_name, phone, email, address } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Customer name is required' });
        }

        const result = await pool.query(
            `INSERT INTO customers (name, contact_name, phone, email, address)
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
            `UPDATE customers
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
        if (!result.rows[0]) return res.status(404).json({ error: 'Customer not found' });
        res.json(result.rows[0]);
    } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
    try {
        // Check if customer has dispatches
        const check = await pool.query(
            'SELECT id FROM dispatches WHERE customer_id = $1 LIMIT 1',
            [req.params.id]
        );
        if (check.rows.length > 0) {
            return res.status(409).json({
                error: 'Cannot delete customer with existing dispatches. Deactivate instead.'
            });
        }

        const result = await pool.query(
            'DELETE FROM customers WHERE id = $1 RETURNING id',
            [req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Customer not found' });
        res.json({ message: 'Customer deleted successfully' });
    } catch (err) { next(err); }
};