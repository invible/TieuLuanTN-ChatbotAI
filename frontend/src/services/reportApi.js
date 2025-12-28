import { api } from "./http";

export const getOverviewStats = () => api.get("/reports/overview-stats");

export const getRevenueByMonth = (year) =>
  api.get("/reports/revenue-by-month", { params: { year } });

export const getTopProducts = (limit = 5) =>
  api.get("/reports/top-products", { params: { limit } });

export const getRevenueRange = (startDate, endDate) =>
  api.get("/reports/revenue-range", {
    params: { start_date: startDate, end_date: endDate },
  });
