import { useQuery } from "@tanstack/react-query";
import api from "../api/axios.js";
import { use } from "react";

const buildParams = (filters) => {
  const params = {};
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  return params;
};

export const useProductionReport = (filters = {}) =>
  useQuery({
    queryKey: ["reports", "production", filters],
    queryFn: () =>
      api
        .get("/reports/production", { params: buildParams(filters) })
        .then((res) => res.data),
  });

export const useStockReport = () =>
  useQuery({
    queryKey: ["reports", "stock"],
    queryFn: () => api.get("/reports/stock").then((res) => res.data),
  });

export const useDispatchReport = (filters = {}) =>
  useQuery({
    queryKey: ["reports", "dispatches", filters],
    queryFn: () =>
      api
        .get("/reports/dispatches", { params: buildParams(filters) })
        .then((res) => res.data),
  });

export const useConsumptionReport = (filters = {}) =>
  useQuery({
    queryKey: ["reports", "consumption", filters],
    queryFn: () =>
      api
        .get("/reports/consumption", { params: buildParams(filters) })
        .then((res) => res.data),
  });

export const useProductionChart = () =>
  useQuery({
    queryKey: ["reports", "charts", "production"],
    queryFn: () =>
      api.get("/reports/charts/production").then((res) => res.data),
  });

export const useDispatchChart = () =>
  useQuery({
    queryKey: ["reports", "charts", "dispatches"],
    queryFn: () =>
      api.get("/reports/charts/dispatches").then((res) => res.data),
  });

export const useTopProductsChart = () =>
  useQuery({
    queryKey: ["reports", "charts", "top-products"],
    queryFn: () =>
      api.get("/reports/charts/top-products").then((res) => res.data),
  });

export const useStockLevelsChart = () =>
  useQuery({
    queryKey: ["reports", "charts", "stock-levels"],
    queryFn: () =>
      api.get("/reports/charts/stock-levels").then((res) => res.data),
  });

// BILL OF MATERIALS
export const useBillOfMaterials = () =>
  useQuery({
    queryKey: ["bom"],
    queryFn: () => api.get("/bill-of-materials").then((res) => res.data),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

// RAW MATERIAL INVENTORY
export const useRawMaterialInventory = () =>
  useQuery({
    queryKey: ["raw-materials", "inventory"],
    queryFn: () => api.get("/raw-materials/inventory").then((res) => res.data),
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes (inventory changes more frequently)
  });
