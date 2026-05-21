import { useRawMaterials } from '../hooks/useRawMaterials.js';
import { useBatches } from '../hooks/useBatches.js';
import { useQuery } from '@tanstack/react-query';
import { getFinishedGoods } from '../api/finishedGoods.api.js';
import { StatCard } from '../components/ui/StatCard.jsx';
import { AlertTriangle, ClipboardList, FlaskConical, Package } from 'lucide-react';
import { Badge } from '../components/ui/Badge.jsx';

export default function DashboardPage() {

  const { data: materials = [] } = useRawMaterials();
  const { data: batches = [] } = useBatches();;
  const { data: goods = [] } = useQuery({
    queryKey: ['finishedGoods'],
    queryFn: () => getFinishedGoods().then(res => res.data),
  });

  const lowStock = materials.filter(m => m.quantity_in_stock <= m.reorder_level);
  const activeBatches = batches.filter(b => b.status === 'in_progress');

  const statusColors = {
    planned: 'blue',
    in_progress: 'amber',
    completed: 'green',
    concelled: 'red',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Manufacturing Overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Raw Materials" value={materials.length} icon={FlaskConical} color="amber" />
        <StatCard label="Finished Products" value={goods.length} icon={Package} color="green" />
        <StatCard label="Active Batches" value={activeBatches.length} icon={ClipboardList} color="blue" />
        <StatCard label="Low Stock Alert" value={lowStock.length} icon={AlertTriangle} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            Low Stock Materials
          </h2>
          {lowStock.length === 0
            ? <p className="text-sm text-gray-400">All materials are sufficiently stocked.</p>
            : <div className="space-y-2">
              {lowStock.map(m => (
                <div key={m.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="text-sm font-medium">{m.name}</span>
                  <span className="text-sm text-gray-500">
                    {m.quantity_in_stock} {m.unit} left
                  </span>
                </div>
              ))}
            </div>
          }
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <ClipboardList size={16} className="text-amber-500" />
          Recent Batches
        </h2>
        {batches.length === 0
          ? <p className="text-sm text-gray-400">No Batches yet.</p>
          : <div className="space-y-2">
            {batches.slice(0, 5).map(b => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm font-medium">{b.batch_name}</span>
                <Badge color={statusColors[b.status]}>
                  {b.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
            </div>
        }
      </div>
    </div>
  );
}

