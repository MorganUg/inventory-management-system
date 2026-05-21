// src/pages/bom/BomPage.jsx
import { useState } from "react";
import {
  useBoms,
  useActivateBom,
  useDeleteBomItem,
} from "../../hooks/useBom.js";
import { PageHeader } from "../../components/shared/PageHeader.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { StatCard } from "../../components/ui/StatCard.jsx";
import BomForm from "./BomForm.jsx";
import BomItemForm from "./BomItemForm.jsx";
import {
  Plus,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  CheckCircle,
} from "lucide-react";

export default function BomPage() {
  const { data: boms = [], isLoading } = useBoms();
  const activateMutation = useActivateBom();
  const deleteItemMutation = useDeleteBomItem(null);

  const [bomModalOpen, setBomModalOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedBom, setSelectedBom] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState("");

  const toggleExpand = (id) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const handleAddItem = (bom) => {
    setSelectedBom(bom);
    setEditingItem(null);
    setItemModalOpen(true);
  };

  const handleEditItem = (bom, item) => {
    setSelectedBom(bom);
    setEditingItem(item);
    setItemModalOpen(true);
  };

  const handleDeleteItem = async (bomId, itemId) => {
    setError("");
    try {
      await deleteItemMutation.mutateAsync(itemId);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to remove ingredient.");
    }
  };

  const handleActivate = async (id) => {
    setError("");
    try {
      await activateMutation.mutateAsync(id);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to activate BOM.");
    }
  };

  if (isLoading) return <div className="text-sm text-gray-500">Loading...</div>;

  const activeBoms = boms.filter((b) => b.is_active);
  const totalRecipes = new Set(boms.map((b) => b.finished_good_id)).size;

  return (
    <div>
      <PageHeader
        title="Bill of Materials"
        subtitle="Define production recipes for your finished goods"
        action={
          <Button onClick={() => setBomModalOpen(true)}>
            <Plus size={16} className="mr-1" /> New BOM
          </Button>
        }
      />

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total BOMs"
          value={boms.length}
          icon={BookOpen}
          color="amber"
        />
        <StatCard
          label="Active Recipes"
          value={activeBoms.length}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          label="Products Covered"
          value={totalRecipes}
          icon={BookOpen}
          color="blue"
        />
      </div>

      {/* BOM List */}
      <div className="space-y-3">
        {boms.map((bom) => (
          <div
            key={bom.id}
            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* BOM Header row */}
            <div
              className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleExpand(bom.id)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">
                    {bom.finished_good_name}
                  </p>
                  <Badge color={bom.is_active ? "green" : "gray"}>
                    {bom.is_active ? "Active" : `v${bom.version}`}
                  </Badge>
                  {bom.is_active && (
                    <span className="text-xs text-gray-400">
                      v{bom.version}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {bom.ingredient_count || 0} ingredient
                  {bom.ingredient_count !== 1 ? "s" : ""}
                  {bom.notes && ` — ${bom.notes}`}
                </p>
              </div>

              <div
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Activate button — only show if not active */}
                {!bom.is_active && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={activateMutation.isPending}
                    onClick={() => handleActivate(bom.id)}
                  >
                    Set active
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAddItem(bom)}
                >
                  <Plus size={14} className="mr-1" /> Add ingredient
                </Button>
              </div>

              {expandedId === bom.id ? (
                <ChevronUp size={16} className="text-gray-400" />
              ) : (
                <ChevronDown size={16} className="text-gray-400" />
              )}
            </div>

            {/* Expanded ingredients table */}
            {expandedId === bom.id && (
              <div className="border-t border-gray-100">
                {bom.items && bom.items.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {[
                          "Ingredient",
                          "Qty per unit",
                          "Unit",
                          "Notes",
                          "",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {bom.items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-medium">
                            {item.material_name}
                          </td>
                          <td className="px-5 py-3 text-gray-600">
                            {item.quantity_per_unit}
                          </td>
                          <td className="px-5 py-3 text-gray-500">
                            {item.unit}
                          </td>
                          <td className="px-5 py-3 text-gray-400 text-xs">
                            {item.notes || "—"}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditItem(bom, item)}
                                className="text-gray-400 hover:text-amber-500 transition-colors"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteItem(bom.id, item.id)
                                }
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-6">
                    No ingredients yet. Add the first ingredient.
                  </p>
                )}
              </div>
            )}
          </div>
        ))}

        {boms.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
            <p className="text-sm text-gray-400">
              No recipes yet. Create your first BOM to define production
              ingredients.
            </p>
          </div>
        )}
      </div>

      {/* Create BOM modal */}
      <Modal
        open={bomModalOpen}
        onClose={() => setBomModalOpen(false)}
        title="Create BOM"
      >
        <BomForm onSuccess={() => setBomModalOpen(false)} />
      </Modal>

      {/* Add / edit ingredient modal */}
      <Modal
        open={itemModalOpen}
        onClose={() => {
          setItemModalOpen(false);
          setEditingItem(null);
        }}
        title={editingItem ? "Edit Ingredient" : "Add Ingredient"}
      >
        {selectedBom && (
          <BomItemForm
            bom={selectedBom}
            initial={editingItem}
            onSuccess={() => {
              setItemModalOpen(false);
              setEditingItem(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
