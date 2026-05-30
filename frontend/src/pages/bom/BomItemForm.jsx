import { useForm } from "react-hook-form";
import { useAddBomItem, useUpdateBomItem } from "../../hooks/useBom.js";
import { useRawMaterials } from "../../hooks/useRawMaterials.js";
import { Button } from "../../components/ui/Button.jsx";

export default function BomItemForm({ bom, initial, onSuccess }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: initial
      ? {
          material_id: initial.material_id,
          quantity_per_unit: initial.quantity_per_unit,
          unit: initial.unit,
          notes: initial.notes || "",
        }
      : {},
  });

  const addMutation = useAddBomItem(bom.id);
  const updateMutation = useUpdateBomItem(bom.id);
  const { data: materials = [], isLoading: loadingMaterials } =
    useRawMaterials();

  const isLoading = addMutation.isPending || updateMutation.isPending;

  // Auto-fill unit from selected material
  const selectedMaterialId = parseInt(watch("material_id"));
  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);

  const onSubmit = async (data) => {
    const payload = {
      material_id: parseInt(data.material_id),
      quantity_per_unit: parseFloat(data.quantity_per_unit),
      unit: data.unit,
      notes: data.notes || null,
    };
    try {
      if (initial) {
        await updateMutation.mutateAsync({ itemId: initial.id, data: payload });
      } else {
        await addMutation.mutateAsync(payload);
      }
      onSuccess();
    } catch (err) {
      // error handled via mutation
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* BOM context */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
        <p className="text-xs text-amber-700">
          Adding ingredient to:{" "}
          <span className="font-medium">{bom.finished_good_name}</span> — v
          {bom.version}
        </p>
      </div>

      {/* Material */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Raw Material <span className="text-red-500">*</span>
        </label>
        <select
          {...register("material_id", { required: "Please select a material" })}
          disabled={loadingMaterials || !!initial}
          className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50 ${errors.material_id ? "border-red-400 bg-red-50" : "border-gray-300"}`}
        >
          <option value="">
            {loadingMaterials ? "Loading..." : "Select ingredient"}
          </option>
          {materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.unit})
            </option>
          ))}
        </select>
        {initial && (
          <p className="mt-1 text-xs text-gray-400">
            Material cannot be changed — delete and re-add instead.
          </p>
        )}
        {errors.material_id && (
          <p className="mt-1 text-xs text-red-500">
            {errors.material_id.message}
          </p>
        )}
      </div>

      {/* Quantity per unit + Unit side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700">
            Qty per unit <span className="text-red-500">*</span>
          </label>
          <input
            {...register("quantity_per_unit", {
              required: "Quantity is required",
              min: { value: 0.0001, message: "Must be greater than 0" },
            })}
            type="number"
            step="0.0001"
            min="0.0001"
            placeholder="e.g. 0.05"
            className={`mt-1 w-full border rounded-lg px-3 py-2 text-smfocus:outline-none focus:ring-2 focus:ring-amber-400 ${errors.quantity_per_unit ? "border-red-400 bg-red-50" : "border-gray-300"}`}
          />
          {errors.quantity_per_unit && (
            <p className="mt-1 text-xs text-red-500">
              {errors.quantity_per_unit.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            Amount needed per 1 finished unit
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Unit <span className="text-red-500">*</span>
          </label>
          <select
            {...register("unit", { required: "Unit is required" })}
            className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${errors.unit ? "border-red-400 bg-red-50" : "border-gray-300"}`}
          >
            <option value="">Select unit</option>
            {["kg", "grams", "litres", "ml", "pieces", "bags"].map((u) => (
              <option key={u} value={u} selected={selectedMaterial?.unit === u}>
                {u}
              </option>
            ))}
          </select>
          {errors.unit && (
            <p className="mt-1 text-xs text-red-500">{errors.unit.message}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm font-medium text-gray-700">Notes</label>
        <input
          {...register("notes")}
          type="text"
          placeholder="e.g. sift before use, add last..."
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      {(addMutation.isError || updateMutation.isError) && (
        <p className="text-sm text-red-500">
          {addMutation.error?.response?.data?.error ||
            updateMutation.error?.response?.data?.error ||
            "Something went wrong."}
        </p>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={isLoading} disabled={isLoading}>
          {initial ? "Update Ingredient" : "Add Ingredient"}
        </Button>
      </div>
    </form>
  );
}
