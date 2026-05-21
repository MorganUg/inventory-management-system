import { useState } from "react";
import { useForm } from "react-hook-form";
import { useFinishedGoods } from "../../hooks/useFinishedGoods.js";
import { useCustomers } from "../../hooks/useCustomers.js";

function DispatchForm({ onSuccess }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const createMutation = useCreateDispatch();

  const { data: goods = [], isLoading: loadingGoods } = useFinishedGoods();
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers();

  // Live stock check for selected product
  const selectedGoodId = parseInt(watch("finished_good_id"));
  const selectedGood = goods.find((g) => g.id === selectedGoodId);
  const requestedQty = parseFloat(watch("quantity_dispatched")) || 0;
  const insufficientStock =
    selectedGood && requestedQty > parseFloat(selectedGood.quantity_in_stock);

  const onSubmit = async (data) => {
    const payload = {
      finished_good_id: parseInt(data.finished_good_id),
      customer_id: parseInt(data.customer_id),
      quantity_dispatched: parseFloat(data.quantity_dispatched),
      notes: data.notes || null,
    };
    try {
      await createMutation.mutateAsync(payload);
      onSuccess();
    } catch (err) {
      console.error("Failed to create dispatch:", err);
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
            {loadingGoods ? "Loading..." : "Select product"}
          </option>
          {goods.map((g) => (
            <option
              key={g.id}
              value={g.id}
              disabled={parseFloat(g.quantity_in_stock) <= 0}
            >
              {g.name} — {parseFloat(g.quantity_in_stock).toLocaleString()}{" "}
              {g.unit} available
            </option>
          ))}
        </select>
        {errors.finished_good_id && (
          <p className="mt-1 text-xs text-red-500">
            {errors.finished_good_id.message}
          </p>
        )}
      </div>

      {/* Stock availability indicator */}
      {selectedGood && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm
            ${
              parseFloat(selectedGood.quantity_in_stock) > 0
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
        >
          <Package size={14} />
          <span>
            Available stock:
            <strong className="ml-1">
              {parseFloat(selectedGood.quantity_in_stock).toLocaleString()}{" "}
              {selectedGood.unit}
            </strong>
          </span>
        </div>
      )}

      {/* Customer */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Customer <span className="text-red-500">*</span>
        </label>
        <select
          {...register("customer_id", { required: "Please select a customer" })}
          disabled={loadingCustomers}
          className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50 ${errors.customer_id ? "border-red-400 bg-red-50" : "border-gray-300"}`}
        >
          <option value="">
            {loadingCustomers ? "Loading..." : "Select customer"}
          </option>
          {customers
            .filter((c) => c.is_active)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
        {errors.customer_id && (
          <p className="mt-1 text-xs text-red-500">
            {errors.customer_id.message}
          </p>
        )}
      </div>

      {/* Quantity */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Quantity to Dispatch <span className="text-red-500">*</span>
        </label>
        <input
          {...register("quantity_dispatched", {
            required: "Quantity is required",
            min: { value: 1, message: "Must be at least 1" },
            validate: (value) =>
              !selectedGood ||
              parseFloat(value) <= parseFloat(selectedGood.quantity_in_stock) ||
              "Exceeds available stock",
          })}
          type="number"
          step="0.01"
          min="1"
          placeholder="0"
          className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${errors.quantity_dispatched ? "border-red-400 bg-red-50" : "border-gray-300"}`}
        />
        {errors.quantity_dispatched && (
          <p className="mt-1 text-xs text-red-500">
            {errors.quantity_dispatched.message}
          </p>
        )}
      </div>

      {/* Insufficient stock warning */}
      {insufficientStock && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={16} />
          <span>
            Requested quantity exceeds available stock of{" "}
            <strong>
              {parseFloat(selectedGood.quantity_in_stock).toLocaleString()}{" "}
              {selectedGood.unit}
            </strong>
          </span>
        </div>
      )}

      {/* Dispatch value preview */}
      {selectedGood && requestedQty > 0 && !insufficientStock && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <span className="text-sm text-amber-700 font-medium">
            Dispatch Value
          </span>
          <span className="text-sm font-bold text-amber-800">
            UGX{" "}
            {(
              requestedQty * parseFloat(selectedGood.price_per_unit || 0)
            ).toLocaleString()}
          </span>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="text-sm font-medium text-gray-700">Notes</label>
        <textarea
          {...register("notes")}
          rows={2}
          placeholder="Optional delivery notes..."
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
        />
      </div>

      {createMutation.isError && (
        <p className="text-sm text-red-500">
          {createMutation.error?.response?.data?.error ||
            "Something went wrong. Please try again."}
        </p>
      )}

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          loading={createMutation.isPending}
          disabled={createMutation.isPending || insufficientStock}
        >
          Confirm Dispatch
        </Button>
      </div>
    </form>
  );
}
