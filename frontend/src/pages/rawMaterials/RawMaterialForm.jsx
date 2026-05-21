import { useForm } from 'react-hook-form';
import { useCreateRawMaterial, useUpdateRawMaterial } from '../../hooks/useRawMaterials.js';
import { useCategories } from '../../hooks/useCategories.js';
import { useSuppliers } from '../../hooks/useSuppliers.js';
import { Button } from '../../components/ui/Button.jsx';

export default function RawMaterialForm({ initial, onSuccess }) {

  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: initial 
    ? {
        name: initial.name,
        unit: initial.unit,
        quantity_in_stock: initial.quantity_in_stock,
        reorder_level: initial.reorder_level,
        cost_per_unit: initial.cost_per_unit,
        category_id: initial.category_id?.id ?? initial.category_id ?? '',
        supplier_id: initial.supplier_id?.id ?? initial.supplier_id ?? '',
      }
    : {
        unit: 'kg',
        quantity_in_stock: 0,
        reorder_level: 0,
        cost_per_unit: 0,
        category_id: '',
        supplier_id: '',
      }
});

  const createMutation = useCreateRawMaterial();
  const updateMutation = useUpdateRawMaterial();

  const { data: categories = [], isLoading: loadingCategories } = useCategories('raw_material');
  const { data: suppliers = [], isLoading: loadingSuppliers } = useSuppliers();

  const isLoading = createMutation.isPending || updateMutation.isPending || loadingCategories || loadingSuppliers;

  const onSubmit = async (data) => {
    // convert category and supplier to their respective IDs
    const payload = {
      ...data,
      quantity_in_stock: parseFloat(data.quantity_in_stock),
      reorder_level: parseFloat(data.reorder_level),
      cost_per_unit: parseFloat(data.cost_per_unit),
      category_id: data.category_id ? parseInt(data.category_id) : null,
      supplier_id: data.supplier_id ? parseInt(data.supplier_id) : null,
    };

    try {
      if (initial) {
          await updateMutation.mutateAsync({ id: initial.id, data: payload });
      } else {
          await createMutation.mutateAsync(payload);
        }
        onSuccess();
      } catch (err) {
        console.error('Error saving raw material:', err);
      }
    };

  // {const field = (label, name, type = 'text', required = true) => (
  //   <div>
  //     <label className="text-sm font-medium text-gray-700">{label}</label>
  //       <input 
  //         {...register(name, { required })}
  //         type={type}
  //         placeholder={`Enter ${label}`}
  //         className="mt-1 w-full border border-ray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
  //       />
  //   </div>
  // );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
      <div>
        <label className="text-sm font-medium text-gray-700">
          Name <span className="text-red-500">*</span>
        </label>
        <input 
          {...register('name', { required: 'Name is required' })}
          type="text"
          placeholder="e.g. White Sugar"
          className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300
          ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'} `}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">
          Unit <span className="text-red-500">*</span>
        </label>
        <select
          {...register('unit', { required: 'Unit is required' })}
          className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300
          ${errors.unit ? 'border-red-400 bg-red-50' : 'border-gray-300'} `}
        >
          <option value="">Select unit</option>
          {['kg', 'grams', 'litres', 'ml', 'pieces', 'bags'].map(unit => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
        {errors.unit && (
          <p className="mt-1 text-xs text-red-500">{errors.unit.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label>
            Quantity In Stock <span className="text-red-500">*</span>
          </label>
          <input 
            {...register('quantity_in_stock', {
              required: 'Quantity is required',
              min: { value: 0, message: 'Quantity cannot be negative' }
            })}
            type="number"
            step="1"
            min="0"
            disabled={!!initial}
            className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300
            disabled:opacity-50 disabed:cursor-not-allowed
            ${errors.quantity_in_stock ? 'border-red-400 bg-red-50' : 'border-gray-300'} `}
          />
          {errors.quantity_in_stock && (
            <p className="mt-1 text-xs text-red-500">{errors.quantity_in_stock.message}</p>
          )}
        </div>
        <div>
          <label>
            Reorder Level <span className="text-red-500">*</span>
          </label>
          <input 
            {...register('reorder_level', {
              required: 'Reorder level is required',
              min: { value: 0, message: 'Reorder level cannot be negative' }
            })}
            type="number"
            step="1"
            min="0"
            className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300
            ${errors.reorder_level ? 'border-red-400 bg-red-50' : 'border-gray-300'} `}
          />
          {errors.reorder_level && (
            <p className="mt-1 text-xs text-red-500">{errors.reorder_level.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">
          Cost Per Unit  <span className="text-red-500">*</span>
        </label>
        <input 
          {...register('cost_per_unit', { 
            required: 'Cost is required',
            min: { value: 0, message: 'Cost cannot be negative' }
           })}
          type="number"
          step="50"
          min="0"
          placeholder="e.g. 1000"
          className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300
          ${errors.cost_per_unit ? 'border-red-400 bg-red-50' : 'border-gray-300'} `}
        />
        {errors.cost_per_unit && (
          <p className="mt-1 text-xs text-red-500">{errors.cost_per_unit.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          {...register('category_id')}
          disabled={loadingCategories}
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
        >
          <option>
            {loadingCategories ? 'Loading...' : 'Select category (optional)'}
          </option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
          <option className="text-sm" disabled>
            Can't find category? Add a new in category management.
          </option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">
          Supplier <span className="text-red-500">*</span>
        </label>
        <select
          {...register('supplier_id')}
          disabled={loadingSuppliers}
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
        >
          <option>
            {loadingCategories ? 'Loading...' : 'Select supplier (optional)'}
          </option>
          {suppliers.map(sup => (
            <option key={sup.id} value={sup.id}>{sup.name}</option>
          ))}
          <option className="text-sm" disabled>
            Can't find supplier? Add a new in supplier management.
          </option>
        </select>
      </div>

      {/* Error from API */}
      {(createMutation.isError || updateMutation.isError) && (
        <p className="text-sm text-red-500">
          {createMutation.error?.response?.data?.error ||
           updateMutation.error?.response?.data?.error ||
           'Something went wrong. Please try again.'
          }
        </p>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="submit"
          loading={isLoading}
          disabled={isLoading}
        >
          {initial ? 'Update Material' : 'Add Material'}
        </Button>
      </div>
    </form>
  );
}