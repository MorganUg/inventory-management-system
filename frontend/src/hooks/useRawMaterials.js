import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { createRawMaterial, updateRawMaterial, deleteRawMaterial, getRawMaterials } from '../api/rawMaterials.api.js';

export const useRawMaterials = () => 
  useQuery({ queryKey: ['rawMaterials'], queryFn: () => getRawMaterials().then(res => res.data) });

export const useCreateRawMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRawMaterial,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rawMaterials'] }),
  });
};

export const useUpdateRawMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data}) => updateRawMaterial(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rawMaterials'] }),
  });
}

export const useDeleteRawMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRawMaterial,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rawMaterials'] }),
  });
}