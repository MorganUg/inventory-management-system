import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } from '../api/suppliers.api.js';

export const useSuppliers = () => 
  useQuery({
    queryKey: ['suppliers'],
    queryFn: () => getSuppliers().then(res => res.data)
  });

export const useSupplier = (id) => 
  useQuery({
    queryKey: ['suppliers', id],
    queryFn: () => getSupplier(id).then(res => res.data),
    enabled: !!id
  });

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSupplier,
    onSuccess: () => queryClient.invalidateQueries(['suppliers']),
  });
}

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateSupplier(id, data),
    onSuccess: () => queryClient.invalidateQueries(['suppliers']),
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => queryClient.invalidateQueries(['suppliers']),
  });
};
