
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '../theme';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export const SecondaryButton = ({
  label,
  onPress,
  disabled = false,
}: SecondaryButtonProps) => {
  return (
    <Pressable
      style={[styles.button, disabled && styles.buttonDisabled]}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 16,
    textAlign: 'center',
  },
});
