import React, { useState } from "react";
import {
  useCustomer,
  useCustomers,
  useDeleteCustomer,
} from "../../hooks/useCustomers.js";
import { Button } from "../../components/ui/Button.jsx";
import { PageHeader } from "../../components/shared/PageHeader.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { StatCard } from "../../components/ui/StatCard.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import ConfirmDialog from "../../components/shared/ConfirmDialog.jsx";
import ExportMenu from "../../components/shared/ExportMenu";
import CustomerForm from "./CustomerForm.jsx";
import {
  Mail,
  Pencil,
  Phone,
  Plus,
  ShoppingBag,
  Trash2,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";

export default function CustomerPage() {
  const { data: customers = [], isLoading } = useCustomers();
  const deleteMutation = useDeleteCustomer();

  const [modalOpen, setModelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, name }

  const { data: expandedCustomer, isLoading: loadingExpanded } =
    useCustomer(expandedId);

  const handleEdit = (customer) => {
    setEditing(customer);
    setModelOpen(true);
  };
  const handleClose = () => {
    setEditing(null);
    setModelOpen(false);
  };

  const handleDelete = (id, name) => {
    setDeleteError("");
    setConfirmDelete({ id, name });
  };

  const confirmDeleteCustomer = async () => {
    if (!confirmDelete) return;
    try {
      await deleteMutation.mutateAsync(confirmDelete.id);
    } catch (errr) {
      setDeleteError(
        errr.response?.data?.error || "failed to delete customer.",
      );
    }
    setConfirmDelete(null);
  };

  const toggleExpand = (id) =>
    setExpandedId((prev) => (prev === id ? null : id));

  if (isLoading) return <div className="text-sm text-gray-500">Loading...</div>;

  const activeCustomers = customers.filter((c) => c.is_active);
  const inactiveCustomers = customers.filter((c) => !c.is_active);
  const totalDispatches = customers.reduce(
    (sum, c) => sum + parseInt(c.total_dispatches || 0),
    0,
  );

  return (
    <div>
      <PageHeader
        title="Customer Management"
        subtitle="Manage your dispatch recipients"
        action={
          <div className="flex items-center gap-2">
            <Button onClick={() => setModelOpen(true)}>
              <Plus size={16} className="mr-1" /> Add Customer
            </Button>
            <ExportMenu
              data={customers}
              filename="customers"
              title="Customers"
            />
          </div>
        }
      />

      {deleteError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <span>{deleteError}</span>
          <button
            onClick={() => setDeleteError("")}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            X
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Customers"
          value={customers.length}
          icon={Users}
          color="amber"
        />
        <StatCard
          label="Active"
          value={activeCustomers.length}
          icon={UserCheck}
          color="green"
        />
        <StatCard
          label="Inactive"
          value={inactiveCustomers.length}
          icon={UserX}
          color="red"
        />
        <StatCard
          label="Total Dispatches"
          value={totalDispatches}
          icon={ShoppingBag}
          color="blue"
        />
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[650px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                {[
                  "Customer",
                  "Contact",
                  "Dispatches",
                  "Units Received",
                  "States",
                  "",
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
              {customers.map((c) => (
                <React.Fragment key={c.id}>
                  <tr
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleExpand(c.id)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{c.name}</p>
                      {c.address && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {c.address}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {c.contact_name && (
                          <p className="text-gray-700">{c.contact_name}</p>
                        )}
                        {c.phone && (
                          <p className="flex items-center gap-1 text-xs text-gray-400">
                            <Phone size={11} /> {c.phone}
                          </p>
                        )}
                        {c.email && (
                          <p className="flex items-center gap-1 text-xs text-gray-400">
                            <Mail size={11} /> {c.email}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {c.total_dispatches || 0}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {c.total_units_recieved || 0}
                    </td>

                    <td>
                      <Badge color={c.is_active ? "green" : "gray"}>
                        {c.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>

                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(c)}
                          className="text-gray-400 hover:text-amber-500 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedId === c.id && (
                    <tr key={`${c.id}-expanded`} className="bg-blue-50">
                      <td colSpan={6} className="px-6 py-4">
                        <p className="text-xs font-semibold text-blue-700 uppercase">
                          Dispatch History
                        </p>
                        {loadingExpanded ? (
                          <p className="text-xs text-gray-400">Loading.....</p>
                        ) : expandedCustomer?.dispatches?.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-gray-500">
                                  <th className="text-left pb-2">Products</th>
                                  <th className="text-left pb-2">Qty</th>
                                  <th className="text-left pb-2">Status</th>
                                  <th className="text-left pb-2">Date</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-blue-100">
                                {expandedCustomer.dispatches.map((d) => (
                                  <tr key={d.id}>
                                    <td className="py-1.5 text-gray-700">
                                      {d.product_name}
                                    </td>
                                    <td className="py-1.5 text-gray-700">
                                      {d.quantity_dispatched}
                                    </td>
                                    <td className="py-1.5">
                                      <Badge
                                        color={
                                          d.status === "dispatch"
                                            ? "green"
                                            : d.status === "pending"
                                              ? "amber"
                                              : "red"
                                        }
                                      >
                                        {d.status}
                                      </Badge>
                                    </td>
                                    <td className="py-1.5 text-gray-500">
                                      {new Date(
                                        d.dispatched_at,
                                      ).toLocaleDateString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">
                            No dispatches yet for this customer.
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {customers.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-10">
            No customers yet. Add your first customer.
          </p>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={handleClose}
        title={editing ? "Edit Customer" : "Add Customer"}
      >
        <CustomerForm initial={editing} onSuccess={handleClose} />
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteCustomer}
        title="Delete Customer"
        message={`Delete customer "${confirmDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
