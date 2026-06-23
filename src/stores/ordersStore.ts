import { create } from 'zustand';
import type { Order } from '@/types/orders';
import {
  fetchAvailableOrders,
  pickupOrder,
  deliverOrder,
  returnOrder,
} from '@/services/orders';

interface OrdersState {
  // Available orders to pick up (IN_PREPARATION + NOT_DELIVERED)
  availableOrders: Order[];
  // Orders currently held by this rider (IN_TRANSIT)
  myOrders: Order[];

  isLoadingAvailable: boolean;
  isLoadingMine: boolean;
  actionLoadingId: string | null; // ID of the order currently being acted on
  error: string | null;

  loadAvailableOrders: () => Promise<void>;
  loadMyOrders: () => Promise<void>;
  pickup: (orderId: string) => Promise<void>;
  deliver: (orderId: string, code: string) => Promise<boolean>;
  returnToDepot: (orderId: string) => Promise<void>;
  clearError: () => void;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  availableOrders: [],
  myOrders: [],
  isLoadingAvailable: false,
  isLoadingMine: false,
  actionLoadingId: null,
  error: null,

  loadAvailableOrders: async () => {
    set({ isLoadingAvailable: true, error: null });
    try {
      const page = await fetchAvailableOrders(1, 50);
      set({ availableOrders: page.data, isLoadingAvailable: false });
    } catch (e: any) {
      set({ isLoadingAvailable: false, error: e.message ?? 'Error al cargar pedidos' });
    }
  },

  loadMyOrders: async () => {
    // The backend doesn't have a dedicated /my-orders endpoint.
    // We derive "my orders" from the available + action results stored locally.
    // For now we keep this as a no-op that gets filled by pickup() results.
    set({ isLoadingMine: false });
  },

  pickup: async (orderId) => {
    set({ actionLoadingId: orderId, error: null });
    try {
      const updated = await pickupOrder(orderId);
      set((state) => ({
        // Remove from available list
        availableOrders: state.availableOrders.filter((o) => o.id !== orderId),
        // Add to my orders
        myOrders: [...state.myOrders.filter((o) => o.id !== orderId), updated],
        actionLoadingId: null,
      }));
    } catch (e: any) {
      set({ actionLoadingId: null, error: e.message ?? 'No se pudo tomar el pedido' });
    }
  },

  deliver: async (orderId, code) => {
    set({ actionLoadingId: orderId, error: null });
    try {
      const updated = await deliverOrder(orderId, code);
      set((state) => ({
        myOrders: state.myOrders.map((o) => (o.id === orderId ? updated : o)),
        actionLoadingId: null,
      }));
      return true;
    } catch (e: any) {
      set({ actionLoadingId: null, error: e.message ?? 'No se pudo registrar la entrega' });
      return false;
    }
  },

  returnToDepot: async (orderId) => {
    set({ actionLoadingId: orderId, error: null });
    try {
      const updated = await returnOrder(orderId);
      set((state) => ({
        myOrders: state.myOrders.map((o) => (o.id === orderId ? updated : o)),
        actionLoadingId: null,
      }));
    } catch (e: any) {
      set({ actionLoadingId: null, error: e.message ?? 'No se pudo registrar la devolución' });
    }
  },

  clearError: () => set({ error: null }),
}));
