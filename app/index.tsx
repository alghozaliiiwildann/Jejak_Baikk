// Splash / Loading Screen (PRD bagian 8.1)
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Leaf } from 'lucide-react-native';
import { useHabits } from '../hooks/useHabits';
import { colors, fonts, radius } from '../theme';

const LOAD_TIMEOUT_MS = 10000;

export default function SplashScreen() {
  const { loading, error, retry } = useHabits();
  const finishedRef = useRef(false);

  // Mulai membaca data lokal saat splash tampil (sekali saja saat mount)
  useEffect(() => {
    retry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Berhasil membaca data -> lanjut ke Home
  useEffect(() => {
    if (!loading && !error && !finishedRef.current) {
      finishedRef.current = true;
      const timer = setTimeout(() => router.replace('/(tabs)'), 400);
      return () => clearTimeout(timer);
    }
  }, [loading, error]);

  // Gagal membaca data -> tampilkan layar Error
  useEffect(() => {
    if (error && !finishedRef.current) {
      finishedRef.current = true;
      router.replace('/error');
    }
  }, [error]);

  // Jangan biarkan loading tanpa batas (PRD bagian 8.1)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!finishedRef.current) {
        finishedRef.current = true;
        router.replace('/error');
      }
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.logo} accessibilityElementsHidden importantForAccessibility="no">
          <Leaf size={26} color={colors.success} strokeWidth={2.2} style={styles.leafLeft} />
          <Leaf size={44} color={colors.primary} strokeWidth={2} />
          <Leaf size={26} color={colors.secondary} strokeWidth={2.2} style={styles.leafRight} />
        </View>

        <Text style={styles.wordmark}>JejakBaik</Text>
        <Text style={styles.tagline}>Catat Kebiasaanmu, Lihat Perkembanganmu.</Text>

        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>

        {/* Dekorasi daun transparan di sudut bawah */}
        <View style={styles.decor} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no">
          <Leaf size={120} color={colors.secondary} strokeWidth={1.2} style={styles.decorLeafLeft} />
          <Leaf size={90} color={colors.secondary} strokeWidth={1.2} style={styles.decorLeafRight} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.splashBackground,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  leafLeft: {
    transform: [{ rotate: '-35deg' }],
    marginRight: 2,
  },
  leafRight: {
    transform: [{ rotate: '35deg' }],
    marginLeft: 2,
  },
  wordmark: {
    fontFamily: fonts.bold,
    fontSize: 30,
    color: colors.text,
    marginBottom: 8,
  },
  tagline: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.chip,
    backgroundColor: colors.softGreen,
  },
  loadingText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.success,
  },
  decor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorLeafLeft: {
    position: 'absolute',
    bottom: -24,
    left: -28,
    opacity: 0.35,
    transform: [{ rotate: '25deg' }],
  },
  decorLeafRight: {
    position: 'absolute',
    bottom: -18,
    right: -22,
    opacity: 0.3,
    transform: [{ rotate: '-20deg' }],
  },
});
