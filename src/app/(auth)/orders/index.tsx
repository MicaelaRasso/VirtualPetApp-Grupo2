import { useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { OrderCard } from '@/components/OrderCard';
import { OfflineBadge } from '@/components/OfflineBadge';
import { colors, fonts, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useOrdersStore } from '@/stores/ordersStore';

export default function AvailableOrdersScreen() {
  const { driver, isOffline } = useAuthStore();
  const {
    availableOrders,
    isLoadingAvailable,
    actionLoadingId,
    error,
    loadAvailableOrders,
    pickup,
    clearError,
  } = useOrdersStore();

  useEffect(() => {
    loadAvailableOrders();
  }, []);

  const handlePickup = useCallback(async (id: string) => {
    await pickup(id);
  }, [pickup]);

  const handleRefresh = useCallback(() => {
    loadAvailableOrders();
  }, [loadAvailableOrders]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>
              Hola, {driver?.fullName ?? 'repartidor'}
            </Text>
            <Text style={styles.subtitle}>Pedidos listos para retirar</Text>
          </View>
          {isOffline ? <OfflineBadge /> : null}
        </View>
      </View>

      {/* Error banner */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Text onPress={clearError} style={styles.errorDismiss}>
            Cerrar
          </Text>
        </View>
      ) : null}

      {/* Loading first fetch */}
      {isLoadingAvailable && availableOrders.length === 0 ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Cargando pedidos...</Text>
        </View>
      ) : (
        <FlatList
          data={availableOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              variant="available"
              onPickup={handlePickup}
              isLoading={actionLoadingId === item.id}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingAvailable}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Image
                source={require('../../../../assets/images/nohaypedidos.png')}
                style={styles.emptyImage}
                resizeMode="contain"
              />
              <Text style={styles.emptyTitle}>Sin pedidos disponibles</Text>
              <Text style={styles.emptyText}>
                Cuando haya pedidos listos en el depósito, aparecerán acá.
              </Text>
            </View>
          }
          contentContainerStyle={
            availableOrders.length === 0 ? styles.emptyContainer : styles.listContent
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingTop: spacing['64'],
  },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing['24'],
    paddingBottom: spacing['16'],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing['8'],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing['8'],
  },
  greeting: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: typography.sizes['2xl'],
    lineHeight: typography.sizes['2xl'] * typography.lineHeights.tight,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: typography.sizes.sm,
    marginTop: spacing['4'],
  },
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.errorMuted,
    marginHorizontal: spacing['16'],
    marginBottom: spacing['8'],
    padding: spacing['12'],
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontFamily: typography.family.sans,
    fontSize: typography.sizes.sm,
  },
  errorDismiss: {
    color: colors.error,
    fontFamily: typography.family.sans,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginLeft: spacing['8'],
  },
  listContent: {
    paddingHorizontal: spacing['16'],
    paddingBottom: spacing['24'],
  },
  emptyContainer: {
    flex: 1,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['32'],
    paddingVertical: spacing['64'],
  },
  loadingText: {
    marginTop: spacing['16'],
    color: colors.muted,
    fontFamily: typography.family.sans,
    fontSize: typography.sizes.base,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: spacing['24'],
  },
  emptyTitle: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: typography.sizes.lg,
    textAlign: 'center',
    marginBottom: spacing['8'],
  },
  emptyText: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: typography.sizes.base,
    textAlign: 'center',
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
  },
});
