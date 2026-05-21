// src/pages/categories/CategoryForm.jsx
import { useForm } from 'react-hook-form';
import { useCreateCategory, useUpdateCategory } from '../../hooks/useCategories.js';
import { Button } from '../../components/ui/Button.jsx';

export default function CategoryForm({ initial, onSuccess }) {
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: initial
            ? {
                name:        initial.name,
                type:        initial.type,
                description: initial.description || '',
              }
            : {
                type: 'raw_material',
              }
    });

    const createMutation = useCreateCategory();
    const updateMutation = useUpdateCategory();
    const isLoading = createMutation.isPending || updateMutation.isPending;

    const onSubmit = async (data) => {
        try {
            if (initial) {
                await updateMutation.mutateAsync({ id: initial.id, data });
            } else {
                await createMutation.mutateAsync(data);
            }
            onSuccess();
        } catch (err) {
            console.error('Failed to save category:', err);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Name */}
            <div>
                <label className="text-sm font-medium text-gray-700">
                    Name <span className="text-red-500">*</span>
                </label>
                <input
                    {...register('name', { required: 'Name is required' })}
                    type="text"
                    placeholder="e.g. Sweeteners"
                    className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm
                        focus:outline-none focus:ring-2 focus:ring-amber-400
                        ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                )}
            </div>

            {/* Type */}
            <div>
                <label className="text-sm font-medium text-gray-700">
                    Type <span className="text-red-500">*</span>
                </label>
                <select
                    {...register('type', { required: 'Type is required' })}
                    // Lock type when editing — changing it would break existing links
                    disabled={!!initial}
                    className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm
                        focus:outline-none focus:ring-2 focus:ring-amber-400
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${errors.type ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                >
                    <option value="raw_material">Raw Material</option>
                    <option value="finished_good">Finished Good</option>
                </select>
                {initial && (
                    <p className="mt-1 text-xs text-gray-400">
                        Type cannot be changed after creation.
                    </p>
                )}
                {errors.type && (
                    <p className="mt-1 text-xs text-red-500">{errors.type.message}</p>
                )}
            </div>

            {/* Description */}
            <div>
                <label className="text-sm font-medium text-gray-700">
                    Description
                </label>
                <textarea
                    {...register('description')}
                    rows={3}
                    placeholder="Optional description..."
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                        focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
            </div>

            {/* API error */}
            {(createMutation.isError || updateMutation.isError) && (
                <p className="text-sm text-red-500">
                    {createMutation.error?.response?.data?.error ||
                     updateMutation.error?.response?.data?.error ||
                     'Something went wrong. Please try again.'}
                </p>
            )}

            {/* Submit */}
            <div className="flex justify-end pt-2">
                <Button type="submit" loading={isLoading} disabled={isLoading}>
                    {initial ? 'Update Category' : 'Add Category'}
                </Button>
            </div>

        </form>
    );
}