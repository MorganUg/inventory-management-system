import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useProductionReport,
  useStockReport,
  useDispatchReport,
  useConsumptionReport,
  useProductionChart,
  useDispatchChart,
  useTopProductsChart,
  useStockLevelsChart,
} from "../../hooks/useReports.js";
import { useAISummary, useRawMaterialRestock } from "../../hooks/useAI.js";
import { getFinishedGoods } from "../../api/finishedGoods.api.js";
import api from "../../api/axios.js";
import { PageHeader } from "../../components/shared/PageHeader.jsx";
import { StatCard } from "../../components/ui/StatCard.jsx";
import ExportMenu from "../../components/shared/ExportMenu";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  BarChart2,
  Package,
  Truck,
  FlaskConical,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Target,
} from "lucide-react";

// Section wrapper
const Section = ({
  title,
  icon: Icon,
  color = "text-amber-500",
  children,
  data,
  filename,
}) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center gap-2 px-5 py-4 border-b bg-gray-50">
      <Icon size={16} className={color} />
      <h2 className="font-semibold text-gray-800">{title}</h2>
      <div className="ml-auto">
        <ExportMenu data={data} filename={filename} title={title} />
      </div>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// Date filter bar
const DateFilter = ({ filters, onChange, onClear }) => (
  <div className="flex items-center gap-3 flex-wrap">
    <div className="flex items-center gap-2">
      <Calendar size={15} className="text-gray-400" />
      <span className="text-sm text-gray-600">Date range:</span>
    </div>
    <input
      type="date"
      value={filters.from}
      onChange={(e) => onChange("from", e.target.value)}
      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
    />
    <span className="text-sm text-gray-400">to</span>
    <input
      type="date"
      value={filters.to}
      onChange={(e) => onChange("to", e.target.value)}
      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
    />
    {(filters.from || filters.to) && (
      <button
        onClick={onClear}
        className="text-xs text-amber-600 hover:text-amber-700"
      >
        Clear
      </button>
    )}
  </div>
);

// Chart colors
const COLORS = [
  "#f59e0b",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
];

// Main Page
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState({ from: "", to: "" });

  const updateFilter = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters({ from: "", to: "" });

  // Chart data — always loads regardless of tab
  const { data: productionChart = [] } = useProductionChart();
  const { data: dispatchChart = [] } = useDispatchChart();
  const { data: topProducts = [] } = useTopProductsChart();
  const { data: stockLevels = [] } = useStockLevelsChart();

  // Report data — loads based on active tab
  const { data: productionData } = useProductionReport(filters);
  const { data: stockData } = useStockReport();
  const { data: dispatchData } = useDispatchReport(filters);
  const { data: consumptionData } = useConsumptionReport(filters);

  // AI Tab - Finished Goods list + selected product
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [aiView, setAiView] = useState("single"); // "single" | "all"
  const [allSummaries, setAllSummaries] = useState([]);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);

  const { data: finishedGoods = [] } = useQuery({
    queryKey: ["finishedGoods"],
    queryFn: () => getFinishedGoods().then((res) => res.data),
  });

  const { data: aiSummary, isLoading: aiLoading } =
    useAISummary(selectedProductId);

  const [billOfMaterials, setBillOfMaterials] = useState([]);
  const [rawMaterialInventory, setRawMaterialInventory] = useState([]);

  useEffect(() => {
    const fetchRawMaterialData = async () => {
      try {
        const [bomRes, invRes] = await Promise.all([
          api.get("/bill-of-materials"),
          api.get("/raw-materials/inventory"),
        ]);
        setBillOfMaterials(bomRes.data || []);
        setRawMaterialInventory(invRes.data || []);
      } catch (error) {
        console.error("Failed to load raw material data:", error);
        setBillOfMaterials([]);
        setRawMaterialInventory([]);
      }
    };
    fetchRawMaterialData();
  }, []);

  // Prepare params for raw material restock (single product)
  const singleProductRestockParams = useMemo(() => {
    if (!aiSummary?.recommendations?.length || !selectedProductId) return null;

    return {
      billOfMaterials,
      rawMaterialInventory,
      productionForecasts: aiSummary.recommendations.map((rec) => ({
        ...rec,
        finished_good_id: selectedProductId,
        name:
          finishedGoods.find((fg) => fg.id === selectedProductId)?.name ||
          "Unknown",
        forecast_next_4_weeks: aiSummary.forecast?.forecast_next_4_weeks || 0,
        current_stock: aiSummary.forecast?.current_stock || 0,
      })),
    };
  }, [
    aiSummary,
    selectedProductId,
    billOfMaterials,
    rawMaterialInventory,
    finishedGoods,
  ]);

  // Fetch raw material restock for single product
  const { data: singleProductRawMaterialRestock = [] } = useRawMaterialRestock(
    singleProductRestockParams,
    { leadTimeDays: 7, safetyStockWeeks: 2 },
  );

  // Enhanced AI summary
  const enhancedAiSummary = useMemo(() => {
    if (!aiSummary) return null;
    return {
      ...aiSummary,
      rawMaterialRestock: singleProductRawMaterialRestock,
    };
  }, [aiSummary, singleProductRawMaterialRestock]);

  // Analyze all products using AI
  const analyzeAllProducts = async () => {
    if (finishedGoods.length === 0) return;

    setIsAnalyzingAll(true);
    setAiView("all");
    setAllSummaries([]);

    try {
      const results = await Promise.all(
        finishedGoods.map(async (product) => {
          try {
            const res = await api.get(`/ai/summary/${product.id}`);
            return {
              ...res.data,
              productId: product.id,
              productName: product.name,
            };
          } catch (err) {
            console.warn(
              `Failed to fetch AI summary for product ${product.id}`,
            );
            return null;
          }
        }),
      );

      const validResults = results.filter(Boolean);
      setAllSummaries(validResults);
    } catch (error) {
      console.error("Failed to analyze all products", error);
    } finally {
      setIsAnalyzingAll(false);
    }
  };

  // Prepare params for all products raw material restock
  const allProductsRestockParams = useMemo(() => {
    if (!allSummaries?.length || !billOfMaterials?.length) return null;

    const allProductionRecommendations = allSummaries
      .filter((result) => result.recommendations?.length > 0)
      .flatMap((result) =>
        result.recommendations.map((rec) => ({
          ...rec,
          finished_good_id: result.productId,
          name: result.productName,
          forecast_next_4_weeks: result.forecast?.forecast_next_4_weeks || 0,
          current_stock: result.forecast?.current_stock || 0,
        })),
      );

    return {
      billOfMaterials,
      rawMaterialInventory,
      productionForecasts: allProductionRecommendations,
    };
  }, [allSummaries, billOfMaterials, rawMaterialInventory]);

  // Fetch raw material restock for all products
  const { data: allRawMaterialSummaries = [] } = useRawMaterialRestock(
    allProductsRestockParams,
    { leadTimeDays: 7, safetyStockWeeks: 2 },
  );

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "production", label: "Production" },
    { id: "stock", label: "Stock" },
    { id: "dispatches", label: "Dispatches" },
    { id: "consumption", label: "Consumption" },
    { id: "ai", label: "AI Insights" },
  ];

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Business intelligence and data exports"
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${
                activeTab === t.id
                  ? "bg-amber-500 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }
            `}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Summary stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Total Batches"
              value={productionData?.summary?.total_batches || 0}
              icon={BarChart2}
              color="amber"
            />
            <StatCard
              label="Avg Efficiency"
              value={`${productionData?.summary?.avg_efficiency || 0}%`}
              icon={BarChart2}
              color="green"
            />
            <StatCard
              label="Total Dispatched"
              value={(dispatchData?.summary?.total_units || 0).toLocaleString()}
              icon={Truck}
              color="blue"
            />
            <StatCard
              label="Stock Value (UGX)"
              value={(
                stockData?.summary?.total_stock_value || 0
              ).toLocaleString()}
              icon={Package}
              color="amber"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Production output over time */}
            <Section title="Production output — last 12 weeks" icon={BarChart2}>
              {productionChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={productionChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar
                      dataKey="total_yield"
                      name="Units produced"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-400 text-center py-10">
                  No production data yet.
                </p>
              )}
            </Section>

            {/* Dispatches over time */}
            <Section
              title="Dispatches — last 12 weeks"
              icon={Truck}
              color="text-blue-500"
            >
              {dispatchChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={dispatchChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="total_units"
                      name="Units dispatched"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-400 text-center py-10">
                  No dispatch data yet.
                </p>
              )}
            </Section>

            {/* Top dispatched products */}
            <Section
              title="Top dispatched products"
              icon={Package}
              color="text-green-500"
            >
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="total_dispatched"
                      name="Units"
                      radius={[0, 4, 4, 0]}
                    >
                      {topProducts.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-400 text-center py-10">
                  No dispatch data yet.
                </p>
              )}
            </Section>

            {/* Raw material stock vs reorder level */}
            <Section
              title="Raw material stock vs reorder level"
              icon={FlaskConical}
              color="text-purple-500"
            >
              {stockLevels.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stockLevels} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="quantity_in_stock"
                      name="In stock"
                      fill="#22c55e"
                      radius={[0, 4, 4, 0]}
                    />
                    <Bar
                      dataKey="reorder_level"
                      name="Reorder level"
                      fill="#ef4444"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-400 text-center py-10">
                  No material data yet.
                </p>
              )}
            </Section>
          </div>
        </div>
      )}

      {/* PRODUCTION TAB */}
      {activeTab === "production" && (
        <div className="space-y-6">
          <DateFilter
            filters={filters}
            onChange={updateFilter}
            onClear={clearFilters}
          />

          {/* Summary cards */}
          {productionData?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="Total Batches"
                value={productionData.summary.total_batches}
                icon={BarChart2}
                color="amber"
              />
              <StatCard
                label="Completed"
                value={productionData.summary.completed_batches}
                icon={BarChart2}
                color="green"
              />
              <StatCard
                label="Total Yield"
                value={(
                  productionData.summary.total_yield || 0
                ).toLocaleString()}
                icon={Package}
                color="blue"
              />
              <StatCard
                label="Avg Efficiency"
                value={`${productionData.summary.avg_efficiency || 0}%`}
                icon={BarChart2}
                color="amber"
              />
            </div>
          )}

          <Section
            title="Production batches"
            icon={BarChart2}
            data={productionData?.batches}
            filename="production_report"
          >
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  {[
                    "Batch",
                    "Status",
                    "Expected",
                    "Actual",
                    "Efficiency",
                    "Start",
                    "End",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left pb-3 text-xs font-medium text-gray-500 uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(productionData?.batches || []).map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium">{b.batch_name}</td>
                    <td className="py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${
                            b.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : b.status === "in_progress"
                                ? "bg-amber-100 text-amber-700"
                                : b.status === "cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                          }
                        `}
                      >
                        {b.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600">
                      {b.expected_yield || "—"}
                    </td>
                    <td className="py-3 text-green-600 font-medium">
                      {b.actual_yield || "—"}
                    </td>
                    <td className="py-3">
                      {b.efficiency_percent ? (
                        <span
                          className={
                            parseFloat(b.efficiency_percent) >= 90
                              ? "text-green-600 font-medium"
                              : parseFloat(b.efficiency_percent) >= 70
                                ? "text-amber-600 font-medium"
                                : "text-red-500 font-medium"
                          }
                        >
                          {b.efficiency_percent}%
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 text-gray-500">
                      {b.start_date
                        ? new Date(b.start_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="py-3 text-gray-500">
                      {b.end_date
                        ? new Date(b.end_date).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!productionData?.batches ||
              productionData.batches.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-8">
                No production data.
              </p>
            )}
          </Section>
        </div>
      )}

      {/* STOCK TAB */}
      {activeTab === "stock" && (
        <div className="space-y-6">
          {stockData?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard
                label="Raw Materials Value"
                value={`UGX ${(stockData.summary.total_raw_material_value || 0).toLocaleString()}`}
                icon={FlaskConical}
                color="amber"
              />
              <StatCard
                label="Finished Goods Value"
                value={`UGX ${(stockData.summary.total_finished_good_value || 0).toLocaleString()}`}
                icon={Package}
                color="green"
              />
              <StatCard
                label="Low Stock Items"
                value={stockData.summary.low_stock_count || 0}
                icon={BarChart2}
                color="red"
              />
            </div>
          )}

          {/* Raw materials table */}
          <Section
            title="Raw materials stock"
            icon={FlaskConical}
            color="text-purple-500"
            data={stockData?.raw_materials}
            filename="raw_materials_stock"
          >
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  {[
                    "Material",
                    "Unit",
                    "In Stock",
                    "Reorder Level",
                    "Stock Value (UGX)",
                    "Status",
                    "Last Restocked",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left pb-3 text-xs font-medium text-gray-500 uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(stockData?.raw_materials || []).map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium">{m.name}</td>
                    <td className="py-3 text-gray-500">{m.unit}</td>
                    <td className="py-3">
                      {parseFloat(m.quantity_in_stock).toLocaleString()}
                    </td>
                    <td className="py-3 text-gray-500">{m.reorder_level}</td>
                    <td className="py-3 font-medium">
                      UGX {parseFloat(m.stock_value || 0).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${
                            m.stock_status === "in_stock"
                              ? "bg-green-100 text-green-700"
                              : m.stock_status === "low_stock"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }
                        `}
                      >
                        {m.stock_status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">
                      {m.last_restocked_at
                        ? new Date(m.last_restocked_at).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          {/* Finished goods table */}
          <Section
            title="Finished goods stock"
            icon={Package}
            color="text-green-500"
            data={stockData?.finished_goods}
            filename="finished_goods_stock"
          >
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  {[
                    "Product",
                    "Unit",
                    "In Stock",
                    "Price/Unit",
                    "Stock Value (UGX)",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left pb-3 text-xs font-medium text-gray-500 uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(stockData?.finished_goods || []).map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium">{g.name}</td>
                    <td className="py-3 text-gray-500">{g.unit}</td>
                    <td className="py-3">
                      {parseFloat(g.quantity_in_stock).toLocaleString()}
                    </td>
                    <td className="py-3 text-gray-500">
                      UGX {parseFloat(g.price_per_unit || 0).toLocaleString()}
                    </td>
                    <td className="py-3 font-medium">
                      UGX {parseFloat(g.stock_value || 0).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${
                            g.stock_status === "in_stock"
                              ? "bg-green-100 text-green-700"
                              : g.stock_status === "low_stock"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }
                        `}
                      >
                        {g.stock_status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* DISPATCHES TAB */}
      {activeTab === "dispatches" && (
        <div className="space-y-6">
          <DateFilter
            filters={filters}
            onChange={updateFilter}
            onClear={clearFilters}
          />

          {dispatchData?.summary && (
            <div className="grid grid-cols-3 gap-4">
              <StatCard
                label="Total Dispatches"
                value={dispatchData.summary.total_dispatches}
                icon={Truck}
                color="amber"
              />
              <StatCard
                label="Total Units"
                value={(dispatchData.summary.total_units || 0).toLocaleString()}
                icon={Package}
                color="blue"
              />
              <StatCard
                label="Total Value"
                value={`UGX ${(dispatchData.summary.total_value || 0).toLocaleString()}`}
                icon={BarChart2}
                color="green"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By product */}
            <Section title="By product" icon={Package} color="text-green-500">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    {["Product", "Dispatches", "Units", "Value"].map((h) => (
                      <th
                        key={h}
                        className="text-left pb-3 text-xs font-medium text-gray-500 uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(dispatchData?.by_product || []).map((p) => (
                    <tr key={p.name} className="hover:bg-gray-50">
                      <td className="py-2.5 font-medium">{p.name}</td>
                      <td className="py-2.5 text-gray-600">{p.count}</td>
                      <td className="py-2.5 text-amber-600 font-medium">
                        {p.total_units.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-gray-700">
                        UGX {p.total_value.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            {/* By customer */}
            <Section title="By customer" icon={Truck} color="text-blue-500">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    {["Customer", "Dispatches", "Units", "Value"].map((h) => (
                      <th
                        key={h}
                        className="text-left pb-3 text-xs font-medium text-gray-500 uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(dispatchData?.by_customer || []).map((c) => (
                    <tr key={c.name} className="hover:bg-gray-50">
                      <td className="py-2.5 font-medium">{c.name}</td>
                      <td className="py-2.5 text-gray-600">{c.count}</td>
                      <td className="py-2.5 text-amber-600 font-medium">
                        {c.total_units.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-gray-700">
                        UGX {c.total_value.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          </div>

          {/* Full dispatch log */}
          <Section
            title="Full dispatch log"
            icon={Truck}
            data={dispatchData?.dispatches}
            filename="dispatch_report"
          >
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  {["Product", "Customer", "Qty", "Value", "By", "Date"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left pb-3 text-xs font-medium text-gray-500 uppercase"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(dispatchData?.dispatches || []).map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="py-2.5 font-medium">{d.product_name}</td>
                    <td className="py-2.5 text-gray-600">
                      {d.customer_name || "—"}
                    </td>
                    <td className="py-2.5 text-amber-600 font-medium">
                      {d.quantity_dispatched}
                    </td>
                    <td className="py-2.5 text-gray-700">
                      UGX {parseFloat(d.dispatch_value || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-gray-500">
                      {d.dispatched_by || "—"}
                    </td>
                    <td className="py-2.5 text-gray-500">
                      {new Date(d.dispatched_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* CONSUMPTION TAB */}
      {activeTab === "consumption" && (
        <div className="space-y-6">
          <DateFilter
            filters={filters}
            onChange={updateFilter}
            onClear={clearFilters}
          />

          {consumptionData?.summary && (
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label="Materials Used"
                value={consumptionData.summary.total_materials_used}
                icon={FlaskConical}
                color="amber"
              />
              <StatCard
                label="Total Cost (UGX)"
                value={`UGX ${(consumptionData.summary.total_cost || 0).toLocaleString()}`}
                icon={BarChart2}
                color="red"
              />
            </div>
          )}

          <Section
            title="Raw material consumption"
            icon={FlaskConical}
            color="text-purple-500"
            data={consumptionData?.consumption}
            filename="consumption_report"
          >
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  {[
                    "Material",
                    "Unit",
                    "Total Consumed",
                    "Cost/Unit",
                    "Total Cost",
                    "Batches Used In",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left pb-3 text-xs font-medium text-gray-500 uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(consumptionData?.consumption || []).map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium">{c.name}</td>
                    <td className="py-3 text-gray-500">{c.unit}</td>
                    <td className="py-3 text-red-500 font-medium">
                      {parseFloat(c.total_consumed).toLocaleString()}
                    </td>
                    <td className="py-3 text-gray-600">
                      UGX {parseFloat(c.cost_per_unit).toLocaleString()}
                    </td>
                    <td className="py-3 font-medium text-gray-800">
                      UGX {parseFloat(c.total_cost).toLocaleString()}
                    </td>
                    <td className="py-3 text-gray-500">{c.batches_used_in}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!consumptionData?.consumption ||
              consumptionData.consumption.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-8">
                No consumption data for this period.
              </p>
            )}
          </Section>
        </div>
      )}

      {/* AI INSIGHTS TAB */}
      {activeTab === "ai" && (
        <div className="space-y-6">
          {/* AI View Controls */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAiView("single")}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                      aiView === "single"
                        ? "bg-amber-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Single Product
                  </button>
                  <button
                    onClick={() => setAiView("all")}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                      aiView === "all"
                        ? "bg-amber-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All Products Overview
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {aiView === "single" && (
                  <div className="flex-1 min-w-[220px]">
                    <select
                      value={selectedProductId || ""}
                      onChange={(e) =>
                        setSelectedProductId(
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="">-- Select a product --</option>
                      {finishedGoods.map((fg) => (
                        <option key={fg.id} value={fg.id}>
                          {fg.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {aiView === "all" && (
                  <button
                    onClick={analyzeAllProducts}
                    disabled={isAnalyzingAll}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    {isAnalyzingAll ? "Analyzing..." : "Analyze All Products"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* SINGLE PRODUCT VIEW */}
          {aiView === "single" && (
            <>
              {!selectedProductId && (
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">
                  Select a finished good above to view AI-powered demand
                  forecast, insights, and recommendations.
                </div>
              )}

              {selectedProductId && aiLoading && (
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">
                  Analyzing data with local statistical models...
                </div>
              )}

              {selectedProductId &&
                !aiLoading &&
                !enhancedAiSummary?.forecast && (
                  <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">
                    No forecast data available for this product (insufficient
                    history).
                  </div>
                )}

              {enhancedAiSummary &&
                enhancedAiSummary.forecast &&
                !aiLoading && (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <StatCard
                        label="Current Stock"
                        value={(
                          enhancedAiSummary.forecast.current_stock ?? 0
                        ).toLocaleString()}
                        icon={Package}
                        color="blue"
                      />
                      <StatCard
                        label="4-Week Forecast"
                        value={(
                          enhancedAiSummary.forecast.forecast_next_4_weeks ?? 0
                        ).toLocaleString()}
                        icon={TrendingUp}
                        color="amber"
                      />
                      <StatCard
                        label="Trend"
                        value={enhancedAiSummary.forecast.trend || "unknown"}
                        icon={TrendingUp}
                        color={
                          enhancedAiSummary.forecast.trend === "increasing"
                            ? "green"
                            : enhancedAiSummary.forecast.trend === "decreasing"
                              ? "red"
                              : "gray"
                        }
                      />
                      <StatCard
                        label="Confidence"
                        value={`${enhancedAiSummary.forecast.confidence_score ?? 0}%`}
                        icon={Target}
                        color={
                          (enhancedAiSummary.forecast.confidence_score ?? 0) >=
                          70
                            ? "green"
                            : (enhancedAiSummary.forecast.confidence_score ??
                                  0) >= 45
                              ? "amber"
                              : "red"
                        }
                      />
                      <StatCard
                        label="Data Quality"
                        value={`${enhancedAiSummary.forecast.data_quality_score ?? 0}%`}
                        icon={BarChart2}
                        color={
                          (enhancedAiSummary.forecast.data_quality_score ??
                            0) >= 70
                            ? "green"
                            : "amber"
                        }
                      />
                    </div>

                    {/* Forecast Chart */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-800">
                          Demand Forecast (Next 4 Weeks)
                        </h3>
                        <span className="text-xs text-gray-500">
                          Method:{" "}
                          {enhancedAiSummary.forecast.forecast_method || "N/A"}
                        </span>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={
                              Array.isArray(
                                enhancedAiSummary.forecast.weekly_forecast,
                              )
                                ? enhancedAiSummary.forecast.weekly_forecast.map(
                                    (value, index) => ({
                                      week: `Week ${index + 1}`,
                                      forecast: value,
                                    }),
                                  )
                                : []
                            }
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f0f0f0"
                            />
                            <XAxis dataKey="week" />
                            <YAxis />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="forecast"
                              stroke="#f59e0b"
                              strokeWidth={3}
                              dot={{ r: 5, fill: "#f59e0b" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        {enhancedAiSummary.forecast?.explanation}
                      </div>
                    </div>

                    {/* Insights */}
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      <div className="px-5 py-4 border-b bg-gray-50 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-500" />
                        <h3 className="font-semibold text-gray-800">
                          AI Insights
                        </h3>
                      </div>
                      <div className="p-5">
                        {(enhancedAiSummary.insights || []).length > 0 ? (
                          <div className="space-y-3">
                            {enhancedAiSummary.insights.map(
                              (insight, index) => (
                                <div
                                  key={index}
                                  className="border border-gray-100 rounded-lg p-4 bg-gray-50"
                                >
                                  <div className="flex items-start gap-3">
                                    <AlertTriangle
                                      size={18}
                                      className="text-amber-500 mt-0.5 flex-shrink-0"
                                    />
                                    <div>
                                      <div className="font-medium text-gray-900">
                                        {insight.title}
                                      </div>
                                      <div className="text-sm text-gray-600 mt-1">
                                        {insight.message}
                                      </div>
                                      {insight.suggested_action && (
                                        <div className="text-xs mt-2 text-amber-700 bg-amber-100 inline-block px-2 py-0.5 rounded">
                                          Suggested: {insight.suggested_action}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            No significant insights detected for this product.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      <div className="px-5 py-4 border-b bg-gray-50 flex items-center gap-2">
                        <Target size={16} className="text-blue-500" />
                        <h3 className="font-semibold text-gray-800">
                          Recommendations
                        </h3>
                      </div>
                      <div className="p-5">
                        {(enhancedAiSummary.recommendations || []).length >
                        0 ? (
                          <div className="space-y-4">
                            {enhancedAiSummary.recommendations.map(
                              (rec, index) => (
                                <div
                                  key={index}
                                  className="border border-gray-100 rounded-lg p-4"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <span
                                      className={`text-xs font-medium px-2 py-0.5 rounded-full
                              ${
                                rec.urgency_level === "high"
                                  ? "bg-red-100 text-red-700"
                                  : rec.urgency_level === "medium"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-blue-100 text-blue-700"
                              }`}
                                    >
                                      {rec.urgency_level.toUpperCase()} URGENCY
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      Action by: {rec.recommended_action_date}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-700">
                                    {rec.reason}
                                  </div>
                                  <div className="mt-2 text-sm">
                                    <strong>Suggested production:</strong>{" "}
                                    {rec.suggested_quantity}{" "}
                                    {enhancedAiSummary.forecast?.unit ||
                                      "units"}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            No immediate production recommendations at this
                            time.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* RAW MATERIAL RESTOCK INSIGHTS */}
                    {selectedProductId &&
                      enhancedAiSummary?.rawMaterialRestock &&
                      !aiLoading && (
                        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                          <div className="px-5 py-4 border-b bg-gray-50 flex items-center gap-2">
                            <Package size={16} className="text-green-500" />
                            <h3 className="font-semibold text-gray-800">
                              Raw Material Restock
                            </h3>
                            {enhancedAiSummary.rawMaterialRestock.some(
                              (r) => r.urgency_level === "critical",
                            ) && (
                              <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                Critical Items
                              </span>
                            )}
                          </div>
                          <div className="p-5">
                            {enhancedAiSummary.rawMaterialRestock.length > 0 ? (
                              <div className="space-y-4">
                                {/* Critical/Highest Priority Items First */}
                                {enhancedAiSummary.rawMaterialRestock
                                  .sort((a, b) => {
                                    const urgencyOrder = {
                                      critical: 0,
                                      high: 1,
                                      medium: 2,
                                      low: 3,
                                    };
                                    return (
                                      (urgencyOrder[a.urgency_level] || 4) -
                                      (urgencyOrder[b.urgency_level] || 4)
                                    );
                                  })
                                  .map((rec, index) => (
                                    <div
                                      key={index}
                                      className={`border rounded-lg p-4 ${
                                        rec.urgency_level === "critical"
                                          ? "border-red-200 bg-red-50"
                                          : rec.urgency_level === "high"
                                            ? "border-amber-200 bg-amber-50"
                                            : "border-gray-200 bg-white"
                                      }`}
                                    >
                                      {/* Header with urgency and restock date */}
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <span
                                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                              rec.urgency_level === "critical"
                                                ? "bg-red-200 text-red-800"
                                                : rec.urgency_level === "high"
                                                  ? "bg-amber-200 text-amber-800"
                                                  : rec.urgency_level ===
                                                      "medium"
                                                    ? "bg-blue-200 text-blue-800"
                                                    : "bg-gray-200 text-gray-700"
                                            }`}
                                          >
                                            {rec.urgency_level.toUpperCase()}
                                          </span>
                                          <span className="font-medium text-gray-900">
                                            {rec.name}
                                          </span>
                                        </div>
                                        {rec.restock_by_date && (
                                          <span className="text-xs text-gray-500">
                                            Restock by:{" "}
                                            <span className="font-medium text-gray-700">
                                              {new Date(
                                                rec.restock_by_date,
                                              ).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                              })}
                                            </span>
                                          </span>
                                        )}
                                      </div>

                                      {/* Stock Levels Visualization */}
                                      <div className="grid grid-cols-3 gap-3 mb-3">
                                        <div>
                                          <div className="text-xs text-gray-500 mb-1">
                                            Current Stock
                                          </div>
                                          <div className="text-lg font-semibold">
                                            {rec.current_stock}{" "}
                                            <span className="text-sm font-normal text-gray-500">
                                              {rec.unit || "units"}
                                            </span>
                                          </div>
                                        </div>
                                        <div>
                                          <div className="text-xs text-gray-500 mb-1">
                                            Required
                                          </div>
                                          <div className="text-lg font-semibold text-amber-600">
                                            {rec.required_for_production}{" "}
                                            <span className="text-sm font-normal text-gray-500">
                                              {rec.unit || "units"}
                                            </span>
                                          </div>
                                        </div>
                                        <div>
                                          <div className="text-xs text-gray-500 mb-1">
                                            Shortfall
                                          </div>
                                          <div
                                            className={`text-lg font-semibold ${rec.projected_shortfall > 0 ? "text-red-600" : "text-green-600"}`}
                                          >
                                            {rec.projected_shortfall > 0
                                              ? `-${rec.projected_shortfall}`
                                              : "0"}
                                            <span className="text-sm font-normal text-gray-500">
                                              {rec.unit || "units"}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Order Recommendation */}
                                      <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-sm font-medium text-gray-700">
                                            Suggested Order
                                          </span>
                                          <span className="text-lg font-bold text-green-600">
                                            {rec.suggested_order_quantity}{" "}
                                            {rec.unit || "units"}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                          <span>
                                            Reorder Point: {rec.reorder_point}
                                          </span>
                                          <span>
                                            Safety Stock:{" "}
                                            {rec.safety_stock_recommended}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Dependent Products (Collapsible) */}
                                      {rec.dependent_products &&
                                        rec.dependent_products.length > 0 && (
                                          <details className="text-xs">
                                            <summary className="cursor-pointer text-gray-600 hover:text-gray-900 font-medium">
                                              Required for{" "}
                                              {rec.dependent_products.length}{" "}
                                              product
                                              {rec.dependent_products.length > 1
                                                ? "s"
                                                : ""}
                                            </summary>
                                            <div className="mt-2 space-y-2">
                                              {rec.dependent_products.map(
                                                (product, idx) => (
                                                  <div
                                                    key={idx}
                                                    className="flex items-center justify-between bg-gray-50 rounded px-3 py-2"
                                                  >
                                                    <span className="text-gray-700">
                                                      {
                                                        product.finished_good_name
                                                      }
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                      <span className="text-gray-500">
                                                        {
                                                          product.required_quantity
                                                        }{" "}
                                                        {rec.unit || "units"}
                                                      </span>
                                                      <span
                                                        className={`px-1.5 py-0.5 rounded text-xs ${
                                                          product.production_urgency ===
                                                          "high"
                                                            ? "bg-red-100 text-red-700"
                                                            : product.production_urgency ===
                                                                "medium"
                                                              ? "bg-amber-100 text-amber-700"
                                                              : "bg-blue-100 text-blue-700"
                                                        }`}
                                                      >
                                                        {
                                                          product.production_urgency
                                                        }
                                                      </span>
                                                    </div>
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          </details>
                                        )}

                                      {/* Reason */}
                                      <div className="mt-3 text-xs text-gray-600 bg-gray-50 rounded px-3 py-2">
                                        {rec.reason}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <Package
                                  size={32}
                                  className="mx-auto text-gray-300 mb-2"
                                />
                                <p className="text-sm text-gray-500">
                                  No raw material restock needed for upcoming
                                  production
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {/* ALL PRODUCTS VIEW - RAW MATERIAL SUMMARY */}
                    {aiView === "all" &&
                      allRawMaterialSummaries?.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                          <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertTriangle
                                size={16}
                                className="text-red-500"
                              />
                              <h3 className="font-semibold text-gray-800">
                                Raw Material Restock Alerts
                              </h3>
                            </div>
                            <div className="flex items-center gap-2">
                              {allRawMaterialSummaries.filter(
                                (r) => r.urgency_level === "critical",
                              ).length > 0 && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                  {
                                    allRawMaterialSummaries.filter(
                                      (r) => r.urgency_level === "critical",
                                    ).length
                                  }{" "}
                                  Critical
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {allRawMaterialSummaries.length} materials need
                                restock
                              </span>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="border-b bg-gray-50">
                                <tr>
                                  <th className="text-left px-5 py-3 font-medium text-gray-600">
                                    Material
                                  </th>
                                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                                    Current Stock
                                  </th>
                                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                                    Required
                                  </th>
                                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                                    Shortfall
                                  </th>
                                  <th className="text-center px-4 py-3 font-medium text-gray-600">
                                    Urgency
                                  </th>
                                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                                    Restock By
                                  </th>
                                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                                    Suggested Order
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {allRawMaterialSummaries
                                  .sort((a, b) => {
                                    const urgencyOrder = {
                                      critical: 0,
                                      high: 1,
                                      medium: 2,
                                      low: 3,
                                    };
                                    return (
                                      (urgencyOrder[a.urgency_level] || 4) -
                                      (urgencyOrder[b.urgency_level] || 4)
                                    );
                                  })
                                  .map((rec, index) => (
                                    <tr
                                      key={index}
                                      className={`hover:bg-gray-50 ${
                                        rec.urgency_level === "critical"
                                          ? "bg-red-50"
                                          : ""
                                      }`}
                                    >
                                      <td className="px-5 py-3 font-medium">
                                        {rec.name}
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        {rec.current_stock}
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        {rec.required_for_production}
                                      </td>
                                      <td className="px-4 py-3 text-right font-medium text-red-600">
                                        -{rec.projected_shortfall}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <span
                                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                            rec.urgency_level === "critical"
                                              ? "bg-red-100 text-red-700"
                                              : rec.urgency_level === "high"
                                                ? "bg-amber-100 text-amber-700"
                                                : "bg-blue-100 text-blue-700"
                                          }`}
                                        >
                                          {rec.urgency_level}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-xs">
                                        {rec.restock_by_date
                                          ? new Date(
                                              rec.restock_by_date,
                                            ).toLocaleDateString()
                                          : "—"}
                                      </td>
                                      <td className="px-4 py-3 text-right font-medium text-green-600">
                                        {rec.suggested_order_quantity}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                  </>
                )}
            </>
          )}

          {/* ALL PRODUCTS OVERVIEW TABLE */}
          {aiView === "all" && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 size={16} className="text-amber-500" />
                  <h3 className="font-semibold text-gray-800">
                    AI Demand Forecast Overview
                  </h3>
                </div>
                <span className="text-xs text-gray-500">
                  {allSummaries.length} products analyzed
                </span>
              </div>

              {isAnalyzingAll && (
                <div className="p-8 text-center text-gray-500">
                  Running AI analysis across all products...
                </div>
              )}

              {!isAnalyzingAll && allSummaries.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  Click "Analyze All Products" above to generate forecasts and
                  risk assessment for every item.
                </div>
              )}

              {allSummaries.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="text-left px-5 py-3 font-medium text-gray-600">
                          Product
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">
                          Stock
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">
                          4W Forecast
                        </th>
                        <th className="text-center px-4 py-3 font-medium text-gray-600">
                          Trend
                        </th>
                        <th className="text-center px-4 py-3 font-medium text-gray-600">
                          Confidence
                        </th>
                        <th className="text-center px-4 py-3 font-medium text-gray-600">
                          Risk
                        </th>
                        <th className="text-left px-5 py-3 font-medium text-gray-600">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {allSummaries
                        .sort(
                          (a, b) =>
                            (b.forecast?.stockout_risk_weeks || 99) -
                            (a.forecast?.stockout_risk_weeks || 99),
                        )
                        .map((item, index) => {
                          const f = item.forecast || {};
                          const stockoutRisk = f.stockout_risk_weeks ?? 99;
                          const riskLevel =
                            stockoutRisk < 2
                              ? "High"
                              : stockoutRisk < 4
                                ? "Medium"
                                : "Low";
                          const riskColor =
                            riskLevel === "High"
                              ? "text-red-600 bg-red-50"
                              : riskLevel === "Medium"
                                ? "text-amber-600 bg-amber-50"
                                : "text-green-600 bg-green-50";

                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-5 py-3 font-medium">
                                {item.productName}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {f.current_stock ?? "-"}
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-amber-600">
                                {f.forecast_next_4_weeks ?? "-"}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium
                                  ${
                                    f.trend === "increasing"
                                      ? "bg-green-100 text-green-700"
                                      : f.trend === "decreasing"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {f.trend || "—"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center font-medium">
                                {f.confidence_score ?? 0}%
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${riskColor}`}
                                >
                                  {riskLevel}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <button
                                  onClick={() => {
                                    setSelectedProductId(item.productId);
                                    setAiView("single");
                                  }}
                                  className="text-xs px-3 py-1 border border-gray-300 hover:bg-gray-100 rounded-md"
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
