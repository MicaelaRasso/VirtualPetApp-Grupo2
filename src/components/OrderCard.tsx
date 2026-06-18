import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Order } from '@/types/orders';
import { colors, fonts, radii, spacing, touchTargets, typography } from '@/constants/theme';

interface OrderCardProps {
  order: Order;
  onPickup?: (id: string) => void;
  isLoading?: boolean;
  variant?: 'available' | 'mine';
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  IN_PREPARATION: { label: 'Listo en depósito', color: colors.accent, bg: colors.accentMuted },
  NOT_DELIVERED: { label: 'Intento fallido', color: colors.error, bg: colors.errorMuted },
  IN_TRANSIT: { label: 'En camino', color: colors.primary, bg: colors.primaryMuted },
  DELIVERED: { label: 'Entregado', color: colors.success, bg: colors.successMuted },
  CANCELLED: { label: 'Cancelado', color: colors.muted, bg: colors.surface },
};

export function OrderCard({ order, onPickup, isLoading, variant = 'available' }: OrderCardProps) {
  const statusInfo = STATUS_LABEL[order.status] ?? STATUS_LABEL['IN_PREPARATION'];
  const address = order.shippingAddress;
  const addressLine = [address.street, address.city, address.province]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.card}>
      {/* Status badge */}
      <View style={[styles.badge, { backgroundColor: statusInfo.bg }]}>
        <Text style={[styles.badgeText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
      </View>

      {/* Customer + Address */}
      <Text style={styles.customer}>{order.customerName}</Text>
      {addressLine ? <Text style={styles.address}>{addressLine}</Text> : null}

      {/* Order meta */}
      <View style={styles.meta}>
        <Text style={styles.metaLabel}>
          {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
        </Text>
        <Text style={styles.metaLabel}>$ {order.total}</Text>
      </View>

      {order.deliveryAttempts > 0 && (
        <Text style={styles.attempts}>
          Intentos: {order.deliveryAttempts} / 3
        </Text>
      )}

      {/* Action button — only on available variant */}
      {variant === 'available' && onPickup ? (
        <Pressable
          accessibilityRole="button"
          disabled={isLoading}
          onPress={() => onPickup(order.id)}
          style={({ pressed }) => [
            styles.pickupButton,
            pressed && styles.pickupButtonPressed,
            isLoading && styles.pickupButtonDisabled,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.pickupButtonLabel}>Tomar pedido</Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: radii['12'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing['16'],
    marginBottom: spacing['12'],
    // Sombra
    shadowColor: '#1a2332',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii['full'],
    paddingHorizontal: spacing['12'],
    paddingVertical: spacing['4'],
    marginBottom: spacing['12'],
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: typography.sizes.xs,
  },
  customer: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: typography.sizes.lg,
    lineHeight: typography.sizes.lg * typography.lineHeights.normal,
    marginBottom: spacing['4'],
  },
  address: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    marginBottom: spacing['12'],
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing['4'],
  },
  metaLabel: {
    color: colors.inkSecondary,
    fontFamily: fonts.medium,
    fontSize: typography.sizes.sm,
  },
  attempts: {
    color: colors.error,
    fontFamily: fonts.regular,
    fontSize: typography.sizes.xs,
    marginBottom: spacing['8'],
  },
  pickupButton: {
    marginTop: spacing['12'],
    minHeight: touchTargets.minHeight,
    backgroundColor: colors.primary,
    borderRadius: radii['12'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupButtonPressed: {
    backgroundColor: colors.primaryDeep,
  },
  pickupButtonDisabled: {
    backgroundColor: colors.border,
  },
  pickupButtonLabel: {
    color: colors.background,
    fontFamily: fonts.semibold,
    fontSize: typography.sizes.base,
  },
});
