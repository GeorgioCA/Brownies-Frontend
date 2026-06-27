import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, shadow } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'flat';
  padding?: number;
}

export function Card({ children, style, variant = 'elevated', padding }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        variant === 'elevated' && shadow.sm,
        variant === 'outlined' && styles.outlined,
        variant === 'flat' && styles.flat,
        padding !== undefined ? { padding } : styles.defaultPadding,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
  },
  defaultPadding: { padding: 16 },
  outlined: { borderWidth: 1, borderColor: colors.border },
  flat: { backgroundColor: colors.surfaceAlt },
});
