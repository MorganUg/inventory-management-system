import { useForm } from "react-hook-form";
import { useCreateUser, useUpdateUser } from "../../hooks/useUsers.js";
import { Button } from "../../components/ui/Button.jsx";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";

export default function UserForm({ initialData, onSuccess }) {
  const isEdit = !!initialData;
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: isEdit
      ? {
          username: initialData.username,
          email: initialData.email,
          role: initialData.role,
          is_active: initialData.is_active,
        }
      : {
          role: "staff",
          is_active: true,
        },
  });

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const [error, setError] = useState("");

  const onSubmit = async (data) => {
    setError("");

    try {
      if (isEdit) {
        // Only send fields that can be updated
        const updatePayload = {
          username: data.username,
          email: data.email,
        };

        // Only admins can change role and active status
        if (isAdmin) {
          updatePayload.role = data.role;
          updatePayload.is_active = data.is_active;
        }

        await updateMutation.mutateAsync({
          id: initialData.id,
          data: updatePayload,
        });
      } else {
        // Create mode - password is required
        await createMutation.mutateAsync({
          username: data.username,
          email: data.email,
          password: data.password,
          role: data.role,
        });
      }

      reset();
      onSuccess?.();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          (isEdit ? "Failed to update user." : "Failed to create user."),
      );
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-gray-700">Username</label>
        <input
          {...register("username", { required: "Username is required" })}
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400"
        />
        {errors.username && (
          <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Email</label>
        <input
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: "Invalid email address",
            },
          })}
          type="email"
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400"
        />
        {errors.email && (
          <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Password only for create mode */}
      {!isEdit && (
        <div>
          <label className="text-sm font-medium text-gray-700">Password</label>
          <input
            {...register("password", {
              required: "Password is required",
              minLength: { value: 6, message: "Minimum 6 characters" },
            })}
            type="password"
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">
              {errors.password.message}
            </p>
          )}
        </div>
      )}

      {/* Role - only admins can change */}
      <div>
        <label className="text-sm font-medium text-gray-700">Role</label>
        <select
          {...register("role")}
          disabled={!isAdmin}
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 disabled:bg-gray-100"
        >
          <option value="staff">Staff</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        {!isAdmin && (
          <p className="text-xs text-gray-500 mt-1">
            Only admins can change roles.
          </p>
        )}
      </div>

      {/* Active status - only admins can change */}
      {isEdit && (
        <div>
          <label className="text-sm font-medium text-gray-700">Status</label>
          <select
            {...register("is_active", { setValueAs: (v) => v === "true" })}
            disabled={!isAdmin}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 disabled:bg-gray-100"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          {!isAdmin && (
            <p className="text-xs text-gray-500 mt-1">
              Only admins can change user status.
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={isLoading}>
          {isEdit ? "Update User" : "Create User"}
        </Button>
      </div>
    </form>
  );
}
