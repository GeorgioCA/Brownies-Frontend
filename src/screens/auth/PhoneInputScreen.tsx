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
import { AuthStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { colors, fontSize, fontWeight, spacing } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneInput'>;

const PHONE_MAX_LENGTH = 15;

export default function PhoneInputScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = useAuthStore((s) => s.sendOtp);

  const handleSendOtp = async () => {
    const trimmed = phone.trim();
    if (!trimmed) {
      Alert.alert('Missing phone', 'Please enter your phone number.');
      return;
    }
    if (trimmed.length < 10) {
      Alert.alert('Invalid phone', 'Please enter a valid phone number.');
      return;
    }

    setLoading(true);
    try {
      const otp = await sendOtp(trimmed);
      Alert.alert('OTP Sent', `Your OTP is: ${otp}`, [
        {
          text: 'OK',
          onPress: () => navigation.navigate('OtpVerify', { phone_number: trimmed }),
        },
      ]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to send OTP. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

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
        <Text style={styles.title}>Enter your phone number</Text>
        <Text style={styles.subtitle}>
          We'll send you a one-time verification code
        </Text>

        <Input
          value={phone}
          onChangeText={setPhone}
          placeholder="+919876543210"
          keyboardType="phone-pad"
          maxLength={PHONE_MAX_LENGTH}
          autoFocus
        />

        <Button
          title="Send OTP"
          onPress={handleSendOtp}
          loading={loading}
          disabled={loading}
        />

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <Text style={styles.loginLinkText}>
            Already have a password? <Text style={styles.loginLinkBold}>Log in</Text>
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
  loginLink: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  loginLinkText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loginLinkBold: {
    color: colors.primary,
    fontWeight: fontWeight.semiBold,
  },
});
