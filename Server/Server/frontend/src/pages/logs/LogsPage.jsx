import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";
import { PageHeader } from "../../components/shared/PageHeader.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import ExportMenu from "../../components/shared/ExportMenu";
import {
  Clock,
  User,
  Package,
  ArrowUp,
  ArrowDown,
  FlaskConical,
} from "lucide-react";

export default function LogsPage() {
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    movement_type: "",
    limit: 50,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["logs", "activity", filters],
    queryFn: () =>
      api.get("/stock-movements", { params: filters }).then((res) => res.data),
  });

  const movements = data?.data || [];

  const getActionIcon = (type) => {
    if (type === "restock")
      return <ArrowDown className="text-green-600" size={16} />;
    if (type === "dispatch")
      return <ArrowUp className="text-red-600" size={16} />;
    if (type === "production_use")
      return <FlaskConical className="text-amber-600" size={16} />;
    if (type === "production_output")
      return <Package className="text-blue-600" size={16} />;
    return <Clock size={16} />;
  };

  const getActionLabel = (type) => {
    const labels = {
      restock: "Restock",
      dispatch: "Dispatch",
      production_use: "Production Consumption",
      production_output: "Production Output",
    };
    return labels[type] || type;
  };

  return (
    <div>
      <PageHeader
        title="System Activity Logs"
        subtitle="Track who did what across the system"
        action={
          <ExportMenu
            data={movements}
            filename="system_activity_log"
            title="System Activity Log"
          />
        }
      />

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 mb-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs text-gray-500">From Date</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            className="border rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">To Date</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            className="border rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Action Type</label>
          <select
            value={filters.movement_type}
            onChange={(e) =>
              setFilters({ ...filters, movement_type: e.target.value })
            }
            className="border rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="">All Actions</option>
            <option value="restock">Restock</option>
            <option value="production_use">Production Use</option>
            <option value="production_output">Production Output</option>
            <option value="dispatch">Dispatch</option>
          </select>
        </div>
        <button
          onClick={() =>
            setFilters({ from: "", to: "", movement_type: "", limit: 50 })
          }
          className="text-sm px-4 py-1.5 border rounded-lg hover:bg-gray-50"
        >
          Clear Filters
        </button>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[650px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Time
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Action
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Item
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Quantity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-400">
                    Loading activity...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-400">
                    No activity found for the selected filters.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(m.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="font-medium text-gray-700">
                          {m.created_by_name || "System"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getActionIcon(m.movement_type)}
                        <span className="text-gray-700">
                          {getActionLabel(m.movement_type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {m.item_name}
                      <span className="text-gray-400 text-xs ml-1">
                        ({m.item_unit})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      <span
                        className={
                          m.quantity < 0 ? "text-red-600" : "text-green-600"
                        }
                      >
                        {m.quantity > 0 ? "+" : ""}
                        {m.quantity}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Showing the most recent inventory and production activity. User logins
        and account changes are tracked separately in the Users section.
      </div>
    </div>
  );
}
