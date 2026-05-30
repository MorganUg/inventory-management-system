// src/pages/stockMovements/StockMovementsPage.jsx
import { useState } from "react";
import {
  useStockMovements,
  useStockMovementsSummary,
} from "../../hooks/useStockMovements.js";
import { PageHeader } from "../../components/shared/PageHeader.jsx";
import { StatCard } from "../../components/ui/StatCard.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import ExportMenu from "../../components/shared/ExportMenu";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart2,
  Calendar,
  Filter,
} from "lucide-react";

//Movement type config
const movementConfig = {
  restock: {
    label: "Restock",
    color: "green",
    sign: "+",
    textColor: "text-green-600",
  },
  production_use: {
    label: "Production use",
    color: "red",
    sign: "−",
    textColor: "text-red-500",
  },
  production_output: {
    label: "Production output",
    color: "blue",
    sign: "+",
    textColor: "text-blue-600",
  },
  dispatch: {
    label: "Dispatch",
    color: "amber",
    sign: "−",
    textColor: "text-amber-600",
  },
};

export default function StockMovementsPage() {
  // Filters
  const [filters, setFilters] = useState({
    item_type: "",
    movement_type: "",
    from: "",
    to: "",
    limit: 50,
    offset: 0,
  });

  const { data, isLoading } = useStockMovements(filters);
  const { data: summary = [] } = useStockMovementsSummary();

  const movements = data?.data || [];
  const total = data?.total || 0;

  const updateFilter = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value, offset: 0 }));

  const clearFilters = () =>
    setFilters({
      item_type: "",
      movement_type: "",
      from: "",
      to: "",
      limit: 50,
      offset: 0,
    });

  const hasActiveFilters =
    filters.item_type || filters.movement_type || filters.from || filters.to;

  //Summary totals
  const totalIn = summary.reduce(
    (sum, s) => sum + parseFloat(s.total_in || 0),
    0,
  );
  const totalOut = summary.reduce(
    (sum, s) => sum + Math.abs(parseFloat(s.total_out || 0)),
    0,
  );

  return (
    <div>
      <PageHeader
        title="Stock Movements"
        subtitle="Complete audit trail of all stock changes"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total Movements"
          value={total}
          icon={BarChart2}
          color="amber"
        />
        <StatCard
          label="Total Stock In"
          value={totalIn.toLocaleString()}
          icon={ArrowDownCircle}
          color="green"
        />
        <StatCard
          label="Total Stock Out"
          value={totalOut.toLocaleString()}
          icon={ArrowUpCircle}
          color="red"
        />
      </div>

      {/* Summary table — stock in vs out per item */}
      {summary.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="flex items-center gap-2 px-5 py-4 border-b bg-gray-50">
            <BarChart2 size={16} className="text-amber-500" />
            <h2 className="font-semibold text-gray-800">
              Stock Summary Per Item
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Item", "Type", "Unit", "Total In", "Total Out", "Net"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {summary.map((s) => (
                <tr
                  key={`${s.item_type}-${s.item_id}`}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {s.item_name}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      color={
                        s.item_type === "raw_material" ? "purple" : "green"
                      }
                    >
                      {s.item_type === "raw_material"
                        ? "Raw material"
                        : "Finished good"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{s.unit}</td>
                  <td className="px-4 py-3 text-green-600 font-medium">
                    +{parseFloat(s.total_in || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-red-500 font-medium">
                    {parseFloat(s.total_out || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <span
                      className={
                        parseFloat(s.net) >= 0
                          ? "text-green-600"
                          : "text-red-500"
                      }
                    >
                      {parseFloat(s.net) >= 0 ? "+" : ""}
                      {parseFloat(s.net).toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={15} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-700">
            Filter movements
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-amber-600 hover:text-amber-700"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Item type */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Item type
            </label>
            <select
              value={filters.item_type}
              onChange={(e) => updateFilter("item_type", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2
                                text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">All types</option>
              <option value="raw_material">Raw material</option>
              <option value="finished_good">Finished good</option>
            </select>
          </div>

          {/* Movement type */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Movement type
            </label>
            <select
              value={filters.movement_type}
              onChange={(e) => updateFilter("movement_type", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2
                                text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">All movements</option>
              <option value="restock">Restock</option>
              <option value="production_use">Production use</option>
              <option value="production_output">Production output</option>
              <option value="dispatch">Dispatch</option>
            </select>
          </div>

          {/* Date from */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              From date
            </label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => updateFilter("from", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2
                                text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Date to */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">To date</label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => updateFilter("to", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800">Movement Log</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              Showing {movements.length} of {total} movements
            </span>
            <ExportMenu
              data={movements}
              filename="stock_movements"
              title="Stock Movement Log"
            />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {[
                "Item",
                "Type",
                "Movement",
                "Quantity",
                "Reference",
                "Recorded By",
                "Date",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-sm text-gray-400"
                >
                  Loading...
                </td>
              </tr>
            ) : (
              movements.map((m) => {
                const config = movementConfig[m.movement_type] || {};
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    {/* Item name */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{m.item_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {m.item_unit}
                      </p>
                    </td>

                    {/* Item type */}
                    <td className="px-4 py-3">
                      <Badge
                        color={
                          m.item_type === "raw_material" ? "blue" : "green"
                        }
                      >
                        {m.item_type === "raw_material"
                          ? "Raw material"
                          : "Finished good"}
                      </Badge>
                    </td>

                    {/* Movement type */}
                    <td className="px-4 py-3">
                      <Badge color={config.color || "gray"}>
                        {config.label || m.movement_type}
                      </Badge>
                    </td>

                    {/* Quantity — positive = green, negative = red */}
                    <td className={`px-4 py-3 font-medium ${config.textColor}`}>
                      {parseFloat(m.quantity) > 0 ? "+" : ""}
                      {parseFloat(m.quantity).toLocaleString()}
                    </td>

                    {/* Reference ID */}
                    <td className="px-4 py-3 text-gray-500">
                      {m.reference_id ? (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                          #{m.reference_id}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* Recorded by */}
                    <td className="px-4 py-3 text-gray-500">
                      {m.created_by_name || "—"}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>
                          {new Date(m.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(m.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {!isLoading && movements.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-10">
            No stock movements found.
          </p>
        )}

        {/* Pagination */}
        {total > filters.limit && (
          <div className="flex items-center justify-between px-5 py-4 border-t">
            <button
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  offset: Math.max(0, prev.offset - prev.limit),
                }))
              }
              disabled={filters.offset === 0}
              className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <span className="text-xs text-gray-400">
              Page {Math.floor(filters.offset / filters.limit) + 1} of{" "}
              {Math.ceil(total / filters.limit)}
            </span>
            <button
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  offset: prev.offset + prev.limit,
                }))
              }
              disabled={filters.offset + filters.limit >= total}
              className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
