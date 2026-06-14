import bcrypt from "bcryptjs";

export const seedUsers = async (pool) => {
  // WARNING: These are development-only default accounts.
  // NEVER use these passwords in staging or production.
  // In production, seeding should be disabled or use environment-driven strong passwords.
  const users = [
    {
      username: "admin",
      email: "admin@candykingdom.com",
      // Strong development password - still change this in any real environment
      password: "DevAdmin!2026#Secure",
      role: "admin",
    },
    {
      username: "manager",
      email: "manager@candykingdom.com",
      password: "DevManager!2026#Secure",
      role: "manager",
    },
    {
      username: "staff",
      email: "staff@candykingdom.com",
      password: "DevStaff!2026#Secure",
      role: "staff",
    },
  ];

  for (const user of users) {
    const password_hash = await bcrypt.hash(user.password, 10);

    await pool.query(
      `INSERT INTO users (username, email, password_hash, role)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (email) DO NOTHING`,
      [user.username, user.email, password_hash, user.role],
    );
  }
};
