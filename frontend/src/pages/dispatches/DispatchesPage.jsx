import { useState } from "react";
import { useDispatches } from "../../hooks/useDispatches.js";
import { PageHeader } from "../../components/shared/PageHeader.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { StatCard } from "../../components/ui/StatCard.jsx";
import DispatchForm from "./DispatchForm.jsx";
import ExportMenu from "../../components/shared/ExportMenu";
import {
  Plus,
  ArrowUpCircle,
  Package,
  Users,
  TrendingUp,
  Calendar,
  Truck,
} from "lucide-react";

export default function DispatchesPage() {
  const { data: dispatches = [], isLoading } = useDispatches();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  if (isLoading) return <div className="text-sm text-gray-500">Loading...</div>;

  // Summary calculations
  const totalDispatches = dispatches.length;
  const totalUnits = dispatches.reduce(
    (sum, d) => sum + parseFloat(d.quantity_dispatched || 0),
    0,
  );
  const totalValue = dispatches.reduce(
    (sum, d) =>
      sum +
      parseFloat(d.quantity_dispatched || 0) *
        parseFloat(d.price_per_unit || 0),
    0,
  );
  const todayDispatches = dispatches.filter(
    (d) =>
      new Date(d.dispatched_at).toDateString() === new Date().toDateString(),
  ).length;

  // Search filter
  const filtered = dispatches.filter(
    (d) =>
      (d.product || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.customer || "").toLowerCase().includes(search.toLowerCase()),
  );

  // Top customers
  const byCustomer = dispatches.reduce((acc, d) => {
    const name = d.customer || "Unknown";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  const topCustomers = Object.entries(byCustomer)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div>
      <PageHeader
        title="Dispatches"
        subtitle="Track outgoing finished goods to customers"
        action={
          <div className="flex items-center gap-2">
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={16} className="mr-1" /> New Dispatch
            </Button>
            <ExportMenu
              data={dispatches}
              filename="dispatches"
              title="Dispatches"
            />
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Dispatches"
          value={totalDispatches}
          icon={ArrowUpCircle}
          color="amber"
        />
        <StatCard
          label="Total Units Sent"
          value={totalUnits.toLocaleString()}
          icon={Package}
          color="blue"
        />
        <StatCard
          label="Today's Dispatches"
          value={todayDispatches}
          icon={Calendar}
          color="green"
        />
        <StatCard
          label="Unique Customers"
          value={Object.keys(byCustomer).length}
          icon={Users}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        {/* Total value banner */}
        <div className="lg:col-span-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-amber-700 font-medium">
              Total Dispatch Value
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              All time — based on price per unit at time of dispatch
            </p>
          </div>
          <div className="flex items-center gap-2 text-amber-800">
            <TrendingUp size={20} />
            <p className="text-2xl font-bold">
              UGX {totalValue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Top customers */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
            Top Customers
          </p>
          {topCustomers.length > 0 ? (
            <div className="space-y-2">
              {topCustomers.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 truncate">{name}</span>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">No dispatches yet.</p>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by product or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 border border-gray-300 rounded-lg px-3 py-2text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      {/* Dispatches Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {[
                "Product",
                "Customer",
                "Qty Dispatched",
                "Value",
                "Dispatched By",
                "Date",
                "Notes",
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
            {filtered.map((d) => {
              const value =
                parseFloat(d.quantity_dispatched || 0) *
                parseFloat(d.price_per_unit || 0);
              return (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {d.product}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Truck size={13} />
                      <span>{d.customer || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-amber-600">
                    {parseFloat(d.quantity_dispatched).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {value > 0 ? `UGX ${value.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {d.dispatched_by_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(d.dispatched_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-32 truncate">
                    {d.notes || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-10">
            {search
              ? "No dispatches match your search."
              : "No dispatches recorded yet."}
          </p>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Dispatch"
      >
        <DispatchForm onSuccess={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
