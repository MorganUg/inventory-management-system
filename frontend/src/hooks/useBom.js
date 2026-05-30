import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addBomItem, activateBom, createBom, deleteBomItem, getBom, getBomByFinishedGood, getBoms, updateBomItem } from '../api/bom.api.js';

export const useBoms = () => 
  useQuery({
    queryKey: ['boms'],
    queryFn: () => getBoms().then(res => res.data)
  });

export const useBom = (id) => 
  useQuery({
    queryKey: ['boms', id],
    queryFn: () => getBom(id).then(res => res.data),
    enabled: !!id
  });

export const useBomByFinishedGood = (finishedGoodId) =>
  useQuery({
    queryKey: ['boms', 'finished-good', finishedGoodId],
    queryFn: () => getBomByFinishedGood(finishedGoodId).then(res => res.data),
    enabled: !!finishedGoodId,
    retry: false // No retry if no BOM exits yet for this particular product
  });

export const useCreateBom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBom,
    onSuccess: () => queryClient.invalidateQueries(['boms'])
  });
};

export const useActivateBom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: activateBom,
    onSuccess: () => queryClient.invalidateQueries(['boms'])
  });
};

export const useAddBomItem = (bomId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => addBomItem(bomId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boms', bomId] });
      queryClient.invalidateQueries({ queryKey: ['boms'] });
    }
  });
};

export const useUpdateBomItem = (bomId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }) => updateBomItem(bomId, itemId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boms', bomId] })
  });
};

export const useDeleteBomItem = (bomId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId) => deleteBomItem(bomId, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boms', bomId] })
  });
};