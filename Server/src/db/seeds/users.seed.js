import bcrypt from 'bcryptjs';

export const seedUsers = async (pool) => {
    console.log('Seeding users...');

    const users = [
        {
            username: 'admin',
            email: 'admin@candykingdom.com',
            password: 'admin123',
            role: 'admin'
        },
        {
            username: 'manager',
            email: 'manager@candykingdom.com',
            password: 'manager123',
            role: 'manager'
        },
        {
            username: 'staff',
            email: 'staff@candykingdom.com',
            password: 'staff123',
            role: 'staff'
        }
    ];

    for (const user of users) {
        const password_hash = await bcrypt.hash(user.password, 10);

        await pool.query(
            `INSERT INTO users (username, email, password_hash, role)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (email) DO NOTHING`,
            [user.username, user.email, password_hash, user.role]
        );
        console.log(`   ✅ ${user.role}: ${user.email} / ${user.password}`);
    }
};