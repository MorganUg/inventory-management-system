export const seedRawMaterials = async (pool) => {
  // Fetch category and supplier IDs dynamically
  const cats = await pool.query(
    "SELECT id, name FROM categories WHERE type = $1",
    ["raw_material"],
  );
  const sups = await pool.query("SELECT id, name FROM suppliers");

  const catMap = Object.fromEntries(cats.rows.map((c) => [c.name, c.id]));
  const supMap = Object.fromEntries(sups.rows.map((s) => [s.name, s.id]));

  const materials = [
    {
      name: "White Sugar",
      unit: "kg",
      quantity_in_stock: 500,
      reorder_level: 100,
      cost_per_unit: 3500,
      category: "Sweeteners",
      supplier: "Uganda Sugar Factory",
    },
    {
      name: "Glucose Syrup",
      unit: "kg",
      quantity_in_stock: 200,
      reorder_level: 50,
      cost_per_unit: 8000,
      category: "Sweeteners",
      supplier: "Uganda Sugar Factory",
    },
    {
      name: "Full Cream Milk",
      unit: "litres",
      quantity_in_stock: 150,
      reorder_level: 40,
      cost_per_unit: 2500,
      category: "Dairy",
      supplier: "Pearl Dairy Ltd",
    },
    {
      name: "Butter",
      unit: "kg",
      quantity_in_stock: 80,
      reorder_level: 20,
      cost_per_unit: 18000,
      category: "Dairy",
      supplier: "Pearl Dairy Ltd",
    },
    {
      name: "Cocoa Powder",
      unit: "kg",
      quantity_in_stock: 60,
      reorder_level: 15,
      cost_per_unit: 25000,
      category: "Flavourings",
      supplier: "Bidco Africa",
    },
    {
      name: "Vanilla Essence",
      unit: "litres",
      quantity_in_stock: 10,
      reorder_level: 3,
      cost_per_unit: 45000,
      category: "Flavourings",
      supplier: "Bidco Africa",
    },
    {
      name: "Vegetable Oil",
      unit: "litres",
      quantity_in_stock: 100,
      reorder_level: 25,
      cost_per_unit: 7000,
      category: "Fats & Oils",
      supplier: "Bidco Africa",
    },
    {
      name: "Candy Wrappers",
      unit: "pieces",
      quantity_in_stock: 10000,
      reorder_level: 2000,
      cost_per_unit: 50,
      category: "Packaging",
      supplier: "Kampala Packaging Ltd",
    },
    {
      name: "Cardboard Boxes",
      unit: "pieces",
      quantity_in_stock: 300,
      reorder_level: 80,
      cost_per_unit: 1500,
      category: "Packaging",
      supplier: "Kampala Packaging Ltd",
    },
  ];

  for (const m of materials) {
    await pool.query(
      `INSERT INTO raw_materials
			(name, unit, quantity_in_stock, reorder_level, cost_per_unit, category_id, supplier_id)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			ON CONFLICT DO NOTHING`,
      [
        m.name,
        m.unit,
        m.quantity_in_stock,
        m.reorder_level,
        m.cost_per_unit,
        catMap[m.category] || null,
        supMap[m.supplier] || null,
      ],
    );
  }
};
