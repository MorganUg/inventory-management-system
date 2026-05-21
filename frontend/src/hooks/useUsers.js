import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deactivateUser, deleteUser, getUser, getUsers, resetPassword, updateUser } from '../api/users.api.js';

export const useUsers = () => 
  useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers().then(res => res.data)
  });

export const useUser = (id) => 
  useQuery({
    queryKey: ['users', id],
    queryFn: () => getUser(id).then(res => res.data),
    enabled: !!id
  });

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: () => queryClient.invalidateQueries(['users'])
  });
};

export const useResetPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => resetPassword(id, data),
    onSuccess: () => queryClient.invalidateQueries(['users'])
  });
};

export const useDeactivateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => queryClient.invalidateQueries(['users'])
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries(['users'])
  });
};