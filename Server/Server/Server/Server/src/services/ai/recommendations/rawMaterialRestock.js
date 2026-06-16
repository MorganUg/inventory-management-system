/**
 * Generates raw material restock recommendations based on production forecasts.
 *
 * @param {Object} params
 * @param {Array} params.billOfMaterials - BOM list with raw material requirements per finished good
 * @param {Array} params.rawMaterialInventory - Current raw material stock levels
 * @param {Array} params.productionForecasts - Production forecast for finished goods
 * @param {Object} [params.options] - Configuration options
 * @param {number} [params.options.leadTimeDays=7] - Supplier lead time in days
 * @param {number} [params.options.safetyStockWeeks=2] - Safety stock coverage in weeks
 * @returns {Object[]} Raw material restock recommendations
 */
export function generateRawMaterialRestockRecommendations({
  billOfMaterials,
  rawMaterialInventory,
  productionForecasts,
  options = {},
}) {
  const { leadTimeDays = 7, safetyStockWeeks = 2 } = options;

  const recommendations = [];

  if (!billOfMaterials?.length || !productionForecasts?.length) {
    return recommendations;
  }

  // Calculate total raw material demand from production forecasts
  const rawMaterialDemand = {};

  for (const forecast of productionForecasts) {
    const bomItem = billOfMaterials.find(
      (bom) => bom.finished_good_id === forecast.finished_good_id,
    );

    if (!bomItem) continue;

    const requiredProduction = Math.max(
      0,
      forecast.suggested_quantity ||
        Math.ceil(
          (forecast.forecast_next_4_weeks || 0) - (forecast.current_stock || 0),
        ),
    );

    for (const material of bomItem.raw_materials || []) {
      if (!rawMaterialDemand[material.raw_material_id]) {
        rawMaterialDemand[material.raw_material_id] = {
          raw_material_id: material.raw_material_id,
          name: material.name,
          total_required_quantity: 0,
          unit: material.unit,
          dependent_products: [],
          earliest_production_date: null,
        };
      }

      const requiredQty = requiredProduction * material.quantity_per_unit;
      rawMaterialDemand[material.raw_material_id].total_required_quantity +=
        requiredQty;

      rawMaterialDemand[material.raw_material_id].dependent_products.push({
        finished_good_id: forecast.finished_good_id,
        finished_good_name: forecast.name,
        required_quantity: requiredQty,
        production_urgency: forecast.urgency_level || "medium",
        recommended_action_date: forecast.recommended_action_date,
      });

      // Track the earliest production date
      if (forecast.recommended_action_date) {
        const productionDate = new Date(forecast.recommended_action_date);
        const currentEarliest =
          rawMaterialDemand[material.raw_material_id].earliest_production_date;

        if (!currentEarliest || productionDate < new Date(currentEarliest)) {
          rawMaterialDemand[material.raw_material_id].earliest_production_date =
            forecast.recommended_action_date;
        }
      }
    }
  }

  // Generate recommendations for each raw material
  for (const [materialId, demand] of Object.entries(rawMaterialDemand)) {
    const inventory = rawMaterialInventory?.find(
      (inv) => inv.raw_material_id === materialId,
    ) || { current_stock: 0 };

    const currentStock = inventory.current_stock || 0;
    const projectedShortfall = demand.total_required_quantity - currentStock;

    if (projectedShortfall <= 0) continue; // No restock needed

    // Calculate when to restock based on production schedule and lead time
    const restockByDate = new Date(
      demand.earliest_production_date || Date.now(),
    );
    restockByDate.setDate(restockByDate.getDate() - leadTimeDays);

    // Calculate reorder point with safety stock
    const weeklyConsumption = demand.total_required_quantity / 4; // Approximate weekly rate
    const safetyStock = weeklyConsumption * safetyStockWeeks;
    const reorderPoint = safetyStock + weeklyConsumption * (leadTimeDays / 7);

    // Determine urgency
    const daysUntilRestock = Math.ceil(
      (restockByDate - new Date()) / (1000 * 60 * 60 * 24),
    );

    let urgency = "low";
    if (daysUntilRestock < 0) {
      urgency = "critical";
    } else if (daysUntilRestock <= leadTimeDays) {
      urgency = "high";
    } else if (daysUntilRestock <= leadTimeDays * 2) {
      urgency = "medium";
    }

    // Suggest order quantity
    const suggestedOrderQuantity = Math.ceil(projectedShortfall + safetyStock);

    recommendations.push({
      raw_material_id: materialId,
      name: demand.name,
      type: "raw_material_restock",
      urgency_level: urgency,
      restock_by_date: restockByDate.toISOString().split("T")[0],
      current_stock: currentStock,
      required_for_production: demand.total_required_quantity,
      projected_shortfall: projectedShortfall,
      safety_stock_recommended: Math.ceil(safetyStock),
      reorder_point: Math.ceil(reorderPoint),
      suggested_order_quantity: suggestedOrderQuantity,
      dependent_products: demand.dependent_products,
      reason:
        `${urgency === "critical" ? "URGENT: " : ""}Stock of ${currentStock} ${demand.unit} ` +
        `insufficient for upcoming production requiring ${demand.total_required_quantity} ${demand.unit}. ` +
        `Restock by ${restockByDate.toISOString().split("T")[0]} ` +
        `to meet earliest production date of ${demand.earliest_production_date}.`,
    });
  }

  // Sort by urgency
  const urgencyWeight = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort(
    (a, b) =>
      (urgencyWeight[a.urgency_level] || 4) -
      (urgencyWeight[b.urgency_level] || 4),
  );

  return recommendations;
}

/**
 * Consolidated function that generates both production and raw material recommendations.
 *
 * @param {Object} params
 * @returns {Object} Combined recommendations
 */
export function generateAllRecommendations(params) {
  const { forecast, billOfMaterials, rawMaterialInventory } = params;

  const productionRecommendations = generateReorderRecommendations(forecast);

  const rawMaterialRecommendations = generateRawMaterialRestockRecommendations({
    billOfMaterials,
    rawMaterialInventory,
    productionForecasts: productionRecommendations,
  });

  return {
    production_recommendations: productionRecommendations,
    raw_material_recommendations: rawMaterialRecommendations,
    summary: {
      total_production_recommendations: productionRecommendations.length,
      total_raw_material_recommendations: rawMaterialRecommendations.length,
      critical_raw_materials: rawMaterialRecommendations.filter(
        (r) => r.urgency_level === "critical",
      ).length,
      high_urgency_raw_materials: rawMaterialRecommendations.filter(
        (r) => r.urgency_level === "high",
      ).length,
    },
  };
}
