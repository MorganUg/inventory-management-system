import React from "react";
import { useForm } from "react-hook-form";
import { useRawMaterials } from "../../hooks/useRawMaterials.js";
import { useSuppliers } from "../../hooks/useSuppliers.js";
import { useCreateRestock } from "../../hooks/useRestocks.js";
import { Button } from "../../components/ui/Button.jsx";

export default function RestockForm({ onSuccess }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { quantity_received: 1, cost_per_unit: 0 },
  });

  const { data: materials = [], isLoading: loadingMaterials } =
    useRawMaterials();
  const { data: suppliers = [], isLoading: loadingSuppliers } = useSuppliers();
  const createMutation = useCreateRestock();

  // Live total of cost preview
  const quantity = parseFloat(watch("quantity_received")) || 0;
  const cost = parseFloat(watch("cost_per_unit")) || 0;
  const totalCost = quantity * cost;

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      quantity_received: parseFloat(data.quantity_received),
      cost_per_unit: parseFloat(data.cost_per_unit),
      material_id: parseInt(data.material_id),
      supplier_id: data.supplier_id ? parseInt(data.supplier_id) : null,
    };

    try {
      await createMutation.mutateAsync(payload);
      onSuccess();
    } catch (err) {
      // error handled in UI
    }
  };

  // Get unit of selected material for display
  const selectedMaterialId = parseInt(watch("material_id"));
  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Material */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Raw Material <span className="text-red-500">*</span>
        </label>
        <select
          {...register("material_id", { required: "Please select a material" })}
          disabled={loadingMaterials}
          className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-50 ${errors.material_id ? "border border-red-400 bg-red-50" : "border-gray-300"}`}
        >
          <option value="">
            {loadingMaterials ? "Loading.." : "Select material"}
          </option>
          {materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} - {m.quantity_in_stock} {m.unit} in stock
            </option>
          ))}
        </select>
        {errors.material_id && (
          <p className="mt-1 text-xs text-red-500">
            {errors.material_id.message}
          </p>
        )}
      </div>

      {/* Supplier */}
      <div>
        <label className="text-sm font-medium text-gray-700">Supplier</label>
        <select
          {...register("supplier_id")}
          disabled={loadingSuppliers}
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-50"
        >
          <option value="">
            {loadingSuppliers ? "Loading..." : "Select supplier"}
          </option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Quantity and Cost */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700">
            Quantity Recieved <span className="text-red-500">*</span>
            {selectedMaterial && (
              <span className="ml-1 text-gray-400 font-normal">
                ({selectedMaterial.unit})
              </span>
            )}
          </label>
          <input
            {...register("quantity_received", {
              required: "Quantity is required",
              min: { value: 0.01, message: "Must be greater than 0" },
            })}
            type="number"
            step="0.01"
            min="0.01"
            className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 ${errors.quantity_received ? "border-red-400 bg-red-50" : "border-gray-300"}`}
          />
          {errors.quantity_received && (
            <p className="mt-1 text-xs text-red-500">
              {errors.quantity_received.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Cost Per Unit (UGX) <span className="text-red-500">*</span>
          </label>
          <input
            {...register("cost_per_unit", {
              required: "Cost is required",
              min: { value: 0, message: "Cannot be negative" },
            })}
            type="number"
            step="0.1"
            min="0"
            className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${errors.cost_per_unit ? "border-red-400 bg-red-50" : "border-gray-300"}`}
          />
          {errors.cost_per_unit && (
            <p className="mt-1 text-xs text-red-500">
              {errors.cost_per_unit.message}
            </p>
          )}
        </div>
      </div>

      {/* Total cost preview */}
      {totalCost > 0 && (
        <div className="flex items-center justify-between bg-amber-50   border border-amber-200 rounded-lg px-4 py-3">
          <span className="text-sm text-amber-700 font-medium">Total Cost</span>
          <span className="text-sm font-bold text-amber-800">
            UGX {totalCost.toLocaleString()}
          </span>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="text-sm font-medium text-gray-700">Notes</label>
        <textarea
          {...register("notes")}
          rows={2}
          placeholder="Optional notes about this restock..."
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
        />
      </div>

      {/* API error */}
      {createMutation.isError && (
        <p className="text-sm text-red-500">
          {createMutation.error?.response?.data?.error ||
            "Something went wrong. Please try again."}
        </p>
      )}

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          loading={createMutation.isPending}
          disabled={createMutation.isPending}
        >
          Record Restock
        </Button>
      </div>
    </form>
  );
}
