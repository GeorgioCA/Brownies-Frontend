import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors, radius, fontSize, fontWeight, spacing, shadow } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = true,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white} size="small" />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`], styles[`text_${size}`], textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fullWidth: { width: '100%' },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surfaceAlt },
  outline: { backgroundColor: colors.transparent, borderWidth: 1.5, borderColor: colors.primary },
  ghost: { backgroundColor: colors.transparent },
  danger: { backgroundColor: colors.error },
  size_sm: { paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md },
  size_md: { paddingVertical: spacing.sm + 4, paddingHorizontal: spacing.lg },
  size_lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  disabled: { opacity: 0.5 },
  text: { fontWeight: fontWeight.semiBold },
  text_primary: { color: colors.white, fontSize: fontSize.md },
  text_secondary: { color: colors.primary, fontSize: fontSize.md },
  text_outline: { color: colors.primary, fontSize: fontSize.md },
  text_ghost: { color: colors.primary, fontSize: fontSize.md },
  text_danger: { color: colors.white, fontSize: fontSize.md },
  text_sm: { fontSize: fontSize.sm },
  text_md: { fontSize: fontSize.md },
  text_lg: { fontSize: fontSize.lg },
});
