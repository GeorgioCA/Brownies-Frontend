import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { colors, fontSize, fontWeight, spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const SPLASH_TIMEOUT_MS = 2000;

export default function SplashScreen({ navigation }: Props) {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const profileComplete = useAuthStore((s) => s.profileComplete);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const init = async () => {
      await restoreSession();
      timeoutId = setTimeout(() => {
        const state = useAuthStore.getState();
        if (state.isAuthenticated && state.profileComplete) {
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
        }
      }, SPLASH_TIMEOUT_MS);
    };

    init();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const showLoader = isLoading;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.content}>
        <Text style={styles.logo}>Brownies</Text>
        <Text style={styles.tagline}>Sweet connections start here</Text>
      </View>
      {showLoader && (
        <View style={styles.loaderContainer}>
          <LoadingSpinner message="Loading..." />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  logo: {
    fontSize: fontSize.xxxl + 8,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  loaderContainer: {
    position: 'absolute',
    bottom: spacing.xxl + spacing.xl,
  },
});
