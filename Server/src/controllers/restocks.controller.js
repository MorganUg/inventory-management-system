import pool from '../config/db.js';
import { restockMaterial } from '../services/restockService.js';

export const getAll = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT
                r.*,
                rm.name AS material_name,
                rm.unit AS material_unit,
                s.name  AS supplier_name,
                u.username AS received_by_name
             FROM restocks r
             JOIN raw_materials rm ON rm.id = r.material_id
             LEFT JOIN suppliers s ON s.id = r.supplier_id
             LEFT JOIN users u ON u.id = r.received_by
             ORDER BY r.received_at DESC`
        );
        res.json(result.rows);
    } catch (err) { next(err); }
};

export const getOne = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT
                r.*,
                rm.name AS material_name,
                rm.unit AS material_unit,
                s.name  AS supplier_name,
                u.username AS received_by_name
             FROM restocks r
             JOIN raw_materials rm ON rm.id = r.material_id
             LEFT JOIN suppliers s ON s.id = r.supplier_id
             LEFT JOIN users u ON u.id = r.received_by
             WHERE r.id = $1`,
            [req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Restock not found' });
        res.json(result.rows[0]);
    } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await restockMaterial(client, req.body, req.user.id);
        await client.query('COMMIT');
        res.status(201).json(result);
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};