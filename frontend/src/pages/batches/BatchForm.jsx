import { useForm, useFieldArray } from "react-hook-form";
import { useCreateBatch } from "../../hooks/useBatches.js";
import { useFinishedGoods } from "../../hooks/useFinishedGoods.js";
import { useBomByFinishedGood } from "../../hooks/useBom.js";
import { Button } from "../../components/ui/Button.jsx";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export default function BatchForm({ onSuccess }) {
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      outputs: [{ finished_good_id: "", expected_quantity: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "outputs",
  });
  const createMutation = useCreateBatch();
  const { data: goods = [] } = useFinishedGoods();

  // Watch first output's finished good to load BOM preview
  const firstGoodId = parseInt(watch("outputs.0.finished_good_id"));
  const { data: bom } = useBomByFinishedGood(firstGoodId || null);

  const onSubmit = async (data) => {
    const payload = {
      batch_name: data.batch_name,
      expected_yield: data.expected_yield
        ? parseFloat(data.expected_yield)
        : null,
      start_date: data.start_date || null,
      notes: data.notes || null,
      outputs: data.outputs
        .filter((o) => o.finished_good_id)
        .map((o) => ({
          finished_good_id: parseInt(o.finished_good_id),
          expected_quantity: parseFloat(o.expected_quantity) || 0,
        })),
    };
    try {
      await createMutation.mutateAsync(payload);
      onSuccess();
    } catch (err) {
      // error handled in UI via form state
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Batch name */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Batch Name <span className="text-red-500">*</span>
        </label>
        <input
          {...register("batch_name", { required: "Batch name is required" })}
          type="text"
          placeholder="e.g. Milk Candy — May Run"
          className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400
          ${errors.batch_name ? "border-red-400 bg-red-50" : "border-gray-300"}`}
        />
        {errors.batch_name && (
          <p className="mt-1 text-xs text-red-500">
            {errors.batch_name.message}
          </p>
        )}
      </div>

      {/* Expected yield + Start date */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700">
            Expected Yield
          </label>
          <input
            {...register("expected_yield", {
              min: { value: 1, message: "Must be at least 1" },
            })}
            type="number"
            min="1"
            placeholder="Total units expected"
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            {...register("start_date")}
            type="date"
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* Outputs — which finished goods this batch produces */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Products to produce <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() =>
              append({ finished_good_id: "", expected_quantity: "" })
            }
            className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <Plus size={13} /> Add product
          </button>
        </div>

        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <select
                {...register(`outputs.${index}.finished_good_id`)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">Select product</option>
                {goods.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <input
                {...register(`outputs.${index}.expected_quantity`)}
                type="number"
                min="1"
                placeholder="Qty"
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* BOM preview for first product */}
      {bom && bom.items && bom.items.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-amber-700 mb-2">
            Active BOM — {bom.finished_good_name} (v{bom.version})
          </p>
          <div className="space-y-1">
            {bom.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between text-xs text-amber-800"
              >
                <span>{item.material_name}</span>
                <span>
                  {item.quantity_per_unit} {item.unit} per unit
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="text-sm font-medium text-gray-700">Notes</label>
        <textarea
          {...register("notes")}
          rows={2}
          placeholder="Optional production notes..."
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
          Create Batch
        </Button>
      </div>
    </form>
  );
}
