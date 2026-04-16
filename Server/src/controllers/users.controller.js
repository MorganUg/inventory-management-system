import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

// Admin only — see all users
export const getAll = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT id, username, email, role, is_active, created_at
             FROM users
             ORDER BY created_at DESC`
        );
        res.json(result.rows);
    } catch (err) { next(err); }
};

export const getOne = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT id, username, email, role, is_active, created_at
             FROM users WHERE id = $1`,
            [req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) { next(err); }
};

// Admin can update any user's role or status
export const update = async (req, res, next) => {
    try {
        const { username, email, role, is_active } = req.body;

        const allowedRoles = ['admin', 'manager', 'staff'];
        if (role && !allowedRoles.includes(role)) {
            return res.status(400).json({ error: `Role must be one of: ${allowedRoles.join(', ')}` });
        }

        // Check email uniqueness if being changed
        if (email) {
            const check = await pool.query(
                'SELECT id FROM users WHERE email = $1 AND id != $2',
                [email, req.params.id]
            );
            if (check.rows.length > 0) {
                return res.status(409).json({ error: 'Email already in use' });
            }
        }

        const result = await pool.query(
            `UPDATE users
             SET username  = COALESCE($1, username),
                 email     = COALESCE($2, email),
                 role      = COALESCE($3, role),
                 is_active = COALESCE($4, is_active)
             WHERE id = $5
             RETURNING id, username, email, role, is_active`,
            [username || null, email || null, role || null, is_active ?? null, req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) { next(err); }
};

// Admin resets another user's password
export const resetPassword = async (req, res, next) => {
    try {
        const { new_password } = req.body;

        if (!new_password || new_password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const password_hash = await bcrypt.hash(new_password, 10);
        const result = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id',
            [password_hash, req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'Password reset successfully' });
    } catch (err) { next(err); }
};

// Admin deactivates a user instead of deleting
export const deactivate = async (req, res, next) => {
    try {
        // Prevent deactivating yourself
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(400).json({ error: 'You cannot deactivate your own account' });
        }

        const result = await pool.query(
            `UPDATE users SET is_active = FALSE WHERE id = $1
             RETURNING id, username, is_active`,
            [req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
    try {
        // Prevent deleting yourself
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(400).json({ error: 'You cannot delete your own account' });
        }

        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id',
            [req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (err) { next(err); }
};