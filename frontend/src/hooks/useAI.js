import { useQuery } from "@tanstack/react-query";
import api from "../api/axios.js";

export const useDemandForecast = (finishedGoodId, weeksBack) => {
  return useQuery({
    queryKey: ["ai", "forecast", finishedGoodId, weeksBack],
    queryFn: async () => {
      const params = weeksBack ? { weeks: weeksBack } : {};
      const res = await api.get(`/ai/forecast/${finishedGoodId}`, { params });
      return res.data;
    },
    enabled: !!finishedGoodId,
  });
};

export const useAIInsights = (finishedGoodId) => {
  return useQuery({
    queryKey: ["ai", "insights", finishedGoodId],
    queryFn: async () => {
      const res = await api.get(`/ai/insights/${finishedGoodId}`);
      return res.data;
    },
    enabled: !!finishedGoodId,
  });
};

export const useAIRecommendations = (finishedGoodId) => {
  return useQuery({
    queryKey: ["ai", "recommendations", finishedGoodId],
    queryFn: async () => {
      const res = await api.get(`/ai/recommendations/${finishedGoodId}`);
      return res.data;
    },
    enabled: !!finishedGoodId,
  });
};

export const useAISummary = (finishedGoodId, weeksBack) => {
  return useQuery({
    queryKey: ["ai", "summary", finishedGoodId, weeksBack],
    queryFn: async () => {
      const params = weeksBack ? { weeks: weeksBack } : {};
      const res = await api.get(`/ai/summary/${finishedGoodId}`, { params });
      return res.data;
    },
    enabled: !!finishedGoodId,
  });
};

export const useRawMaterialRestock = (params, options = {}) => {
  return useQuery({
    queryKey: ["ai", "raw-material-restock", params],
    queryFn: async () => {
      const res = await api.post("/ai/raw-material-restock", params, {
        params: options,
      });
      return res.data;
    },
    enabled:
      !!params?.productionForecasts?.length &&
      !!params?.billOfMaterials?.length,
  });
};
