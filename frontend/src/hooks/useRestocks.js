import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRestock, getRestock, getRestocks } from "../api/restocks.api";

export const useRestocks = () =>
  useQuery({
    queryKey: ["restocks"],
    queryFn: () => getRestocks().then((res) => res.data),
  });

export const useRestock = (id) =>
  useQuery({
    queryKey: ["restocks", id],
    queryFn: () => getRestock(id).then((res) => res.data),
    enabled: !!id,
  });

export const useCreateRestock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRestock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restocks"] }); // Refresh restock list
      queryClient.invalidateQueries({ queryKey: ["rawMaterials"] }); // Updates stock levels
      queryClient.invalidateQueries({ queryKey: ["stockMovements"] }); // new movement logged
    },
  });
};
