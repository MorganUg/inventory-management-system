// src/db/seeds/suppliers.seed.js
export const seedSuppliers = async (pool) => {
  const suppliers = [
    {
      name: "Uganda Sugar Factory",
      contact_name: "John Mukasa",
      phone: "0700123456",
      email: "sales@ugsugar.com",
      address: "Lugazi, Buikwe District",
    },
    {
      name: "Pearl Dairy Ltd",
      contact_name: "Sarah Nambi",
      phone: "0772456789",
      email: "info@pearldairy.co.ug",
      address: "Mbarara, Western Uganda",
    },
    {
      name: "Bidco Africa",
      contact_name: "Peter Otieno",
      phone: "0755987654",
      email: "orders@bidco.co.ug",
      address: "Jinja, Eastern Uganda",
    },
    {
      name: "Kampala Packaging Ltd",
      contact_name: "Grace Akello",
      phone: "0414321654",
      email: "grace@klapackaging.com",
      address: "Nakawa Industrial Area, Kampala",
    },
  ];

  for (const s of suppliers) {
    await pool.query(
      `INSERT INTO suppliers (name, contact_name, phone, email, address)
			VALUES ($1, $2, $3, $4, $5)
			ON CONFLICT DO NOTHING`,
      [s.name, s.contact_name, s.phone, s.email, s.address],
    );
  }
};
