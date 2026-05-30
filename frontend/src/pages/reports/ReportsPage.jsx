// src/pages/reports/ReportsPage.jsx
import { useState } from "react";
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
import { PageHeader } from "../../components/shared/PageHeader.jsx";
import { StatCard } from "../../components/ui/StatCard.jsx";
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
  Download,
} from "lucide-react";

// CSV Export helper
const exportCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((row) =>
    Object.values(row)
      .map((v) => (typeof v === "string" && v.includes(",") ? `"${v}"` : v))
      .join(","),
  );
  const csv = [headers, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// Section wrapper
const Section = ({
  title,
  icon: Icon,
  color = "text-amber-500",
  children,
  onExport,
  data,
}) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center gap-2 px-5 py-4 border-b bg-gray-50">
      <Icon size={16} className={color} />
      <h2 className="font-semibold text-gray-800">{title}</h2>
      {onExport && data && data.length > 0 && (
        <button
          onClick={onExport}
          className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 hover:text-amber-600 transition-colors"
        >
          <Download size={13} /> Export CSV
        </button>
      )}
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

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "production", label: "Production" },
    { id: "stock", label: "Stock" },
    { id: "dispatches", label: "Dispatches" },
    { id: "consumption", label: "Consumption" },
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
            onExport={() =>
              exportCSV(productionData?.batches, "production_report")
            }
            data={productionData?.batches}
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
            onExport={() =>
              exportCSV(stockData?.raw_materials, "raw_materials_stock")
            }
            data={stockData?.raw_materials}
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
            onExport={() =>
              exportCSV(stockData?.finished_goods, "finished_goods_stock")
            }
            data={stockData?.finished_goods}
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
            onExport={() =>
              exportCSV(dispatchData?.dispatches, "dispatch_report")
            }
            data={dispatchData?.dispatches}
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
            onExport={() =>
              exportCSV(consumptionData?.consumption, "consumption_report")
            }
            data={consumptionData?.consumption}
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
    </div>
  );
}
