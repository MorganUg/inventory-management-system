import { completeBatch, createBatch, getBatch, getBatches } from '../api/batches.api';
import { useQuery } from '@tanstack/react-query';

export const useBatches = () => 
  useQuery({ queryKey: ['batches'], queryFn: () => getBatches().then(res => res.data) });

export const useBatch = (id) => 
  useQuery({ queryKey: ['batches', id], queryFn: () => getBatch(id).then(res => res.data) });

export const useCreateBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBatch,
    onSuccess: () => queryClient.invalidateQueries(['batches']),
  });
}

export const useCompleteBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, outputs }) => completeBatch(id, outputs),
    onSuccess: () => {
      queryClient.invalidateQueries(['batches']),
      queryClient.invalidateQueries(['rawMaterials']),
      queryClient.invalidateQueries(['finishedGoods']);
      queryClient.invalidateQueries(['stockMovements']);
    }
  });
};
