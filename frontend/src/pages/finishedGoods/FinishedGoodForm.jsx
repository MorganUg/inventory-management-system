// src/pages/finishedGoods/FinishedGoodForm.jsx
import { useForm } from "react-hook-form";
import {
  useCreateFinishedGood,
  useUpdateFinishedGood,
} from "../../hooks/useFinishedGoods.js";
import { useCategories } from "../../hooks/useCategories.js";
import { Button } from "../../components/ui/Button.jsx";

export default function FinishedGoodForm({ initial, onSuccess }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: initial
      ? {
          name: initial.name,
          unit: initial.unit,
          price_per_unit: initial.price_per_unit || 0,
          expiry_duration_days: initial.expiry_duration_days || "",
          category_id: initial.category_id?.id ?? initial.category_id ?? "",
        }
      : {
          unit: "pieces",
          price_per_unit: 0,
        },
  });

  const createMutation = useCreateFinishedGood();
  const updateMutation = useUpdateFinishedGood();
  const { data: categories = [], isLoading: loadingCategories } =
    useCategories("finished_good");

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      price_per_unit: parseFloat(data.price_per_unit) || 0,
      expiry_duration_days: data.expiry_duration_days
        ? parseInt(data.expiry_duration_days)
        : null,
      category_id: data.category_id ? parseInt(data.category_id) : null,
    };

    try {
      if (initial) {
        await updateMutation.mutateAsync({ id: initial.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSuccess();
    } catch (err) {
      // error displayed in UI
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          {...register("name", { required: "Product name is required" })}
          type="text"
          placeholder="e.g. Milk Candy"
          className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${errors.name ? "border-red-400 bg-red-50" : "border-gray-300"}`}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Unit */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Unit <span className="text-red-500">*</span>
        </label>
        <select
          {...register("unit", { required: "Unit is required" })}
          className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${errors.unit ? "border-red-400 bg-red-50" : "border-gray-300"}`}
        >
          <option value="">Select unit</option>
          {["pieces", "boxes", "bags", "kg", "grams"].map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        {errors.unit && (
          <p className="mt-1 text-xs text-red-500">{errors.unit.message}</p>
        )}
      </div>

      {/* Price + Expiry side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700">
            Price Per Unit (UGX)
          </label>
          <input
            {...register("price_per_unit", {
              min: { value: 0, message: "Cannot be negative" },
            })}
            type="number"
            step="0.01"
            min="0"
            placeholder="0"
            className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${errors.price_per_unit ? "border-red-400 bg-red-50" : "border-gray-300"}`}
          />
          {errors.price_per_unit && (
            <p className="mt-1 text-xs text-red-500">
              {errors.price_per_unit.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Shelf Life (days)
          </label>
          <input
            {...register("expiry_duration_days", {
              min: { value: 1, message: "Must be at least 1 day" },
            })}
            type="number"
            min="1"
            placeholder="e.g. 90"
            className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${errors.expiry_duration_days ? "border-red-400 bg-red-50" : "border-gray-300"}`}
          />
          {errors.expiry_duration_days && (
            <p className="mt-1 text-xs text-red-500">
              {errors.expiry_duration_days.message}
            </p>
          )}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="text-sm font-medium text-gray-700">Category</label>
        <select
          {...register("category_id")}
          disabled={loadingCategories}
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
        >
          <option value="">
            {loadingCategories ? "Loading..." : "Select category (optional)"}
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* API error */}
      {(createMutation.isError || updateMutation.isError) && (
        <p className="text-sm text-red-500">
          {createMutation.error?.response?.data?.error ||
            updateMutation.error?.response?.data?.error ||
            "Something went wrong. Please try again."}
        </p>
      )}

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <Button type="submit" loading={isLoading} disabled={isLoading}>
          {initial ? "Update Product" : "Add Product"}
        </Button>
      </div>
    </form>
  );
}
