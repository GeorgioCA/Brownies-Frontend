import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
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

type Props = NativeStackScreenProps<AuthStackParamList, 'SetPassword'>;

const PASSWORD_MIN_LENGTH = 6;

export default function SetPasswordScreen({ route }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  const setPasswordApi = useAuthStore((s) => s.setPassword);

  const validate = (): boolean => {
    const next: { password?: string; confirm?: string } = {};
    if (password.length < PASSWORD_MIN_LENGTH) {
      next.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    }
    if (password && confirmPassword && password !== confirmPassword) {
      next.confirm = 'Passwords do not match.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSetPassword = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await setPasswordApi(password);
      Alert.alert('Success', 'Password set successfully.', [
        {
          text: 'Continue',
          onPress: () =>
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            }),
        },
      ]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to set password. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = !password || !confirmPassword || loading;

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
        <Text style={styles.title}>Set your password</Text>
        <Text style={styles.subtitle}>
          You'll use this password to log in on other devices
        </Text>

        <Input
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
          }}
          placeholder="Enter password"
          secureTextEntry
          error={errors.password}
          autoFocus
        />

        <Input
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (errors.confirm) setErrors((e) => ({ ...e, confirm: undefined }));
          }}
          placeholder="Confirm password"
          secureTextEntry
          error={errors.confirm}
          returnKeyType="go"
          onSubmitEditing={handleSetPassword}
        />

        <Button
          title="Set Password"
          onPress={handleSetPassword}
          loading={loading}
          disabled={isDisabled}
        />
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
});
