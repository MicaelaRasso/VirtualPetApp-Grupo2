import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, touchTargets, typography } from '@/constants/theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}

export function Button({ label, onPress, disabled = false, loading = false, testID }: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
      testID={testID}
    >
      <View style={styles.content}>
        {loading && <ActivityIndicator color={colors.background} style={styles.spinner} />}
        <Text style={[styles.label, isDisabled && !loading && styles.labelDisabled, loading && styles.labelWithSpinner]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: touchTargets.minHeight,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['24'],
    borderRadius: radii['12'],
    backgroundColor: '#000000',
  },
  pressed: {
    backgroundColor: '#1a1a1a',
  },
  disabled: {
    backgroundColor: colors.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginRight: spacing['12'],
  },
  label: {
    color: colors.background,
    fontFamily: typography.family.sans,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.sizes.base * typography.lineHeights.tight,
  },
  labelDisabled: {
    color: colors.muted,
  },
  labelWithSpinner: {
    // Optical balance when a spinner sits beside the label.
    transform: [{ translateX: -spacing['4'] }],
  },
});
