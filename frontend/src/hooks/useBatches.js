import { completeBatch, createBatch, getBatch, getBatches, updateBatchStatus } from '../api/batches.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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

export const useUpdateBatchStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) => 
      updateBatchStatus(id, status),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
  });
};

export const useCompleteBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, outputs }) => completeBatch(id, outputs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] }),
      queryClient.invalidateQueries({ queryKey: ['rawMaterials'] }),
      queryClient.invalidateQueries({ queryKey: ['finishedGoods'] }),
      queryClient.invalidateQueries({ queryKey: ['stockMovements'] });
    }
  });
};
