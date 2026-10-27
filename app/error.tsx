// Error / Retry State (PRD bagian 8.6)
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useHabits } from '../hooks/useHabits';
import { ErrorState } from '../components/ErrorState';
import { colors, fonts } from '../theme';

export default function ErrorScreen() {
  const { loading, error, retry } = useHabits();
  const [retrying, setRetrying] = useState(false);
  const triedRef = useRef(false);

  // Setelah retry berhasil (error hilang), kembali ke Home
  useEffect(() => {
    if (triedRef.current && !loading && !error) {
      router.replace('/(tabs)');
    }
  }, [loading, error]);

  const handleRetry = async () => {
    if (retrying) return;
    setRetrying(true);
    triedRef.current = true;
    try {
      // Mengulang proses baca data; tidak menghapus/menimpa data lokal
      await retry();
    } finally {
      setRetrying(false);
    }
  };

  const handleBack = () => router.replace('/(tabs)');

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ErrorState onRetry={handleRetry} onBack={handleBack} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
