import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Sprout } from 'lucide-react-native';
import { PrimaryButton } from './PrimaryButton';
import { colors, fonts, radius } from '../theme';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({
  title = 'Belum ada kebiasaan',
  description = 'Mulai bangun kebiasaan baik dari sekarang.',
  actionLabel,
  onAction,
}: EmptyStateProps) => {
  return (
    <View style={styles.container} accessibilityRole="none">
      <View style={styles.iconBox}>
        <Sprout size={40} color={colors.primary} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <PrimaryButton label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: radius.chip,
    backgroundColor: colors.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  action: {
    marginTop: 20,
    alignSelf: 'stretch',
  },
});