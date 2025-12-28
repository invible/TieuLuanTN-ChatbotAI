import { api } from "./http";

export const listOrderItemsByOrder = (orderId) =>
  api.get("/order-items", { params: { order_id: orderId } });
