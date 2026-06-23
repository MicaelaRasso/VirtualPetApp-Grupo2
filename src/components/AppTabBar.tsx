import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { colors, fonts, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function getTabConfig(name: string, focused: boolean): { icon: IoniconsName; label: string } {
  switch (name) {
    case 'orders':
    case 'orders/index':
      return { icon: focused ? 'cube' : 'cube-outline', label: 'Para retirar' };
    case 'my-route':
      return { icon: focused ? 'bicycle' : 'bicycle', label: 'Mis pedidos' };
    default:
      return { icon: 'ellipse-outline', label: name };
  }
}

const HIDDEN_TABS = new Set(['index']);

export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Querés cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || spacing['8'] }]}>
      {state.routes.filter((route: any) => !HIDDEN_TABS.has(route.name)).map((route: any) => {
        const index = state.routes.indexOf(route);
        const isFocused = state.index === index;
        const { icon, label } = getTabConfig(route.name, isFocused);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={label}
          >
            <View style={[styles.iconWrapper, isFocused && styles.iconWrapperActive]}>
              <Ionicons
                name={icon}
                size={22}
                color={isFocused ? colors.accent : 'rgba(255,255,255,0.55)'}
              />
            </View>
            <Text style={[styles.label, isFocused && styles.labelActive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}

      {/* Botón de logout — no es una tab de navegación */}
      <Pressable
        onPress={handleLogout}
        style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
      >
        <View style={styles.iconWrapper}>
          <Ionicons name="log-out-outline" size={22} color="rgba(255,255,255,0.55)" />
        </View>
        <Text style={styles.label}>Salir</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    paddingTop: spacing['8'],
    borderTopWidth: 0,
    // Sombra hacia arriba
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4'],
  },
  tabPressed: {
    opacity: 0.7,
  },
  iconWrapper: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(199,129,0,0.18)',
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: typography.sizes.xs,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
  },
  labelActive: {
    color: colors.accent,
    fontFamily: fonts.semibold,
  },
});
