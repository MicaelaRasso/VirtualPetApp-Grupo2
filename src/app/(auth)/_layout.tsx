import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { router } from 'expo-router';

import { useAuthStore } from '@/stores/authStore';
import { AppTabBar } from '@/components/AppTabBar';
import { useNetworkSync } from '@/hooks/useNetworkSync';

export default function AuthLayout() {
  const { isAuthenticated, isHydrated } = useAuthStore();

  // Auto-sync: drena la cola offline al recuperar conexión.
  useNetworkSync();

  // Guard: si el usuario no está autenticado (logout, token expirado), volver al login
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace('/login' as any);
    }
  }, [isAuthenticated, isHydrated]);

  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="orders" />
      <Tabs.Screen name="my-route" />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}
