import { apiClient } from '@/services/apiClient';
import type { Order, OrdersPage } from '@/types/orders';

/**
 * Fetch paginated list of available orders (IN_PREPARATION + NOT_DELIVERED).
 * Only RIDER role can call this endpoint.
 */
export async function fetchAvailableOrders(page = 1, limit = 20): Promise<OrdersPage> {
  return apiClient<OrdersPage>(`/orders/available?page=${page}&limit=${limit}`);
}

/**
 * Fetch the detail of a single order by ID.
 */
export async function fetchOrderById(id: string): Promise<Order> {
  return apiClient<Order>(`/orders/${id}`);
}

/**
 * Take an order from the depot (assigns it to the logged-in rider).
 * Changes order status to IN_TRANSIT.
 */
export async function pickupOrder(id: string): Promise<Order> {
  return apiClient<Order>(`/orders/${id}/pickup`, { method: 'POST' });
}

/**
 * Mark an order as delivered.
 * Changes order status to DELIVERED.
 */
export async function deliverOrder(id: string): Promise<Order> {
  return apiClient<Order>(`/orders/${id}/deliver`, { method: 'POST' });
}

/**
 * Mark an order as not delivered (return to depot).
 * If deliveryAttempts < 3 → status becomes NOT_DELIVERED (available again).
 * If deliveryAttempts >= 3 → status becomes CANCELLED.
 */
export async function returnOrder(id: string): Promise<Order> {
  return apiClient<Order>(`/orders/${id}/return`, { method: 'POST' });
}
