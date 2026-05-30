import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createDispatch, getDispatches } from '../api/dispactches.api.js';

export const useDispatches = () => 
  useQuery({
    queryKey: ['dispatches'],
    queryFn: () => getDispatches().then(res => res.data)
  });

export const useCreateDispatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDispatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatches'] }); // Refresh dispatch list
      queryClient.invalidateQueries({ queryKey: ['finishedGoods'] }); // Update stock levels
      queryClient.invalidateQueries({ queryKey: ['stockMovements'] }); // new movement logged
    }
  });
};