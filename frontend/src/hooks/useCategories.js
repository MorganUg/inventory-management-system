import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createCategory, deleteCategory, getCategories, getCategory, updateCategory } from "../api/categories.api";


export const useCategories = (type) =>
  useQuery({
    queryKey: ['categories', type],
    queryFn: async () => {
      const data = await getCategories().then(res => res.data);
      // optionally filter by type: 'raw_material' or 'finished_good'
      return type ? data.filter(c => c.type === type) : data;
    }
  });

export const useCategory = (id) => 
  useQuery({
    queryKey: ['category', id],
    queryFn: () => getCategory(id).then(res => res.data),
    enabled: !!id
  });

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => queryClient.invalidateQueries(['categories']),
  });
}

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateCategory(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}