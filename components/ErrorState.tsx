import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CircleAlert } from 'lucide-react-native';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';
import { colors, fonts, radius } from '../theme';

interface ErrorStateProps {
  onRetry: () => void;
  onBack: () => void;
}

export const ErrorState = ({ onRetry, onBack }: ErrorStateProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <CircleAlert size={40} color={colors.error} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>Gagal memuat data</Text>
      <Text style={styles.description}>
        Terjadi kesalahan saat membaca data lokal. Silakan coba lagi.
      </Text>
      <View style={styles.actions}>
        <PrimaryButton label="Coba Lagi" onPress={onRetry} />
        <View style={styles.gap} />
        <SecondaryButton label="Kembali ke Home" onPress={onBack} />
      </View>
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
    backgroundColor: colors.errorSoft,
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
  actions: {
    marginTop: 24,
    alignSelf: 'stretch',
  },
  gap: {
    height: 12,
  },
});