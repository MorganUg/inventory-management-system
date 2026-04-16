export const seedCustomers = async (pool) => {
    console.log('Seeding customers...');

    const customers = [
        {
            name: 'Mrs Alice',
            contact_name: 'Alice Nakato',
            phone: '0791064257',
            email: 'alicenakato@gmail.com',
            address: 'kikuubo, Kampala'
        },
        {
            name: 'Carrefour Uganda',
            contact_name: 'Fatima Hassan',
            phone: '0200900100',
            email: 'orders@carrefour.ug',
            address: 'Oasis Mall, Kampala'
        },
        {
            name: 'Kwik Save Stores',
            contact_name: 'Moses Bwire',
            phone: '0782334455',
            email: 'moses@kwiksave.ug',
            address: 'Entebbe Road, Kampala'
        },
        {
            name: 'Campus Canteen - Makerere',
            contact_name: 'Agnes Nanteza',
            phone: '0703112233',
            email: 'canteen@mak.ac.ug',
            address: 'Makerere University, Kampala'
        }
    ];

    for (const c of customers) {
        await pool.query(
            `INSERT INTO customers (name, contact_name, phone, email, address)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT DO NOTHING`,
            [c.name, c.contact_name, c.phone, c.email, c.address]
        );
        console.log(`Customr ${c.name} saved`);
    }
};