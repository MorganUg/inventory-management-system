import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { updatePassword } from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export default function ChangePasswordModal({
  open,
  onClose,
  forceChange = false,
}) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    unregister,
    formState: { errors },
  } = useForm();

  const { clearForcePasswordChange } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const newPassword = watch("newPassword");

  // Unregister currentPassword when in forced mode to avoid validation errors
  useEffect(() => {
    if (forceChange) {
      unregister("currentPassword");
      // Also clear any previous errors related to it
      reset({ currentPassword: "" }, { keepErrors: false });
    }
  }, [forceChange, unregister, reset]);

  const onSubmit = async (data) => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Build payload carefully - never send current_password in forced mode
      const payload = forceChange
        ? { new_password: data.newPassword }
        : {
            current_password: data.currentPassword || "",
            new_password: data.newPassword,
          };

      await updatePassword(payload);

      setSuccess("Password changed successfully!");

      if (forceChange) {
        clearForcePasswordChange();
      }

      setTimeout(() => {
        reset();
        onClose();
        setSuccess("");
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to change password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (forceChange) {
      // Prevent closing when forced to change password
      return;
    }
    reset();
    setError("");
    setSuccess("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={
        forceChange ? "Change Your Password (Required)" : "Change Password"
      }
      hideClose={forceChange}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
            {success}
          </div>
        )}

        {!forceChange && (
          <div>
            <label className="text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              type="password"
              {...register("currentPassword", {
                required: forceChange ? false : "Current password is required",
              })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400"
            />
            {errors.currentPassword && (
              <p className="text-xs text-red-500 mt-1">
                {errors.currentPassword.message}
              </p>
            )}
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700">
            New Password
          </label>
          <input
            type="password"
            {...register("newPassword", {
              required: "New password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
            })}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400"
          />
          {errors.newPassword && (
            <p className="text-xs text-red-500 mt-1">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Confirm New Password
          </label>
          <input
            type="password"
            {...register("confirmPassword", {
              required: "Please confirm your new password",
              validate: (value) =>
                value === newPassword || "Passwords do not match",
            })}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400"
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          {!forceChange && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" loading={loading}>
            {forceChange ? "Set New Password" : "Change Password"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
