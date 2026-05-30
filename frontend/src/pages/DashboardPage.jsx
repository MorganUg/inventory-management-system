import { useNavigate } from "react-router-dom";
import { useRawMaterials } from "../hooks/useRawMaterials.js";
import { useBatches } from "../hooks/useBatches.js";
import { useQuery } from "@tanstack/react-query";
import { getFinishedGoods } from "../api/finishedGoods.api.js";
import { useDispatches } from "../hooks/useDispatches.js";
import {
  useProductionChart,
  useDispatchChart,
  useTopProductsChart,
  useStockLevelsChart,
} from "../hooks/useReports.js";
import { StatCard } from "../components/ui/StatCard.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  AlertTriangle,
  ClipboardList,
  Package,
  FlaskConical,
  ArrowUpCircle,
  PlayCircle,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  TrendingUp,
  BarChart as BarChartIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { Card } from "../components/ui/Card.jsx";

const COLORS = [
  "#f59e0b",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
];

const statusConfig = {
  planned: { color: "blue", icon: Clock },
  in_progress: { color: "amber", icon: PlayCircle },
  completed: { color: "green", icon: CheckCircle },
  concelled: { color: "red", icon: XCircle },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: materials = [] } = useRawMaterials();
  const { data: batches = [] } = useBatches();
  const { data: dispatches = [] } = useDispatches();
  const { data: goods = [] } = useQuery({
    queryKey: ["finishedGoods"],
    queryFn: () => getFinishedGoods().then((res) => res.data),
  });

  const { data: productionChart = [] } = useProductionChart();
  const { data: dispatchChart = [] } = useDispatchChart();
  const { data: topProducts = [] } = useTopProductsChart();
  const { data: stockLevels = [] } = useStockLevelsChart();

  const lowStock = materials.filter(
    (m) => parseFloat(m.quantity_in_stock) <= parseFloat(m.reorder_level),
  );
  const activeBatches = batches.filter((b) => b.status === "in_progress");
  const recentBatches = batches.slice(0, 6);
  const todayDispatches = dispatches.filter(
    (d) =>
      new Date(d.dispatched_at).toDateString() === new Date().toDateString(),
  );
  const totalStockValue = goods.reduce((sum, g) => {
    const stock = parseFloat(g.quantity_in_stock || 0);
    const price = parseFloat(g.price_per_unit || 0);
    return sum + stock * price;
  }, 0);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="space-y-6">
      <div className="bg-amber-500 rounded-xl px-5 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-amber-100 text-sm">
              {greeting}, {user?.username}
            </p>
            <p className="text-amber-100 text-xs">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-2">
          {lowStock.length > 0 && (
            <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1 text-xs">
              <AlertTriangle size={12} />
              <span>
                {lowStock.length} low stock alert
                {lowStock.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
          {activeBatches.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white/20 rounded-lg px-3 py-1 text-xs">
              <PlayCircle size={12} />
              <span>
                {activeBatches.length} batch
                {activeBatches.length > 1 ? "es" : ""} in production
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Raw Materials"
          value={materials.length}
          icon={FlaskConical}
          color="amber"
        />
        <StatCard
          label="Finished Goods"
          value={goods.length}
          icon={Package}
          color="green"
        />
        <StatCard
          label="Active Batches"
          value={activeBatches.length}
          icon={ClipboardList}
          color="blue"
        />
        <StatCard
          label="Today's Dispatches"
          value={todayDispatches.length}
          icon={ArrowUpCircle}
          color="amber"
        />
      </div>

      {/* Stock value banner */}
      {totalStockValue > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-green-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Total finished goods stock value
              </p>
              <p className="text-xs text-gray-400">
                Based on current stock × price per unit
              </p>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            UGX {totalStockValue.toLocaleString()}
          </p>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production output over time */}
        <Card
          title="Production output — last 12 weeks"
          icon={BarChart ?? ClipboardList}
        >
          {productionChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={productionChart}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Bar
                  dataKey="total_yield"
                  name="Units produced"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">
              No production data yet.
            </div>
          )}
        </Card>

        {/* Dispatches over time */}
        <Card
          title="Dispatches — last 12 weeks"
          icon={ArrowUpCircle}
          color="text-blue-500"
        >
          {dispatchChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={dispatchChart}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total_units"
                  name="Units dispatched"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#3b82f6" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">
              No dispatch data yet.
            </div>
          )}
        </Card>

        {/* Top dispatched products */}
        <Card
          title="Top dispatched products"
          icon={Package}
          color="text-green-500"
          action={
            <button
              onClick={() => navigate("/reports")}
              className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-600 transition-colors"
            >
              Full report <ArrowRight size={12} />
            </button>
          }
        >
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ top: 0, right: 0, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Bar
                  dataKey="total_dispatched"
                  name="Units dispatched"
                  radius={[0, 4, 4, 0]}
                >
                  {topProducts.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">
              No dispatch data yet.
            </div>
          )}
        </Card>

        {/* Raw material stock vs reorder */}
        <Card
          title="Raw material stock vs reorder level"
          icon={FlaskConical}
          color="text-purple-500"
          action={
            <button
              onClick={() => navigate("/raw-materials")}
              className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-600 transition-colors"
            >
              View all <ArrowRight size={12} />
            </button>
          }
        >
          {stockLevels.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={stockLevels}
                layout="vertical"
                margin={{ top: 0, right: 0, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                />
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
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">
              No material data yet.
            </div>
          )}
        </Card>
      </div>

      {/* Bottom row alerts + recent batches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock alerts */}
        <Card
          title="Low stock alerts"
          icon={AlertTriangle}
          color="text-red-500"
          action={
            <button
              onClick={() => navigate("/raw-materials")}
              className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-600 transition-colors"
            >
              View all <ArrowRight size={12} />
            </button>
          }
        >
          {lowStock.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <CheckCircle size={15} />
              All materials are sufficiently stocked.
            </div>
          ) : (
            <div className="space-y-2">
              {lowStock.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between py-2.5 border-b last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {m.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {m.supplier || "No supplier linked"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-500">
                      {parseFloat(m.quantity_in_stock).toLocaleString()}{" "}
                      {m.unit}
                    </p>
                    <p className="text-xs text-gray-400">
                      Reorder at {m.reorder_level} {m.unit}
                    </p>
                  </div>
                </div>
              ))}
              <button
                onClick={() => navigate("/restocks")}
                className="w-full mt-2 text-sm text-center text-amber-600hover:text-amber-700 font-medium py-2 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors"
              >
                Record a restock →
              </button>
            </div>
          )}
        </Card>

        {/* Recent batches */}
        <Card
          title="Recent production batches"
          icon={ClipboardList}
          color="text-amber-500"
          action={
            <button
              onClick={() => navigate("/batches")}
              className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-600 transition-colors"
            >
              View all <ArrowRight size={12} />
            </button>
          }
        >
          {recentBatches.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No batches yet.
            </p>
          ) : (
            <div className="space-y-0">
              {recentBatches.map((b) => {
                const config = statusConfig[b.status] || {};
                const Icon = config.icon || Clock;
                return (
                  <div
                    key={b.id}
                    onClick={() => navigate(`/batches/${b.id}`)}
                    className="flex items-center justify-between py-3 border-b last:border-0 cursor-pointer hover:bg-gray-50 -mx-5 px-5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-1.5 rounded-lg
                        ${
                          b.status === "completed"
                            ? "bg-green-50"
                            : b.status === "in_progress"
                              ? "bg-amber-50"
                              : b.status === "cancelled"
                                ? "bg-red-50"
                                : "bg-blue-50"
                        }`}
                      >
                        <Icon
                          size={14}
                          className={
                            b.status === "completed"
                              ? "text-green-500"
                              : b.status === "in_progress"
                                ? "text-amber-500"
                                : b.status === "cancelled"
                                  ? "text-red-500"
                                  : "text-blue-500"
                          }
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {b.batch_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {b.start_date
                            ? new Date(b.start_date).toLocaleDateString()
                            : "Not started"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge color={config.color}>
                        {b.status.replace("_", " ")}
                      </Badge>
                      <ArrowRight size={13} className="text-gray-300" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
