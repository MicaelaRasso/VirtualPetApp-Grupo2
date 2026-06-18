import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { router } from 'expo-router';

import { useAuthStore } from '@/stores/authStore';
import { AppTabBar } from '@/components/AppTabBar';

export default function AuthLayout() {
  const { isAuthenticated, isHydrated } = useAuthStore();

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
    </Tabs>
  );
}
