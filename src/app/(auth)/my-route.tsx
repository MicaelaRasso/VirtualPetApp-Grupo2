import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';

import { OfflineBadge } from '@/components/OfflineBadge';
import { colors, fonts, radii, spacing, touchTargets, typography } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useOrdersStore } from '@/stores/ordersStore';
import type { Order } from '@/types/orders';

export default function MyRouteScreen() {
  const { isOffline } = useAuthStore();
  const { myOrders, actionLoadingId, error, deliver, returnToDepot, clearError } =
    useOrdersStore();

  const [deliveringOrder, setDeliveringOrder] = useState<Order | null>(null);
  const [code, setCode] = useState('');

  const inTransit = myOrders.filter((o) => o.status === 'IN_TRANSIT');
  const completed = myOrders.filter(
    (o) => o.status === 'DELIVERED' || o.status === 'NOT_DELIVERED' || o.status === 'CANCELLED'
  );

  const handleDeliver = useCallback((order: Order) => {
    setCode('');
    clearError();
    setDeliveringOrder(order);
  }, [clearError]);

  const closeDeliverModal = useCallback(() => {
    setDeliveringOrder(null);
    setCode('');
  }, []);

  const confirmDeliver = useCallback(async () => {
    if (!deliveringOrder || code.length !== 6) return;
    const ok = await deliver(deliveringOrder.id, code);
    if (ok) {
      setDeliveringOrder(null);
      setCode('');
    }
  }, [deliveringOrder, code, deliver]);

  const handleReturn = useCallback(
    (order: Order) => {
      Alert.alert(
        'No entregado',
        `¿No pudiste entregar el pedido a ${order.customerName}? Volverá al depósito.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar devolución',
            style: 'destructive',
            onPress: () => returnToDepot(order.id),
          },
        ]
      );
    },
    [returnToDepot]
  );

  const renderItem = ({ item }: { item: Order }) => {
    const isActing = actionLoadingId === item.id;
    const isDone =
      item.status === 'DELIVERED' ||
      item.status === 'NOT_DELIVERED' ||
      item.status === 'CANCELLED';
    const address = item.shippingAddress;
    const addressLine = [address.street, address.city].filter(Boolean).join(', ');

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.customerName}>{item.customerName}</Text>
          {isDone && (
            <View
              style={[
                styles.doneBadge,
                item.status === 'DELIVERED'
                  ? styles.doneBadgeSuccess
                  : styles.doneBadgeError,
              ]}
            >
              <Text
                style={[
                  styles.doneBadgeText,
                  item.status === 'DELIVERED'
                    ? styles.doneBadgeTextSuccess
                    : styles.doneBadgeTextError,
                ]}
              >
                {item.status === 'DELIVERED' ? '✓ Entregado' : '✗ No entregado'}
              </Text>
            </View>
          )}
        </View>

        {addressLine ? <Text style={styles.address}>{addressLine}</Text> : null}

        <Text style={styles.meta}>
          {item.items.length} {item.items.length === 1 ? 'producto' : 'productos'} · ${item.total}
        </Text>

        {!isDone && (
          <View style={styles.actions}>
            <Pressable
              disabled={isActing}
              onPress={() => handleDeliver(item)}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.deliverBtn,
                pressed && styles.deliverBtnPressed,
                isActing && styles.actionBtnDisabled,
              ]}
            >
              {isActing ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text style={styles.actionBtnLabel}>✓ Entregado</Text>
              )}
            </Pressable>

            <Pressable
              disabled={isActing}
              onPress={() => handleReturn(item)}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.returnBtn,
                pressed && styles.returnBtnPressed,
                isActing && styles.actionBtnDisabled,
              ]}
            >
              <Text style={[styles.actionBtnLabel, styles.returnBtnLabel]}>
                ✗ No entregado
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Mi recorrido</Text>
            <Text style={styles.subtitle}>
              {inTransit.length} en camino · {completed.length} finalizados
            </Text>
          </View>
          {isOffline ? <OfflineBadge /> : null}
        </View>
      </View>

      {/* Error banner */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Text onPress={clearError} style={styles.errorDismiss}>Cerrar</Text>
        </View>
      ) : null}

      <FlatList
        data={[...inTransit, ...completed]}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          inTransit.length > 0 && completed.length > 0 ? (
            <Text style={styles.sectionLabel}>En camino</Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Sin pedidos en tu recorrido</Text>
            <Text style={styles.emptyText}>
              Tomá pedidos desde la lista de disponibles para empezar tu recorrido.
            </Text>
          </View>
        }
        contentContainerStyle={
          myOrders.length === 0 ? styles.emptyContainer : styles.listContent
        }
      />

      <Modal
        visible={deliveringOrder !== null}
        transparent
        animationType="fade"
        onRequestClose={closeDeliverModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirmar entrega</Text>
            <Text style={styles.modalSubtitle}>
              Pedile a {deliveringOrder?.customerName} el código de entrega de 6 dígitos
              que recibió por mail.
            </Text>

            <TextInput
              style={styles.codeInput}
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="------"
              placeholderTextColor={colors.muted}
              autoFocus
              textContentType="oneTimeCode"
            />

            {error ? <Text style={styles.modalError}>{error}</Text> : null}

            <View style={styles.modalActions}>
              <Pressable
                onPress={closeDeliverModal}
                style={({ pressed }) => [
                  styles.modalBtn,
                  styles.modalCancelBtn,
                  pressed && styles.actionBtnDisabled,
                ]}
              >
                <Text style={styles.modalCancelLabel}>Cancelar</Text>
              </Pressable>

              <Pressable
                onPress={confirmDeliver}
                disabled={code.length !== 6}
                style={({ pressed }) => [
                  styles.modalBtn,
                  styles.modalConfirmBtn,
                  pressed && styles.deliverBtnPressed,
                  code.length !== 6 && styles.actionBtnDisabled,
                ]}
              >
                <Text style={styles.actionBtnLabel}>Confirmar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  title: {
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
    borderRadius: radii['8'],
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
  sectionLabel: {
    color: colors.muted,
    fontFamily: typography.family.sans,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing['8'],
    marginTop: spacing['4'],
  },
  listContent: {
    paddingHorizontal: spacing['16'],
    paddingBottom: spacing['24'],
  },
  emptyContainer: { flex: 1 },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['32'],
    paddingVertical: spacing['64'],
  },
  emptyTitle: {
    color: colors.ink,
    fontFamily: typography.family.sans,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
    marginBottom: spacing['8'],
  },
  emptyText: {
    color: colors.muted,
    fontFamily: typography.family.sans,
    fontSize: typography.sizes.base,
    textAlign: 'center',
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: radii['12'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing['16'],
    marginBottom: spacing['12'],
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['4'],
  },
  customerName: {
    flex: 1,
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: typography.sizes.lg,
  },
  doneBadge: {
    borderRadius: radii['full'],
    paddingHorizontal: spacing['12'],
    paddingVertical: spacing['4'],
    marginLeft: spacing['8'],
  },
  doneBadgeSuccess: { backgroundColor: colors.successMuted },
  doneBadgeError: { backgroundColor: colors.errorMuted },
  doneBadgeText: {
    fontFamily: fonts.semibold,
    fontSize: typography.sizes.xs,
  },
  doneBadgeTextSuccess: { color: colors.success },
  doneBadgeTextError: { color: colors.error },
  address: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: typography.sizes.sm,
    marginBottom: spacing['8'],
  },
  meta: {
    color: colors.inkSecondary,
    fontFamily: fonts.medium,
    fontSize: typography.sizes.sm,
    marginBottom: spacing['12'],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing['8'],
  },
  actionBtn: {
    flex: 1,
    minHeight: touchTargets.minHeight,
    borderRadius: radii['12'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnDisabled: { opacity: 0.5 },
  actionBtnLabel: {
    fontFamily: fonts.semibold,
    fontSize: typography.sizes.sm,
    color: colors.background,
  },
  deliverBtn: { backgroundColor: colors.success },
  deliverBtnPressed: { backgroundColor: '#245e39' },
  returnBtn: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  returnBtnPressed: { backgroundColor: colors.errorMuted },
  returnBtnLabel: { color: colors.error },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: spacing['24'],
  },
  modalCard: {
    backgroundColor: colors.background,
    borderRadius: radii['16'],
    padding: spacing['24'],
  },
  modalTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: typography.sizes.xl,
    marginBottom: spacing['8'],
  },
  modalSubtitle: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    marginBottom: spacing['16'],
  },
  codeInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii['12'],
    paddingVertical: spacing['12'],
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: typography.sizes['2xl'],
    textAlign: 'center',
    letterSpacing: 12,
  },
  modalError: {
    color: colors.error,
    fontFamily: fonts.medium,
    fontSize: typography.sizes.sm,
    marginTop: spacing['8'],
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing['8'],
    marginTop: spacing['16'],
  },
  modalBtn: {
    flex: 1,
    minHeight: touchTargets.minHeight,
    borderRadius: radii['12'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelBtn: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  modalCancelLabel: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: typography.sizes.sm,
  },
  modalConfirmBtn: { backgroundColor: colors.success },
});
