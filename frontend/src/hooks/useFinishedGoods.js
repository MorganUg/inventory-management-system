import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFinishedGood, deleteFinishedGood, getFinishedGood, getFinishedGoods, updateFinishedGood } from "../api/finishedGoods.api";

export const useFinishedGoods = () => 
  useQuery({
    queryKey: ['finishedGoods'],
    queryFn: () => getFinishedGoods().then(res => res.data)
  });

export const useFinishedGood = (id) => 
  useQuery({
    queryKey: ['finishedGoods'],
    queryFn: () => getFinishedGood(id).then(res => res.data),
    enabled: !!id
  });

export const useCreateFinishedGood = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFinishedGood,
    onSuccess: () => queryClient.invalidateQueries(['finishedGoods'])
  });
};

export const useUpdateFinishedGood = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateFinishedGood(id, data),
    onSuccess: () => queryClient.invalidateQueries(['finishedGoods'])
  });
};

export const useDeleteFinishedGood = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFinishedGood,
    onSuccess: () => queryClient.invalidateQueries(['finishedGoods'])
  });
};