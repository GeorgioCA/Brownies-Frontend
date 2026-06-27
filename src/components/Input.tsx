import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, radius, fontSize, fontWeight, spacing } from '../theme';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  maxLength?: number;
  autoFocus?: boolean;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  prefix?: string;
  style?: ViewStyle;
  inputStyle?: ViewStyle;
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'next' | 'go';
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  secureTextEntry,
  keyboardType = 'default',
  maxLength,
  autoFocus,
  editable = true,
  multiline = false,
  numberOfLines = 1,
  prefix,
  style,
  inputStyle,
  onSubmitEditing,
  returnKeyType,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.focused,
          error ? styles.errorBorder : null,
          !editable && styles.disabled,
          multiline && styles.multiline,
        ]}
      >
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          style={[styles.input, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoFocus={autoFocus}
          editable={editable}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: spacing.md },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
  },
  focused: { borderColor: colors.primary },
  errorBorder: { borderColor: colors.error },
  disabled: { backgroundColor: colors.surfaceAlt, opacity: 0.7 },
  multiline: { alignItems: 'flex-start', minHeight: 100 },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: spacing.sm + 4,
  },
  prefix: { fontSize: fontSize.md, color: colors.textSecondary, marginRight: spacing.xs, fontWeight: fontWeight.medium },
  eyeButton: { padding: spacing.xs },
  eyeIcon: { fontSize: 18 },
  error: { color: colors.error, fontSize: fontSize.xs, marginTop: spacing.xs },
});
