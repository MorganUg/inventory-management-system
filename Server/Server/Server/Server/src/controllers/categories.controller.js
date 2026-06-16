import pool from '../config/db.js';

export const getAll = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT c.*, COUNT(rm.id) AS raw_material_count
             FROM categories c
             LEFT JOIN raw_materials rm ON rm.category_id = c.id AND c.type = 'raw_material'
             GROUP BY c.id
             ORDER BY c.type, c.name`
        );
        res.json(result.rows);
    } catch (err) { next(err); }
};

export const getOne = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT * FROM categories WHERE id = $1',
            [req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Category not found' });
        res.json(result.rows[0]);
    } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
    try {
        const { name, type, description } = req.body;

        if (!name || !type) {
            return res.status(400).json({ error: 'Name and type are required' });
        }

        const allowedTypes = ['raw_material', 'finished_good'];
        if (!allowedTypes.includes(type)) {
            return res.status(400).json({ error: `Type must be one of: ${allowedTypes.join(', ')}` });
        }

        const result = await pool.query(
            `INSERT INTO categories (name, type, description)
             VALUES ($1, $2, $3) RETURNING *`,
            [name, type, description || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Category name already exists' });
        }
        next(err);
    }
};

export const update = async (req, res, next) => {
    try {
        const { name, type, description } = req.body;

        const allowedTypes = ['raw_material', 'finished_good'];
        if (type && !allowedTypes.includes(type)) {
            return res.status(400).json({ error: `Type must be one of: ${allowedTypes.join(', ')}` });
        }

        const result = await pool.query(
            `UPDATE categories
             SET name = COALESCE($1, name),
                 type = COALESCE($2, type),
                 description = COALESCE($3, description)
             WHERE id = $4 RETURNING *`,
            [name || null, type || null, description || null, req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Category not found' });
        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Category name already exists' });
        }
        next(err);
    }
};

export const remove = async (req, res, next) => {
    try {
        const result = await pool.query(
            'DELETE FROM categories WHERE id = $1 RETURNING id',
            [req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Category not found' });
        res.json({ message: 'Category deleted successfully' });
    } catch (err) { next(err); }
};