import { useForm } from "react-hook-form";
import { useCreateSupplier, useUpdateSupplier } from "../../hooks/useSuppliers";
import { Button } from "../../components/ui/Button";

export default function SupplierForm({ initial, onSuccess }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: initial
      ? {
          name: initial.name,
          contact_name: initial.contact_name || "",
          phone: initial.phone || "",
          email: initial.email || "",
          address: initial.address || "",
          is_active: initial.is_active,
        }
      : {
          is_active: true,
        },
  });

  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      is_active: data.is_active === "true" || data.is_active === true,
    };

    try {
      if (initial) {
        await updateMutation.mutateAsync({ id: initial.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSuccess();
    } catch (err) {
      // error shown in UI
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Supplier Name <span className="text-red-500">*</span>
        </label>
        <input
          {...register("name", { required: "Supplier name is required" })}
          type="text"
          placeholder="e.g. Uganda Sugar Factory"
          className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300
          ${errors.name ? "border-red-400 bg-red-50" : "border-gray-300"}`}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Contact Name */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Contact Name
        </label>
        <input
          {...register("contact_name")}
          type="text"
          placeholder="e.g. John Mukasa"
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
        />
      </div>

      {/* Phone and email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Phone</label>
          <input
            {...register("phone")}
            type="tel"
            placeholder="e.g. 0700123456"
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input
            {...register("email", {
              pattern: {
                value: /^\S+@\S+\.\S+$/,
                message: "Enter a valid email",
              },
            })}
            type="email"
            placeholder="e.g. sales@supplier.com"
            className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300
            ${errors.email ? "border-red-500 bg-red-50" : "border-gray-300"}`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="text-sm font-medium text-gray-700">Address</label>
        <textarea
          {...register("address")}
          rows={2}
          placeholder="e.g. Lugazi, Buikwe Districk"
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
        />
      </div>

      {/* show Active toggle only when editing */}
      {initial && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <input
            {...register("is_active")}
            type="checkbox"
            id="is_active"
            className="w-4 h-4 accent-amber-500"
          />
          <label htmlFor="is_active" className="text-sm text-gray-700">
            Supplier is active
          </label>
        </div>
      )}

      {/* API error */}
      {(createMutation.isError || updateMutation.isError) && (
        <p>
          {createMutation.error?.response?.data?.error ||
            updateMutation.error?.response?.data?.error ||
            "Something went wrong. Please try again."}
        </p>
      )}

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <Button type="submit" loading={isLoading} disabled={isLoading}>
          {initial ? "Update Supplier" : "Add Supplier"}
        </Button>
      </div>
    </form>
  );
}
