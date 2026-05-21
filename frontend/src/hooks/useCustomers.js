import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCustomer, deleteCustomer, getCustomer, getCustomers, updateCustomer } from '../api/customers.api.js';

export const useCustomers = () => 
  useQuery({
    queryKey: ['customers'],
    queryFn: () => getCustomers().then(res => res.data)
  });

export const useCustomer = (id) => 
  useQuery({
    queryKey: ['customers', id],
    queryFn: () => getCustomer(id).then(res => res.data),
    enabled: !!id
  });

  export const useCreateCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: createCustomer,
      onSuccess: () => queryClient.invalidateQueries(['customers'])
    })
  }

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateCustomer(id, data),
    onSuccess: () => queryClient.invalidateQueries(['customres'])
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => queryClient.invalidateQueries(['customers'])
  });
};
