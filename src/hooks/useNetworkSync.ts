import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';

import { useOrdersStore } from '@/stores/ordersStore';
import { useAuthStore } from '@/stores/authStore';

/**
 * Escucha los cambios de conectividad. Al pasar de OFFLINE → ONLINE,
 * drena la cola de acciones pendientes y refresca las listas.
 * Montar una sola vez, en el layout autenticado.
 */
export function useNetworkSync(): void {
  const wasConnected = useRef<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // isInternetReachable puede ser null (desconocido) → lo tratamos como conectado.
      const connected = Boolean(state.isConnected) && state.isInternetReachable !== false;
      const reconnected = wasConnected.current === false && connected;
      wasConnected.current = connected;

      // Reflejar el estado en la UI (badges "sin conexión").
      useAuthStore.setState({ isOffline: !connected });

      if (reconnected && useAuthStore.getState().isAuthenticated) {
        const store = useOrdersStore.getState();
        store
          .flushPending()
          .then(() => Promise.all([store.loadAvailableOrders(), store.loadMyOrders()]))
          .catch(() => {
            // Si vuelve a fallar, queda encolado para el próximo reintento.
          });
      }
    });

    return () => unsubscribe();
  }, []);
}
