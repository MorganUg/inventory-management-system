import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // "danger" | "warning"
  loading = false,
}) {
  const handleConfirm = () => {
    onConfirm?.();
  };

  const confirmVariant = variant === "danger" ? "danger" : "primary";

  return (
    <Modal open={open} onClose={onClose} title={title} hideClose={false}>
      <div className="space-y-4">
        <p className="text-gray-600 text-sm leading-relaxed">{message}</p>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
