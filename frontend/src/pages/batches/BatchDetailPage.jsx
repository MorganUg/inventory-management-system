import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useBatch,
  useUpdateBatchStatus,
  useCompleteBatch,
} from "../../hooks/useBatches.js";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import ConfirmDialog from "../../components/shared/ConfirmDialog.jsx";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  PlayCircle,
  CheckCircle,
  XCircle,
  FlaskConical,
  Package,
} from "lucide-react";

const statusColor = {
  planned: "blue",
  in_progress: "amber",
  completed: "green",
  cancelled: "red",
};

function CompleteBatchForm({ batch, onSuccess }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      outputs:
        batch.outputs?.map((o) => ({
          finished_good_id: o.finished_good_id,
          actual_quantity: o.expected_quantity || "",
        })) || [],
    },
  });

  const completeMutation = useCompleteBatch();

  const onSubmit = async (data) => {
    const outputs = data.outputs.map((o) => ({
      finished_good_id: parseInt(o.finished_good_id),
      actual_quantity: parseFloat(o.actual_quantity),
    }));
    try {
      await completeMutation.mutateAsync({ id: batch.id, outputs });
      onSuccess();
    } catch (err) {
      // error already surfaced via mutation state
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm text-gray-600">
        Enter the actual quantities produced for each product. This will deduct
        raw materials and update finished goods stock.
      </p>

      {batch.materials?.length === 0 && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700">
          No raw material allocations were found for this batch. Make sure the
          produced product has an active BOM before completing.
        </div>
      )}

      <div className="space-y-3">
        {batch.outputs?.map((output, index) => (
          <div
            key={output.finished_good_id}
            className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium">{output.finished_good_name}</p>
              <p className="text-xs text-gray-400">
                Expected: {output.expected_quantity || "—"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Actual qty</label>
              <input
                {...register(`outputs.${index}.actual_quantity`, {
                  required: "Required",
                  min: { value: 0, message: "Cannot be negative" },
                })}
                type="number"
                step="0.01"
                min="0"
                className={`w-24 border rounded-lg px-2 py-1.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-amber-400
                ${
                  errors.outputs?.[index]?.actual_quantity
                    ? "border-red-400"
                    : "border-gray-300"
                }`}
              />
              <input
                type="hidden"
                {...register(`outputs.${index}.finished_good_id`)}
                value={output.finished_good_id}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Materials that will be deducted */}
      {batch.materials && batch.materials.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-red-700 mb-2">
            Raw materials that will be deducted:
          </p>
          <div className="space-y-1">
            {batch.materials.map((m) => (
              <div
                key={m.id}
                className="flex justify-between text-xs text-red-800"
              >
                <span>{m.material_name}</span>
                <span>
                  −{m.quantity_used} {m.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {completeMutation.isError && (
        <p className="text-sm text-red-500">
          {completeMutation.error?.response?.data?.error ||
            "Something went wrong."}
        </p>
      )}

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          loading={completeMutation.isPending}
          disabled={completeMutation.isPending}
        >
          Confirm Completion
        </Button>
      </div>
    </form>
  );
}

// Main Page Component
export default function BatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: batch, isLoading } = useBatch(id);
  const statusMutation = useUpdateBatchStatus();

  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const handleStatusChange = async (status) => {
    setError("");
    try {
      await statusMutation.mutateAsync({ id, status });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update status.");
    }
  };

  const confirmCancelBatch = async () => {
    setConfirmCancel(false);
    setError("");
    try {
      await statusMutation.mutateAsync({ id, status: "cancelled" });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update status.");
    }
  };

  if (isLoading) return <div className="text-sm text-gray-500">Loading...</div>;
  if (!batch)
    return <div className="text-sm text-gray-500">Batch not found.</div>;

  const isCompleted = batch.status === "completed";
  const isCancelled = batch.status === "cancelled";
  const isPlanned = batch.status === "planned";
  const isInProgress = batch.status === "in_progress";

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => navigate("/batches")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors"
      >
        <ArrowLeft size={16} /> Back to batches
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {batch.batch_name}
            </h1>
            <Badge color={statusColor[batch.status]}>
              {batch.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Created by {batch.created_by_name || "—"}
            {batch.start_date &&
              ` · Started ${new Date(batch.start_date).toLocaleDateString()}`}
            {batch.end_date &&
              ` · Ended ${new Date(batch.end_date).toLocaleDateString()}`}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {isPlanned && (
            <Button
              variant="secondary"
              onClick={() => handleStatusChange("in_progress")}
              loading={statusMutation.isPending}
            >
              <PlayCircle size={15} className="mr-1" /> Start production
            </Button>
          )}
          {isInProgress && (
            <>
              <Button
                variant="secondary"
                onClick={() => setConfirmCancel(true)}
              >
                <XCircle size={15} className="mr-1" /> Cancel
              </Button>
              <Button onClick={() => setCompleteModalOpen(true)}>
                <CheckCircle size={15} className="mr-1" /> Complete batch
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Yield summary for completed batches */}
      {isCompleted && (
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm text-green-700">Expected yield</p>
            <p className="text-2xl font-bold text-green-800 mt-1">
              {batch.expected_yield
                ? parseFloat(batch.expected_yield).toLocaleString()
                : "—"}
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-700">Actual yield</p>
            <p className="text-2xl font-bold text-amber-800 mt-1">
              {batch.actual_yield
                ? parseFloat(batch.actual_yield).toLocaleString()
                : "—"}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Raw materials used */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b bg-gray-50">
            <FlaskConical size={16} className="text-purple-500" />
            <h2 className="font-semibold text-gray-800">Raw Materials</h2>
            <span className="ml-auto text-xs text-gray-400">
              {batch.materials?.length || 0} ingredients
            </span>
          </div>
          {batch.materials && batch.materials.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["Material", "Qty used", "Unit"].map((h) => (
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
                {batch.materials.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium">{m.material_name}</td>
                    <td className="px-5 py-3 text-red-500 font-medium">
                      −{m.quantity_used}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{m.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">
              No materials assigned yet. This batch has no active BOM materials
              assigned for the selected product(s).
            </p>
          )}
        </div>

        {/* Batch outputs */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b bg-gray-50">
            <Package size={16} className="text-green-500" />
            <h2 className="font-semibold text-gray-800">Products Produced</h2>
            <span className="ml-auto text-xs text-gray-400">
              {batch.outputs?.length || 0} products
            </span>
          </div>
          {batch.outputs && batch.outputs.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["Product", "Expected", "Actual", "Expiry"].map((h) => (
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
                {batch.outputs.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium">
                      {o.finished_good_name}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {o.expected_quantity || "—"}
                    </td>
                    <td className="px-5 py-3">
                      {o.actual_quantity ? (
                        <span className="text-green-600 font-medium">
                          {o.actual_quantity}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {o.expiry_date
                        ? new Date(o.expiry_date).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">
              No outputs defined yet.
            </p>
          )}
        </div>
      </div>

      {/* Notes */}
      {batch.notes && (
        <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
          <p className="text-sm text-gray-500">{batch.notes}</p>
        </div>
      )}

      {/* Complete batch modal */}
      <Modal
        open={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title="Complete Production Batch"
      >
        <CompleteBatchForm
          batch={batch}
          onSuccess={() => {
            setCompleteModalOpen(false);
            navigate("/batches");
          }}
        />
      </Modal>

      {/* Cancel Confirmation */}
      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={confirmCancelBatch}
        title="Cancel Batch"
        message="Are you sure you want to cancel this production batch? This action cannot be undone."
        confirmText="Cancel Batch"
        variant="danger"
        loading={statusMutation.isPending}
      />
    </div>
  );
}
