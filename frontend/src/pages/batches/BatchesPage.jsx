// src/pages/batches/BatchesPage.jsx
import { useState } from "react";
import { useBatches } from "../../hooks/useBatches.js";
import { PageHeader } from "../../components/shared/PageHeader.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { StatCard } from "../../components/ui/StatCard.jsx";
import BatchForm from "./BatchForm.jsx";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  ClipboardList,
  PlayCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
} from "lucide-react";

const statusColor = {
  planned: "blue",
  in_progress: "amber",
  completed: "green",
  cancelled: "red",
};

const statusIcon = {
  planned: Clock,
  in_progress: PlayCircle,
  completed: CheckCircle,
  cancelled: XCircle,
};

export default function BatchesPage() {
  const { data: batches = [], isLoading } = useBatches();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  if (isLoading) return <div className="text-sm text-gray-500">Loading...</div>;

  // Summary
  const planned = batches.filter((b) => b.status === "planned");
  const inProgress = batches.filter((b) => b.status === "in_progress");
  const completed = batches.filter((b) => b.status === "completed");
  const cancelled = batches.filter((b) => b.status === "cancelled");

  // Filter
  const filtered =
    filter === "all" ? batches : batches.filter((b) => b.status === filter);

  return (
    <div>
      <PageHeader
        title="Production Batches"
        subtitle="Manage your manufacturing runs"
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} className="mr-1" /> New Batch
          </Button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Planned"
          value={planned.length}
          icon={Clock}
          color="blue"
        />
        <StatCard
          label="In Progress"
          value={inProgress.length}
          icon={PlayCircle}
          color="amber"
        />
        <StatCard
          label="Completed"
          value={completed.length}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          label="Cancelled"
          value={cancelled.length}
          icon={XCircle}
          color="red"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["all", "planned", "in_progress", "completed", "cancelled"].map(
          (s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors
              ${
                filter === s
                  ? "bg-amber-500 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </button>
          ),
        )}
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {[
                "Batch Name",
                "Status",
                "Expected Yield",
                "Actual Yield",
                "Start Date",
                "End Date",
                "Created By",
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
            {filtered.map((b) => {
              const Icon = statusIcon[b.status] || Clock;
              return (
                <tr key={b.id} className="hover:bg-gray-50">
                  {/* Name */}
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {b.batch_name}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Icon
                        size={13}
                        className={
                          b.status === "completed"
                            ? "text-green-500"
                            : b.status === "in_progress"
                              ? "text-amber-500"
                              : b.status === "cancelled"
                                ? "text-red-500"
                                : "text-blue-500"
                        }
                      />
                      <Badge color={statusColor[b.status]}>
                        {b.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </td>

                  {/* Expected yield */}
                  <td className="px-4 py-3 text-gray-600">
                    {b.expected_yield
                      ? parseFloat(b.expected_yield).toLocaleString()
                      : "—"}
                  </td>

                  {/* Actual yield */}
                  <td className="px-4 py-3">
                    {b.actual_yield ? (
                      <span className="text-green-600 font-medium">
                        {parseFloat(b.actual_yield).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* Start date */}
                  <td className="px-4 py-3 text-gray-500">
                    {b.start_date
                      ? new Date(b.start_date).toLocaleDateString()
                      : "—"}
                  </td>

                  {/* End date */}
                  <td className="px-4 py-3 text-gray-500">
                    {b.end_date
                      ? new Date(b.end_date).toLocaleDateString()
                      : "—"}
                  </td>

                  {/* Created by */}
                  <td className="px-4 py-3 text-gray-500">
                    {b.created_by_name || "—"}
                  </td>

                  {/* View detail */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/batches/${b.id}`)}
                      className="flex items-center gap-1 text-amber-500 hover:text-amber-600 transition-colors text-xs font-medium"
                    >
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-10">
            {filter === "all"
              ? "No batches yet."
              : `No ${filter.replace("_", " ")} batches.`}
          </p>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Production Batch"
      >
        <BatchForm onSuccess={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
