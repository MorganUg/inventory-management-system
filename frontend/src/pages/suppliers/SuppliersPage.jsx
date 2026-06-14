import { Fragment, useState } from "react";
import {
  useSuppliers,
  useDeleteSupplier,
  useSupplier,
} from "../../hooks/useSuppliers.js";
import { PageHeader } from "../../components/shared/PageHeader.jsx";
import { StatCard } from "../../components/ui/StatCard.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import ConfirmDialog from "../../components/shared/ConfirmDialog.jsx";
import ExportMenu from "../../components/shared/ExportMenu";
import SupplierForm from "./SupplierForm.jsx";
import {
  Plus,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Package,
  Truck,
  ToggleRight,
  ToggleLeft,
} from "lucide-react";

export default function SuppliersPage() {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const deleteMutation = useDeleteSupplier();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, name }
  const { data: expandedSupplier, isLoading: loadingExpanded } =
    useSupplier(expandedId);

  const handleEdit = (supplier) => {
    setEditing(supplier);
    setModalOpen(true);
  };
  const handleClose = () => {
    setEditing(null);
    setModalOpen(false);
  };

  const handleDelete = (id, name) => {
    setDeleteError("");
    setConfirmDelete({ id, name });
  };

  const confirmDeleteSupplier = async () => {
    if (!confirmDelete) return;
    try {
      await deleteMutation.mutateAsync(confirmDelete.id);
    } catch (err) {
      setDeleteError(err.response?.data?.error || "Failed to delete supplier.");
    }
    setConfirmDelete(null);
  };

  const toggleExpand = (id) =>
    setExpandedId((prev) => (prev === id ? null : id));

  if (isLoading) return <div className="text-sm text-gray-500">Loading...</div>;

  const activeSuppliers = suppliers.filter((s) => s.is_active);
  const inactiveSuppliers = suppliers.filter((s) => !s.is_active);

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle="Manage your raw material suppliers"
        action={
          <div className="flex items-center gap-2">
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={16} className="mr-1" /> Add Supplier
            </Button>
            <ExportMenu
              data={suppliers}
              filename="suppliers"
              title="Suppliers"
            />
          </div>
        }
      />

      {/* Delete error */}
      {deleteError && (
        <div
          className="mb-4 bg-red-50 border border-red-200 text-red-700
      rounded-lg px-4 py-3 text-sm flex items-center gap-2"
        >
          <span>{deleteError}</span>
          <button
            onClick={() => setDeleteError("")}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total Suppliers"
          value={suppliers.length}
          icon={Truck}
          color="amber"
        />
        <StatCard
          label="Active"
          value={activeSuppliers.length}
          icon={ToggleRight}
          color="green"
        />
        <StatCard
          label="Inactive"
          value={inactiveSuppliers.length}
          icon={ToggleLeft}
          color="red"
        />
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                {[
                  "Supplier",
                  "Contact",
                  "Materials",
                  "Restocks",
                  "Status",
                  "Actions",
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
              {suppliers.map((s) => (
                <Fragment key={s.id}>
                  <tr
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleExpand(s.id)}
                  >
                    {/* Name + address */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{s.name}</p>
                      {s.address && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {s.address}
                        </p>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {s.contact_name && (
                          <p className="text-gray-700">{s.contact_name}</p>
                        )}
                        {s.phone && (
                          <p className="flex items-center gap-1 text-xs text-gray-400">
                            <Phone size={11} /> {s.phone}
                          </p>
                        )}
                        {s.email && (
                          <p className="flex items-center gap-1 text-xs text-gray-400">
                            <Mail size={11} /> {s.email}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Materials count */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Package size={14} />
                        <span>{s.materials_supplied || 0}</span>
                      </div>
                    </td>

                    {/* Restocks count */}
                    <td className="px-4 py-3 text-gray-600">
                      {s.total_restocks || 0}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge color={s.is_active ? "green" : "gray"}>
                        {s.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(s)}
                          className="text-gray-400 hover:text-amber-500 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded row — shows materials linked to supplier */}
                  {expandedId === s.id && (
                    <tr key={`${s.id}-expanded`} className="bg-amber-50">
                      <td colSpan={6} className="px-6 py-4">
                        <p className="text-xs font-semibold text-amber-700  uppercase mb-2">
                          Materials Supplied
                        </p>
                        {loadingExpanded ? (
                          <p className="text-xs text-gray-400">Loading...</p>
                        ) : expandedSupplier?.materials?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {expandedSupplier.materials.map((m) => (
                              <span
                                key={m.id}
                                className="px-2 py-1 bg-white border border-amber-200
                              text-amber-800 rounded-lg text-xs"
                              >
                                {m.name} — {m.quantity_in_stock} {m.unit}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">
                            No materials linked yet.
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {suppliers.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-10">
            No suppliers yet. Add your first supplier.
          </p>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={handleClose}
        title={editing ? "Edit Supplier" : "Add Supplier"}
      >
        <SupplierForm initial={editing} onSuccess={handleClose} />
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteSupplier}
        title="Delete Supplier"
        message={`Delete supplier "${confirmDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
