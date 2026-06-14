/**
 * Email Service
 *
 * Centralized service for sending email notifications to Admin and Manager users.
 * Uses Nodemailer with SMTP configuration via environment variables.
 *
 * Required .env variables:
 *   EMAIL_HOST=smtp.example.com
 *   EMAIL_PORT=587
 *   EMAIL_USER=your@email.com
 *   EMAIL_PASS=yourpassword
 *   EMAIL_FROM="IMS System <no-reply@yourcompany.com>"
 *   FRONTEND_URL=http://localhost:5173   (optional, for links in emails)
 */

import nodemailer from "nodemailer";
import pool from "../config/db.js";

let transporter = null;

// Initialize transporter lazily
function getTransporter() {
  if (transporter) return transporter;

  if (
    !process.env.EMAIL_HOST ||
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASS
  ) {
    console.warn(
      "[EmailService] Email credentials not configured in .env. Emails will not be sent.",
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
}

/**
 * Get all active Admin and Manager email addresses
 */
async function getAdminAndManagerEmails() {
  try {
    const result = await pool.query(
      `SELECT email FROM users 
       WHERE role IN ('admin', 'manager') 
         AND is_active = TRUE 
         AND email IS NOT NULL`,
    );
    return result.rows.map((row) => row.email);
  } catch (err) {
    console.error(
      "[EmailService] Failed to fetch admin/manager emails:",
      err.message,
    );
    return [];
  }
}

/**
 * Send email to all admins and managers
 */
async function sendToAdminsAndManagers(subject, html, text = null) {
  const transporter = getTransporter();
  if (!transporter) return;

  const recipients = await getAdminAndManagerEmails();
  if (recipients.length === 0) {
    console.log(
      "[EmailService] No admin/manager recipients found. Skipping email:",
      subject,
    );
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: recipients.join(","),
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ""), // strip html for text version
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(
      `[EmailService] Email sent: "${subject}" to ${recipients.length} recipients`,
    );
  } catch (err) {
    console.error("[EmailService] Failed to send email:", err.message);
  }
}

/* ======================
   NOTIFICATION FUNCTIONS
   ====================== */

/**
 * Notify when a new user is registered/created
 */
export async function sendNewUserNotification(user) {
  const subject = `New User Registered: ${user.username}`;
  const html = `
    <h2>New User Account Created</h2>
    <p>A new user has been registered in the Inventory Management System.</p>
    <ul>
      <li><strong>Username:</strong> ${user.username}</li>
      <li><strong>Email:</strong> ${user.email}</li>
      <li><strong>Role:</strong> ${user.role}</li>
      <li><strong>Registered At:</strong> ${new Date().toLocaleString()}</li>
    </ul>
    <p>Please review the new account in the Users section.</p>
  `;

  await sendToAdminsAndManagers(subject, html);
}

/**
 * Notify when inventory changes (restock, dispatch, production)
 */
export async function sendInventoryUpdateNotification(type, details) {
  let subject = "";
  let html = "";

  switch (type) {
    case "restock":
      subject = `Incoming Inventory - Restock Created (#${details.id})`;
      html = `
        <h2>New Restock / Purchase Order</h2>
        <p><strong>Material:</strong> ${details.material_name} (+${details.quantity_received} ${details.unit})</p>
        <p><strong>Supplier:</strong> ${details.supplier_name || "N/A"}</p>
        <p><strong>Received By:</strong> ${details.received_by_name || "System"}</p>
        <p><strong>Notes:</strong> ${details.notes || "None"}</p>
      `;
      break;

    case "dispatch":
      subject = `Inventory Update - Dispatch Created (#${details.id})`;
      html = `
        <h2>Inventory Dispatched</h2>
        <p><strong>Product:</strong> ${details.product_name} (-${details.quantity_dispatched} ${details.unit})</p>
        <p><strong>Customer:</strong> ${details.customer_name || "N/A"}</p>
        <p><strong>Dispatched By:</strong> ${details.dispatched_by_name || "System"}</p>
      `;
      break;

    case "production":
      subject = `Inventory Update - Production Batch Completed (#${details.id})`;
      html = `
        <h2>Production Batch Completed</h2>
        <p><strong>Batch:</strong> ${details.batch_name}</p>
        <p><strong>Actual Yield:</strong> ${details.actual_yield}</p>
        <p>Finished goods have been added to inventory and raw materials deducted.</p>
      `;
      break;

    default:
      subject = "Inventory Update";
      html = `<p>Inventory has been updated.</p>`;
  }

  await sendToAdminsAndManagers(subject, html);
}

/**
 * Notify when stock is low (raw materials primarily)
 */
export async function sendLowStockAlert(lowStockItems) {
  if (!lowStockItems || lowStockItems.length === 0) return;

  const subject = `Low Stock Alert - ${lowStockItems.length} Item(s) Below Reorder Level`;

  let itemsHtml = lowStockItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.quantity_in_stock} ${item.unit}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.reorder_level} ${item.unit}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.supplier_name || "N/A"}</td>
    </tr>
  `,
    )
    .join("");

  const html = `
    <h2>⚠️ Low Stock Alert</h2>
    <p>The following items have fallen below their reorder level:</p>
    <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
      <thead>
        <tr style="background-color: #f8f9fa;">
          <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Material</th>
          <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Current Stock</th>
          <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Reorder Level</th>
          <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Supplier</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    <p style="margin-top: 16px;">Please restock these items as soon as possible.</p>
  `;

  await sendToAdminsAndManagers(subject, html);
}

/**
 * Check database for low stock materials and send alert if any found.
 * Called after stock-decreasing operations.
 */
export async function checkAndNotifyLowStock() {
  try {
    // Raw materials with defined reorder levels
    const rawMaterialsResult = await pool.query(`
      SELECT 
        rm.id,
        rm.name,
        rm.unit,
        rm.quantity_in_stock,
        rm.reorder_level,
        s.name AS supplier_name,
        'raw_material' as item_type
      FROM raw_materials rm
      LEFT JOIN suppliers s ON s.id = rm.supplier_id
      WHERE rm.quantity_in_stock <= rm.reorder_level
        AND rm.reorder_level > 0
      ORDER BY (rm.quantity_in_stock - rm.reorder_level) ASC
    `);

    // Finished goods with critically low stock (no reorder_level in schema - using threshold of 5)
    const finishedGoodsResult = await pool.query(`
      SELECT 
        fg.id,
        fg.name,
        fg.unit,
        fg.quantity_in_stock,
        5 as reorder_level,
        NULL AS supplier_name,
        'finished_good' as item_type
      FROM finished_goods fg
      WHERE fg.quantity_in_stock <= 5
      ORDER BY fg.quantity_in_stock ASC
    `);

    const allLowStock = [
      ...rawMaterialsResult.rows,
      ...finishedGoodsResult.rows,
    ];

    if (allLowStock.length > 0) {
      // Send unified alert (we can enhance sendLowStockAlert later to handle both types)
      await sendLowStockAlert(allLowStock);
    }
  } catch (err) {
    console.error("[EmailService] Error checking low stock:", err.message);
  }
}

/**
 * Optional: Test email configuration
 */
export async function sendTestEmail(toEmail) {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error("Email not configured");
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: toEmail,
    subject: "Test Email from IMS",
    html: "<p>This is a test email from your Inventory Management System.</p>",
  });
}

export default {
  sendNewUserNotification,
  sendInventoryUpdateNotification,
  sendLowStockAlert,
  sendTestEmail,
};
