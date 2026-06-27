import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { colors, fontSize, fontWeight, spacing, radius } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerify'>;

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SEC = 30;

export default function OtpVerifyScreen({ route }: Props) {
  const { phone_number } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const sendOtp = useAuthStore((s) => s.sendOtp);

  const otp = otpDigits.join('');

  const handleDigitChange = useCallback(
    (text: string, index: number) => {
      const digit = text.slice(-1);
      if (!/^\d?$/.test(digit)) return;

      const updated = [...otpDigits];
      updated[index] = digit;
      setOtpDigits(updated);

      if (digit && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otpDigits],
  );

  const handleKeyPress = useCallback(
    (key: string, index: number) => {
      if (key === 'Backspace' && !otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [otpDigits],
  );

  const handleVerify = async () => {
    if (otp.length < OTP_LENGTH) {
      Alert.alert('Incomplete OTP', 'Please enter all 6 digits.');
      return;
    }

    setLoading(true);
    try {
      const profileComplete = await verifyOtp(phone_number, otp);
      if (profileComplete) {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Verification failed. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendLoading(true);
    try {
      const newOtp = await sendOtp(phone_number);
      Alert.alert('OTP Resent', `Your new OTP is: ${newOtp}`);
      setResendCooldown(RESEND_COOLDOWN_SEC);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to resend OTP.';
      Alert.alert('Error', message);
    } finally {
      setResendLoading(false);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner fullScreen message="Verifying OTP..." />
    );
  }

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
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Code sent to{' '}
          <Text style={styles.phoneHighlight}>+91 {phone_number}</Text>
        </Text>

        <View style={styles.otpRow}>
          {otpDigits.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
              value={digit}
              onChangeText={(text) => handleDigitChange(text, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={1}
              caretHidden
              selectTextOnFocus
            />
          ))}
        </View>

        <View style={styles.buttonRow}>
          <Button
            title="Verify"
            onPress={handleVerify}
            loading={loading}
            disabled={loading || otp.length < OTP_LENGTH}
          />
        </View>

        <TouchableOpacity
          onPress={handleResend}
          disabled={resendCooldown > 0 || resendLoading}
          style={styles.resendContainer}
        >
          {resendLoading ? (
            <LoadingSpinner message="" />
          ) : (
            <Text
              style={[
                styles.resendText,
                resendCooldown > 0 && styles.resendDisabled,
              ]}
            >
              {resendCooldown > 0
                ? `Resend OTP in ${resendCooldown}s`
                : 'Resend OTP'}
            </Text>
          )}
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
  phoneHighlight: {
    color: colors.text,
    fontWeight: fontWeight.semiBold,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    textAlign: 'center',
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  otpBoxFilled: {
    borderColor: colors.primary,
  },
  buttonRow: {
    width: '100%',
  },
  resendContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  resendText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.semiBold,
  },
  resendDisabled: {
    color: colors.textLight,
  },
});
