import { useState } from 'react';
import { useRawMaterials, useDeleteRawMaterial } from '../../hooks/useRawMaterials.js';
import {PageHeader} from '../../components/shared/PageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';

import { Pencil, Plus, Trash, Trash2 } from 'lucide-react';

export default function RawMaterialsPage() {

  const { data: materials = [], isLoading } = useRawMaterials();
  const deleteMutation = useDeleteRawMaterial();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const handleEdit = (material) => { setEditing(material); setModalOpen(true); };
  const handleclose = () => { setEditing(null); setModalOpen(false); };

  if (isLoading) return <div className="text-sm text-gray-500">Loading...</div>;

  return (
    <div>
      <PageHeader 
        title="Raw Materials"
        subtitle="Manage your ingredients and packaging"
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} className="mr-1" /> Add Raw Material
          </Button>
        }
      />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Name', 'Unit', 'In Stock', 'Reorder Level', 'Supplier', ''].map(header =>(
                <th key={header} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {materials.map(material => (
              <tr key={material.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{material.name}</td>
                <td className="px-4 py-3 text-gray-500">{material.unit}</td>
                <td className="px-4 py-3">{material.quantity_in_stock}</td>
                <td className="px-4 py-3 text-gray-500">{material.reorder_level}</td>
                <td className="px-4 py-3 text-gray-500">{material.supplier}</td>
                <td className="px-4 py-3">
                  <Badge color={material.quantity_in_stock <= material.reorder_level ? 'red' : 'green'}>
                    {material.quantity_in_stock <= material.reorder_level ? 'Low Stock' : 'Sufficient Stock'  }
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEdit(material)} className="text-gray-400 hover:text-amber-500"
                    >
                      <Pencil size={15} />
                    </button>
                    <button 
                      onClick={() => deleteMutation.mutate(material.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {materials.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-10">No raw materials found.</p>
        )}
      </div>

      {/* <Model open={modalOpen} onClose={handleclose} title={editing ? 'Edit Raw Material' : 'Add Raw Material'}>
        <RawMaterialForm
          initial={editing}
          onSuccess={handleclose}
        />
      </Model> */}
    </div>
  );
};