import pool from '../config/db.js';

// Get all BOMs with their finished good names
export const getAll = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT
                b.*,
                fg.name AS finished_good_name,
                u.username AS created_by_name,
                COUNT(bi.id) AS ingredient_count
             FROM bom b
             JOIN finished_goods fg ON fg.id = b.finished_good_id
             LEFT JOIN users u ON u.id = b.created_by
             LEFT JOIN bom_items bi ON bi.bom_id = b.id
             GROUP BY b.id, fg.name, u.username
             ORDER BY fg.name, b.version`
        );
        res.json(result.rows);
    } catch (err) { next(err); }
};

// Get one BOM with all its items
export const getOne = async (req, res, next) => {
    try {
        const bom = await pool.query(
            `SELECT b.*, fg.name AS finished_good_name
             FROM bom b
             JOIN finished_goods fg ON fg.id = b.finished_good_id
             WHERE b.id = $1`,
            [req.params.id]
        );
        if (!bom.rows[0]) return res.status(404).json({ error: 'BOM not found' });

        const items = await pool.query(
            `SELECT bi.*, rm.name AS material_name, rm.unit AS material_unit
             FROM bom_items bi
             JOIN raw_materials rm ON rm.id = bi.material_id
             WHERE bi.bom_id = $1
             ORDER BY rm.name`,
            [req.params.id]
        );

        res.json({ ...bom.rows[0], items: items.rows });
    } catch (err) { next(err); }
};

// Get active BOM for a specific finished good
export const getByFinishedGood = async (req, res, next) => {
    try {
        const bom = await pool.query(
            `SELECT b.*, fg.name AS finished_good_name
             FROM bom b
             JOIN finished_goods fg ON fg.id = b.finished_good_id
             WHERE b.finished_good_id = $1 AND b.is_active = TRUE`,
            [req.params.id]
        );
        if (!bom.rows[0]) return res.status(404).json({ error: 'No active BOM for this product' });

        const items = await pool.query(
            `SELECT bi.*, rm.name AS material_name, rm.unit AS material_unit
             FROM bom_items bi
             JOIN raw_materials rm ON rm.id = bi.material_id
             WHERE bi.bom_id = $1
             ORDER BY rm.name`,
            [bom.rows[0].id]
        );

        res.json({ ...bom.rows[0], items: items.rows });
    } catch (err) { next(err); }
};

// Create a new BOM for a finished good
export const create = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const { finished_good_id, notes, items = [] } = req.body;

        await client.query('BEGIN');

        // Get next version number for this finished good
        const versionResult = await client.query(
            `SELECT COALESCE(MAX(version), 0) + 1 AS next_version
             FROM bom WHERE finished_good_id = $1`,
            [finished_good_id]
        );
        const version = versionResult.rows[0].next_version;

        // Deactivate any existing active BOM for this product
        await client.query(
            `UPDATE bom SET is_active = FALSE WHERE finished_good_id = $1 AND is_active = TRUE`,
            [finished_good_id]
        );

        // Create the new BOM
        const bom = await client.query(
            `INSERT INTO bom (finished_good_id, version, is_active, notes, created_by)
             VALUES ($1, $2, TRUE, $3, $4) RETURNING *`,
            [finished_good_id, version, notes, req.user.id]
        );

        // Insert items if provided
        if (items.length > 0) {
            for (const item of items) {
                await client.query(
                    `INSERT INTO bom_items (bom_id, material_id, quantity_per_unit, unit, notes)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [bom.rows[0].id, item.material_id, item.quantity_per_unit, item.unit, item.notes || null]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json(bom.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

// Switch active version for a finished good
export const setActiveVersion = async (req, res, next) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Get the BOM to find its finished_good_id
        const bom = await client.query('SELECT * FROM bom WHERE id = $1', [req.params.id]);
        if (!bom.rows[0]) return res.status(404).json({ error: 'BOM not found' });

        // Deactivate all versions for this finished good
        await client.query(
            'UPDATE bom SET is_active = FALSE WHERE finished_good_id = $1',
            [bom.rows[0].finished_good_id]
        );

        // Activate the requested version
        const result = await client.query(
            'UPDATE bom SET is_active = TRUE WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

// Add an ingredient to a BOM
export const addItem = async (req, res, next) => {
    try {
        const { material_id, quantity_per_unit, unit, notes } = req.body;
        const result = await pool.query(
            `INSERT INTO bom_items (bom_id, material_id, quantity_per_unit, unit, notes)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [req.params.id, material_id, quantity_per_unit, unit, notes || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { next(err); }
};

// Update an ingredient
export const updateItem = async (req, res, next) => {
    try {
        const { quantity_per_unit, unit, notes } = req.body;
        const result = await pool.query(
            `UPDATE bom_items SET quantity_per_unit = $1, unit = $2, notes = $3
             WHERE id = $4 AND bom_id = $5 RETURNING *`,
            [quantity_per_unit, unit, notes || null, req.params.itemId, req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Item not found' });
        res.json(result.rows[0]);
    } catch (err) { next(err); }
};

// Remove an ingredient
export const deleteItem = async (req, res, next) => {
    try {
        const result = await pool.query(
            'DELETE FROM bom_items WHERE id = $1 AND bom_id = $2 RETURNING id',
            [req.params.itemId, req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Item not found' });
        res.json({ message: 'Item removed' });
    } catch (err) { next(err); }
};