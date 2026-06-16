import { useQuery } from '@tanstack/react-query';
import { getStockMovements } from '../api/stockMovements.api.js';

export const useStockMovements = (params = {}) =>
  useQuery({
    queryKey: ['stockMovements', params],
    queryFn: () => getStockMovements(params).then(res => res.data)
  });

export const useStockMovementsSummary = () => 
  useQuery({
    queryKey: ['stockMovements', 'summary'],
    queryFn: () => 
      import('../api/axios.js')
        .then(m => m.default.get('/stock-movements/summary'))
        .then(res => res.data)
  });