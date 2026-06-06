import React, { useState } from "react";
import { PageHeader } from "../../components/shared/PageHeader.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { StatCard } from "../../components/ui/StatCard.jsx";
import { useRestocks } from "../../hooks/useRestocks.js";
import { Modal } from "../../components/ui/Modal.jsx";
import RestockForm from "./RestockForm.jsx";
import ExportMenu from "../../components/shared/ExportMenu";
import {
  ArrowDownCircle,
  Calendar,
  DollarSign,
  Package,
  Plus,
  Truck,
} from "lucide-react";

export default function RestocksPage() {
  const { data: restocks = [], isLoading } = useRestocks();
  const [modalOpen, setModalOpen] = useState(false);

  if (isLoading) return <div className="text-sm text-gray-500">Loading</div>;

  // Summary calculations
  const totalRestocks = restocks.length;
  const totalSpend = restocks.reduce(
    (sum, r) => sum + parseFloat(r.total_cost || 0),
    0,
  );
  const uniqueMaterials = new Set(restocks.map((r) => r.material_id)).size;
  const todayRestocks = restocks.filter(
    (r) => new Date(r.received_at).toDateString() === new Data().toDateString(),
  ).length;

  return (
    <div>
      <PageHeader
        title="Restock Management"
        subtitle="Record raw material purchase from suppliers"
        action={
          <div className="flex items-center gap-2">
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={16} className="mr-1" /> Record Restock
            </Button>
            <ExportMenu data={restocks} filename="restocks" title="Restocks" />
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 ">
        <StatCard
          label="Total Restocks"
          value={totalRestocks}
          icon={ArrowDownCircle}
          color="amber"
        />
        <StatCard
          label="Material Restocked"
          value={uniqueMaterials}
          icon={Package}
          color="blue"
        />
        <StatCard
          label="Today's Restocks"
          value={todayRestocks}
          icon={Calendar}
          color="green"
        />
        <StatCard
          label="Total Spend (UGX)"
          value={totalSpend.toLocaleString()}
          icon={DollarSign}
          color="red"
        />
      </div>

      {/* Restocks Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {[
                "Material",
                "Supplier",
                "Qty Recieved",
                "Cost/Unit",
                "Total Cost",
                "Received By",
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
            {restocks.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{r.material_name}</p>
                  <p className="text-xs text-gray-400">{r.material_unit}</p>
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Truck size={13} />
                    <span>{r.supplier_name || "-"}</span>
                  </div>
                </td>

                <td className="px-4 py-3 font-medium text-green-600">
                  +{r.quantity_received} {r.material_unit}
                </td>

                <td className="px-4 py-3 text-gray-600">
                  UGX {parseFloat(r.cost_per_unit).toLocaleString()}
                </td>

                <td className="px-4 py-3 font-medium text-gray-900">
                  UGX {parseFloat(r.total_cost).toLocaleString()}
                </td>

                <td className="px-4 py-3 text-gray-600">
                  {r.received_by_name || "-"}
                </td>

                <td className="px-4 py-3 text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar size={13} />
                    {new Date(r.received_at).toLocaleDateString()}
                  </div>
                </td>

                <td className="px-4 py-3 text-gray-400 text-xs max-w-32 truncate">
                  {r.notes || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {restocks.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-10">
            No restocks recorded yet.
          </p>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Restock"
      >
        <RestockForm onSuccess={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
