import { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { router } from 'expo-router';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { OfflineBadge } from '@/components/OfflineBadge';
import { colors, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { login, isLoading, isAuthenticated, error, isOffline } = useAuthStore();

  // Navegar cuando el login sea exitoso
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(auth)' as any);
    }
  }, [isAuthenticated]);

  const isSubmitDisabled = email.trim().length === 0 || password.length === 0 || isLoading;

  const handleLogin = async () => {
    await login({ email: email.trim(), password });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.brand}>Delivery App</Text>
            <Text style={styles.subtitle}>Iniciá sesión para empezar tu recorrido</Text>
          </View>

          {isOffline ? (
            <View style={styles.offlineBanner}>
              <OfflineBadge />
            </View>
          ) : null}

          <View style={styles.form}>
            <Input
              autoCapitalize="none"
              editable={!isLoading}
              error={null}
              keyboardType="email-address"
              label="Email"
              onChangeText={setEmail}
              placeholder="Ej: gian@virtualpet.com"
              testID="login-email-input"
              value={email}
            />

            <Input
              editable={!isLoading}
              error={null}
              label="Contraseña"
              onChangeText={setPassword}
              placeholder="Tu contraseña"
              secureTextEntry
              testID="login-password-input"
              value={password}
            />

            {error ? <Text style={styles.formError}>{error}</Text> : null}

            <View style={styles.buttonWrapper}>
              <Button
                disabled={isSubmitDisabled}
                label="Ingresar"
                loading={isLoading}
                onPress={handleLogin}
                testID="login-submit-button"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing['24'],
    paddingVertical: spacing['48'],
  },
  header: {
    marginBottom: spacing['40'],
  },
  brand: {
    color: colors.ink,
    fontFamily: typography.family.sans,
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    lineHeight: typography.sizes['3xl'] * typography.lineHeights.tight,
    marginBottom: spacing['12'],
  },
  subtitle: {
    color: colors.muted,
    fontFamily: typography.family.sans,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.regular,
    lineHeight: typography.sizes.lg * typography.lineHeights.relaxed,
  },
  offlineBanner: {
    marginBottom: spacing['24'],
  },
  form: {
    width: '100%',
  },
  formError: {
    marginBottom: spacing['16'],
    color: colors.error,
    fontFamily: typography.family.sans,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
  },
  buttonWrapper: {
    marginTop: spacing['8'],
  },
});
