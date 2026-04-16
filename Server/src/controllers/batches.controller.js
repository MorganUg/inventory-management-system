import pool from '../config/db.js';
import { completeBatch } from '../services/batchService.js';

export const getAll = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT pb.*, u.username AS created_by_name
             FROM production_batches pb
             LEFT JOIN users u ON u.id = pb.created_by
             ORDER BY pb.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) { next(err); }
};

export const getOne = async (req, res, next) => {
    try {
        const batch = await pool.query(
            'SELECT * FROM production_batches WHERE id = $1', [req.params.id]
        );
        if (!batch.rows[0]) return res.status(404).json({ error: 'Not found' });

        const materials = await pool.query(
            `SELECT bm.*, rm.name AS material_name, rm.unit
             FROM batch_materials bm
             JOIN raw_materials rm ON rm.id = bm.material_id
             WHERE bm.batch_id = $1`,
            [req.params.id]
        );
        const outputs = await pool.query(
            `SELECT bo.*, fg.name AS finished_good_name
             FROM batch_outputs bo
             JOIN finished_goods fg ON fg.id = bo.finished_good_id
             WHERE bo.batch_id = $1`,
            [req.params.id]
        );

        res.json({ ...batch.rows[0], materials: materials.rows, outputs: outputs.rows });
    } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
    try {
        const { batch_name, expected_yield, start_date, notes } = req.body;
        const result = await pool.query(
            `INSERT INTO production_batches (batch_name, expected_yield, start_date, notes, created_by)
             VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [batch_name, expected_yield, start_date, notes, req.user.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { next(err); }
};

export const complete = async (req, res, next) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // req.body.outputs = [{ finished_good_id, actual_quantity }]
        const result = await completeBatch(client, req.params.id, req.body.outputs, req.user.id);
        await client.query('COMMIT');
        res.json(result);
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

export const updateStatus = async (req, res, next) => {
    try {
        const result = await pool.query(
            `UPDATE production_batches SET status = $1 WHERE id = $2 RETURNING *`,
            [req.body.status, req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) { next(err); }
};