import { create } from 'zustand';
import type { Order } from '@/types/orders';
import {
  fetchAvailableOrders,
  fetchMyOrders,
  fetchOrderById,
  pickupOrder,
  deliverOrder,
  returnOrder,
} from '@/services/orders';
import * as repo from '@/database/ordersRepo';
import { useAuthStore } from '@/stores/authStore';
import { ApiError } from '@/services/apiClient';

interface OrdersState {
  // Available orders to pick up (IN_PREPARATION + NOT_DELIVERED)
  availableOrders: Order[];
  // Orders currently held / handled by this rider
  myOrders: Order[];

  isLoadingAvailable: boolean;
  isLoadingMine: boolean;
  actionLoadingId: string | null; // ID of the order currently being acted on
  pendingCount: number; // acciones offline encoladas sin sincronizar
  error: string | null;

  loadAvailableOrders: () => Promise<void>;
  loadMyOrders: () => Promise<void>;
  pickup: (orderId: string) => Promise<void>;
  deliver: (orderId: string, code: string) => Promise<boolean>;
  returnToDepot: (orderId: string) => Promise<void>;
  flushPending: () => Promise<void>;
  clearError: () => void;
}

function riderId(): string | null {
  return useAuthStore.getState().driver?.id ?? null;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  availableOrders: [],
  myOrders: [],
  isLoadingAvailable: false,
  isLoadingMine: false,
  actionLoadingId: null,
  pendingCount: 0,
  error: null,

  loadAvailableOrders: async () => {
    set({ isLoadingAvailable: true, error: null });

    // 1) Drenar la cola y traer datos frescos del backend (si hay red).
    await get().flushPending();
    try {
      const page = await fetchAvailableOrders(1, 50);
      await repo.upsertOrders(page.data);
    } catch (e: any) {
      // Sin conexión: seguimos con lo último cacheado en la DB.
      set({ error: e?.message ?? 'Sin conexión: mostrando datos guardados' });
    }

    // 2) Leer siempre desde la DB local (fuente de verdad para la UI).
    const [available, count] = await Promise.all([
      repo.getAvailableOrders(),
      repo.countPending(),
    ]);
    set({ availableOrders: available, pendingCount: count, isLoadingAvailable: false });
  },

  loadMyOrders: async () => {
    set({ isLoadingMine: true, error: null });

    // 1) Drenar la cola y traer mis pedidos frescos del backend (si hay red).
    await get().flushPending();
    try {
      const page = await fetchMyOrders(1, 50);
      await repo.upsertOrders(page.data);
    } catch (e: any) {
      // Sin conexión: seguimos con lo último cacheado en la DB.
      set({ error: e?.message ?? 'Sin conexión: mostrando datos guardados' });
    }

    // 2) Leer siempre desde la DB local (fuente de verdad para la UI).
    const id = riderId();
    const [mine, count] = await Promise.all([
      id ? repo.getMyOrders(id) : Promise.resolve([] as Order[]),
      repo.countPending(),
    ]);
    set({ myOrders: mine, pendingCount: count, isLoadingMine: false });
  },

  pickup: async (orderId) => {
    set({ actionLoadingId: orderId, error: null });
    // Optimista: aplico local + encolo.
    await repo.applyLocalAction(orderId, 'PICKUP', null, riderId());
    await refreshLists(set);
    // Intento enviar ya; si falla queda en la cola.
    try {
      const updated = await pickupOrder(orderId);
      await repo.markSynced(orderId, updated);
    } catch (e: any) {
      set({ error: 'Guardado offline. Se sincronizará al recuperar conexión.' });
    }
    await refreshLists(set);
    set({ actionLoadingId: null });
  },

  deliver: async (orderId, code) => {
    // La entrega NO es optimista: el código de entrega debe validarse contra el
    // backend antes de marcar como entregado. Sin conexión no se puede confirmar.
    set({ actionLoadingId: orderId, error: null });
    try {
      const updated = await deliverOrder(orderId, code);
      // Solo si el back acepta el código persistimos el estado DELIVERED.
      await repo.markSynced(orderId, updated);
      await refreshLists(set);
      set({ actionLoadingId: null });
      return true;
    } catch (e: any) {
      // Código incorrecto (ApiError del back) o falta de conexión: no marcamos
      // entregado ni encolamos nada. La orden sigue EN_TRANSITO.
      const message =
        e instanceof ApiError
          ? e.message
          : 'No se pudo confirmar la entrega. Necesitás conexión para validar el código.';
      set({ actionLoadingId: null, error: message });
      return false;
    }
  },

  returnToDepot: async (orderId) => {
    set({ actionLoadingId: orderId, error: null });
    await repo.applyLocalAction(orderId, 'RETURN', null, riderId());
    await refreshLists(set);
    try {
      const updated = await returnOrder(orderId);
      await repo.markSynced(orderId, updated);
    } catch (e: any) {
      set({ error: 'Devolución guardada offline. Se sincronizará al recuperar conexión.' });
    }
    await refreshLists(set);
    set({ actionLoadingId: null });
  },

  // Reproduce la cola de acciones contra el backend (best-effort).
  flushPending: async () => {
    const pendings = await repo.getPendingActions();
    for (const p of pendings) {
      try {
        let updated: Order;
        if (p.type === 'PICKUP') updated = await pickupOrder(p.orderId);
        else if (p.type === 'DELIVER') updated = await deliverOrder(p.orderId, p.payload?.code);
        else updated = await returnOrder(p.orderId);
        await repo.markSynced(p.orderId, updated);
      } catch (e: any) {
        // El backend RECHAZÓ la acción (4xx: código incorrecto, transición inválida,
        // pedido reasignado por backoffice, etc.). No tiene sentido reintentar: la
        // descartamos y revertimos el cambio optimista al estado real del backend.
        if (e instanceof ApiError && e.status >= 400 && e.status < 500) {
          try {
            const fresh = await fetchOrderById(p.orderId);
            await repo.markSynced(p.orderId, fresh); // pisa lo local + limpia la cola del pedido
          } catch {
            await repo.removePendingAction(p.id); // si no se puede traer, al menos sacar la acción tóxica
          }
          continue;
        }
        // Sin red (o error transitorio del server): lo dejamos encolado y cortamos.
        await repo.bumpRetries(p.id);
        break;
      }
    }
    const count = await repo.countPending();
    set({ pendingCount: count });
  },

  clearError: () => set({ error: null }),
}));

// Helper interno: recomputa ambas listas + contador desde la DB local.
async function refreshLists(set: (partial: Partial<OrdersState>) => void): Promise<void> {
  const id = riderId();
  const [available, mine, count] = await Promise.all([
    repo.getAvailableOrders(),
    id ? repo.getMyOrders(id) : Promise.resolve([] as Order[]),
    repo.countPending(),
  ]);
  set({ availableOrders: available, myOrders: mine, pendingCount: count });
}
