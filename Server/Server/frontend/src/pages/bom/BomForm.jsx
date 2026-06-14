import { useForm } from "react-hook-form";
import { useCreateBom } from "../../hooks/useBom.js";
import { useFinishedGoods } from "../../hooks/useFinishedGoods.js";
import { Button } from "../../components/ui/Button.jsx";

export default function BomForm({ onSuccess }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const createMutation = useCreateBom();
  const { data: goods = [], isLoading: loadingGoods } = useFinishedGoods();

  const onSubmit = async (data) => {
    const payload = {
      finished_good_id: parseInt(data.finished_good_id),
      notes: data.notes || null,
      items: [],
    };
    try {
      await createMutation.mutateAsync(payload);
      onSuccess();
    } catch (err) {
      // error handled in parent
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Finished Good */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Product <span className="text-red-500">*</span>
        </label>
        <select
          {...register("finished_good_id", {
            required: "Please select a product",
          })}
          disabled={loadingGoods}
          className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50 ${errors.finished_good_id ? "border-red-400 bg-red-50" : "border-gray-300"}`}
        >
          <option value="">
            {loadingGoods ? "Loading..." : "Select finished good"}
          </option>
          {goods.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        {errors.finished_good_id && (
          <p className="mt-1 text-xs text-red-500">
            {errors.finished_good_id.message}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          A new version will be created automatically if a BOM already exists
          for this product.
        </p>
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm font-medium text-gray-700">Notes</label>
        <textarea
          {...register("notes")}
          rows={3}
          placeholder="e.g. Original Milk Candy recipe, Reduced sugar version..."
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
        />
      </div>

      {createMutation.isError && (
        <p className="text-sm text-red-500">
          {createMutation.error?.response?.data?.error ||
            "Something went wrong."}
        </p>
      )}

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          loading={createMutation.isPending}
          disabled={createMutation.isPending}
        >
          Create BOM
        </Button>
      </div>
    </form>
  );
}
