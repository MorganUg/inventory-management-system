import { useState } from "react";
import {
  useFinishedGoods,
  useDeleteFinishedGood,
} from "../../hooks/useFinishedGoods.js";
import { PageHeader } from "../../components/shared/PageHeader.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import ConfirmDialog from "../../components/shared/ConfirmDialog.jsx";
import { StatCard } from "../../components/ui/StatCard.jsx";
import FinishedGoodForm from "./FinishedGoodForm.jsx";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle,
  BoxSelect,
} from "lucide-react";

export default function FinishedGoodsPage() {
  const { data: goods = [], isLoading } = useFinishedGoods();
  const deleteMutation = useDeleteFinishedGood();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, name }
  const [search, setSearch] = useState("");

  const handleEdit = (good) => {
    setEditing(good);
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

  const confirmDeleteProduct = async () => {
    if (!confirmDelete) return;
    try {
      await deleteMutation.mutateAsync(confirmDelete.id);
    } catch (err) {
      setDeleteError(err.response?.data?.error || "Failed to delete product.");
    }
    setConfirmDelete(null);
  };

  if (isLoading) return <div className="text-sm text-gray-500">Loading...</div>;

  // Summary calculations
  const totalProducts = goods.length;
  const inStockProducts = goods.filter((g) => g.quantity_in_stock > 0);
  const outOfStock = goods.filter((g) => g.quantity_in_stock === 0);
  const totalUnits = goods.reduce(
    (sum, g) => sum + parseFloat(g.quantity_in_stock || 0),
    0,
  );
  const totalValue = goods.reduce(
    (sum, g) =>
      sum +
      parseFloat(g.quantity_in_stock || 0) * parseFloat(g.price_per_unit || 0),
    0,
  );

  // Search filter
  const filtered = goods.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.category || "").toLowerCase().includes(search.toLowerCase()),
  );

  const getStockBadge = (qty) => {
    if (qty <= 0) return { color: "red", label: "Out of stock" };
    if (qty <= 20) return { color: "amber", label: "Low stock" };
    return { color: "green", label: "In stock" };
  };

  return (
    <div>
      <PageHeader
        title="Finished Goods"
        subtitle="Products ready for dispatch"
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} className="mr-1" /> Add Product
          </Button>
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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Products"
          value={totalProducts}
          icon={Package}
          color="amber"
        />
        <StatCard
          label="In Stock"
          value={inStockProducts.length}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          label="Out of Stock"
          value={outOfStock.length}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          label="Total Units"
          value={totalUnits.toLocaleString()}
          icon={BoxSelect}
          color="blue"
        />
      </div>

      {/* Total stock value banner */}
      {totalValue > 0 && (
        <div
          className="mb-6 bg-amber-50 border border-amber-200
        rounded-xl px-5 py-4 flex items-center justify-between"
        >
          <div>
            <p className="text-sm text-amber-700 font-medium">
              Total Stock Value
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Based on current stock × price per unit
            </p>
          </div>
          <p className="text-2xl font-bold text-amber-800">
            UGX {totalValue.toLocaleString()}
          </p>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search products or categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 border border-gray-300 rounded-lg px-3 py-2
          text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {[
                "Product",
                "Category",
                "Unit",
                "In Stock",
                "Price/Unit",
                "Stock Value",
                "Shelf Life",
                "Status",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-xs font-medium
              text-gray-500 uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((g) => {
              const badge = getStockBadge(parseFloat(g.quantity_in_stock));
              const stockValue =
                parseFloat(g.quantity_in_stock || 0) *
                parseFloat(g.price_per_unit || 0);
              return (
                <tr key={g.id} className="hover:bg-gray-50">
                  {/* Name */}
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {g.name}
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 text-gray-500">
                    {g.category || "—"}
                  </td>

                  {/* Unit */}
                  <td className="px-4 py-3 text-gray-500">{g.unit}</td>

                  {/* Qty in stock */}
                  <td className="px-4 py-3 font-medium">
                    {parseFloat(g.quantity_in_stock).toLocaleString()}
                  </td>

                  {/* Price per unit */}
                  <td className="px-4 py-3 text-gray-600">
                    {g.price_per_unit
                      ? `UGX ${parseFloat(g.price_per_unit).toLocaleString()}`
                      : "—"}
                  </td>

                  {/* Stock value */}
                  <td className="px-4 py-3 text-gray-700 font-medium">
                    {stockValue > 0
                      ? `UGX ${stockValue.toLocaleString()}`
                      : "—"}
                  </td>

                  {/* Shelf life */}
                  <td className="px-4 py-3 text-gray-500">
                    {g.expiry_duration_days
                      ? `${g.expiry_duration_days} days`
                      : "—"}
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-3">
                    <Badge color={badge.color}>{badge.label}</Badge>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(g)}
                        className="text-gray-400 hover:text-amber-500
                    transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(g.id, g.name)}
                        disabled={parseFloat(g.quantity_in_stock) > 0}
                        className="text-gray-400 hover:text-red-500
                    transition-colors disabled:opacity-30
                    disabled:cursor-not-allowed"
                        title={
                          parseFloat(g.quantity_in_stock) > 0
                            ? "Cannot delete — stock remaining"
                            : "Delete product"
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-10">
            {search
              ? "No products match your search."
              : "No finished goods yet."}
          </p>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={handleClose}
        title={editing ? "Edit Product" : "Add Product"}
      >
        <FinishedGoodForm initial={editing} onSuccess={handleClose} />
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteProduct}
        title="Delete Finished Good"
        message={`Delete finished good "${confirmDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
