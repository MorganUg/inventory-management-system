import { useState } from 'react';
import { useCategories, useDeleteCategory } from '../../hooks/useCategories.js';
import { PageHeader } from '../../components/shared/PageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import CategoryForm from './CategoryForm.jsx';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';


export default function CategoriesPage() {
    const { data: categories = [], isLoading } = useCategories();
    const deleteMutation = useDeleteCategory();

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing]     = useState(null);
    const [deleteError, setDeleteError] = useState('');

    const handleEdit  = (cat) => { setEditing(cat); setModalOpen(true); };
    const handleClose = () => { setEditing(null); setModalOpen(false); };

    const handleDelete = async (id) => {
        setDeleteError('');
        try {
            await deleteMutation.mutateAsync(id);
        } catch (err) {
            setDeleteError(
                err.response?.data?.error || 'Failed to delete category.'
            );
        }
    };

    // Split into two groups for display
    const rawMaterialCats = categories.filter(c => c.type === 'raw_material');
    const finishedGoodCats = categories.filter(c => c.type === 'finished_good');

    if (isLoading) return <div className="text-sm text-gray-500">Loading...</div>;

    return (
        <div>
            <PageHeader
                title="Categories Management"
                subtitle="Organise raw materials and finished goods"
                action={
                    <Button onClick={() => setModalOpen(true)}>
                        <Plus size={16} className="mr-1" /> Add Category
                    </Button>
                }
            />

            {/* Delete error */}
            {deleteError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                    {deleteError}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Raw Material Categories */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-4 border-b bg-amber-50">
                        <Tag size={16} className="text-amber-600" />
                        <h2 className="font-semibold text-amber-800">Raw Material Categories</h2>
                        <span className="ml-auto text-xs text-amber-600 font-medium">
                            {rawMaterialCats.length} total
                        </span>
                    </div>

                    {rawMaterialCats.length === 0
                        ? <p className="text-sm text-gray-400 text-center py-10">No categories yet.</p>
                        : <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    {['Name', 'Description', 'Actions'].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {rawMaterialCats.map(cat => (
                                    <tr key={cat.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{cat.name}</td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {cat.description || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(cat)}
                                                    className="text-gray-400 hover:text-amber-500 transition-colors"
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cat.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    }
                </div>

                {/* Finished Good Categories */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-4 border-b bg-green-50">
                        <Tag size={16} className="text-green-600" />
                        <h2 className="font-semibold text-green-800">Finished Good Categories</h2>
                        <span className="ml-auto text-xs text-green-600 font-medium">
                            {finishedGoodCats.length} total
                        </span>
                    </div>

                    {finishedGoodCats.length === 0
                        ? <p className="text-sm text-gray-400 text-center py-10">No categories yet.</p>
                        : <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    {['Name', 'Description', 'Actions'].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {finishedGoodCats.map(cat => (
                                    <tr key={cat.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{cat.name}</td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {cat.description || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(cat)}
                                                    className="text-gray-400 hover:text-amber-500 transition-colors"
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cat.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    }
                </div>

            </div>

            <Modal
                open={modalOpen}
                onClose={handleClose}
                title={editing ? 'Edit Category' : 'Add Category'}
            >
                <CategoryForm initial={editing} onSuccess={handleClose} />
            </Modal>
        </div>
    );
}