import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

//REGISTER
export const register = async (req, res, next) => {
  try {
    const { username, email, password, role = "staff" } = req.body;

    // Validate role
    const allowedRoles = ["admin", "manager", "staff"];
    if (!allowedRoles.includes(role)) {
      return res
        .status(400)
        .json({ error: `Role must be one of: ${allowedRoles.join(", ")}` });
    }

    // Check all fields present
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Username, email and password are required" });
    }

    // Check email not already used
    const emailCheck = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    // Check username not already used
    const usernameCheck = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username],
    );
    if (usernameCheck.rows.length > 0) {
      return res.status(409).json({ error: "Username is already taken" });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role)
             VALUES ($1, $2, $3, $4)
             RETURNING id, username, email, role, created_at`,
      [username, email, password_hash, role],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// LOGIN
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1 AND is_active = TRUE`,
      [email],
    );
    const user = result.rows[0];

    // Check user exists and password matches
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Update last login
    await pool.query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [
      user.id,
    ]);

    // Sign token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        force_password_change: user.force_password_change || false,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET CURRENT USER
export const getMe = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, role, created_at, last_login_at, force_password_change FROM users WHERE id = $1`,
      [req.user.id],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// UPDATE PASSWORD
export const updatePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res
        .status(400)
        .json({ error: "Current and new password are required" });
    }

    if (new_password.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters" });
    }

    // Get user with hash
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      req.user.id,
    ]);
    const user = result.rows[0];

    // Verify current password
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash and save new password
    const password_hash = await bcrypt.hash(new_password, 10);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      password_hash,
      req.user.id,
    ]);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
};
