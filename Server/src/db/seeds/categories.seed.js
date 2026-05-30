export const seedCategories = async (pool) => {
  const categories = [
    // Raw material categories
    {
      name: "Sweeteners",
      type: "raw_material",
      description: "Sugar, honey, syrups",
    },
    { name: "Dairy", type: "raw_material", description: "Milk, butter, cream" },
    {
      name: "Flavourings",
      type: "raw_material",
      description: "Vanilla, cocoa, fruit extracts",
    },
    {
      name: "Fats & Oils",
      type: "raw_material",
      description: "Vegetable oil, palm oil",
    },
    {
      name: "Packaging",
      type: "raw_material",
      description: "Wrappers, boxes, bags",
    },
    // Finished good categories
    {
      name: "Hard Candy",
      type: "finished_good",
      description: "Boiled sweets and lollipops",
    },
    {
      name: "Soft Candy",
      type: "finished_good",
      description: "Toffees, chews, gummies",
    },
    {
      name: "Chocolate",
      type: "finished_good",
      description: "Chocolate based products",
    },
    {
      name: "Confectionery",
      type: "finished_good",
      description: "Mixed sweet products",
    },
  ];

  for (const cat of categories) {
    await pool.query(
      `INSERT INTO categories (name, type, description)
			VALUES ($1, $2, $3)
			ON CONFLICT (name) DO NOTHING`,
      [cat.name, cat.type, cat.description],
    );
  }
};
