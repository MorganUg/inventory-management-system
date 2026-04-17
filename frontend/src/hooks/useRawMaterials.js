import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { createRawMaterial, deleteRawMaterial, getRawMaterials } from '../api/rawMaterials.api.js';

export const useRawMaterials = () => 
  useQuery({ queryKey: ['rawMaterials'], queryFn: () => getRawMaterials().then(res => res.data) });

export const useCreateRawMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRawMaterial,
    onSuccess: () => queryClient.invalidateQueries(['rawMaterials']),
  });
};

export const useUpdateRawMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRawMaterial,
    onSuccess: () => queryClient.invalidateQueries(['rawMaterials']),
  });
}