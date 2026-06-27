import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList, RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { colors, fontSize, fontWeight, spacing } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const PHONE_MAX_LENGTH = 15;

export default function LoginScreen({ navigation: authNavigation }: Props) {
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    const trimmed = phone.trim();
    if (!trimmed) {
      Alert.alert('Missing phone', 'Please enter your phone number.');
      return;
    }
    if (trimmed.length < 10) {
      Alert.alert('Invalid phone', 'Please enter a valid phone number.');
      return;
    }
    if (!password) {
      Alert.alert('Missing password', 'Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await login(trimmed, password);
      rootNavigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Login failed. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = !phone.trim() || !password || loading;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to find your sweet connection</Text>

        <Input
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone (e.g. +919999912345 or 0000000000)"
          keyboardType="phone-pad"
          maxLength={PHONE_MAX_LENGTH}
          autoFocus
        />

        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="Enter password"
          secureTextEntry
          returnKeyType="go"
          onSubmitEditing={handleLogin}
        />

        <Button
          title="Log In"
          onPress={handleLogin}
          loading={loading}
          disabled={isDisabled}
        />

        <TouchableOpacity
          style={styles.linkContainer}
          onPress={() => authNavigation.goBack()}
        >
          <Text style={styles.linkText}>
            New user?{' '}
            <Text style={styles.linkHighlight}>Sign up with OTP</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl + spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  linkContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  linkText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  linkHighlight: {
    color: colors.primary,
    fontWeight: fontWeight.semiBold,
  },
});
