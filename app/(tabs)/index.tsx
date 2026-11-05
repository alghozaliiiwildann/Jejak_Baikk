// Home Page (PRD bagian 8.2)
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Bell, Plus } from 'lucide-react-native';
import { useHabits } from '../../hooks/useHabits';
import { useProgress } from '../../hooks/useProgress';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { HabitCard } from '../../components/HabitCard';
import { ProgressCard } from '../../components/ProgressCard';
import {
  formatTanggalIndonesia,
  getGreeting,
  getTodayLocal,
} from '../../utils/date';
import { colors, fonts, shadow, HIT_SIZE } from '../../theme';

export default function HomeScreen() {
  const { habits, loading, error, retry, toggleToday } = useHabits();
  const { todayPercent, doneToday, total } = useProgress();
  const [actionError, setActionError] = useState<string | null>(null);

  const today = getTodayLocal();

  const handleToggle = async (id: string) => {
    setActionError(null);
    try {
      await toggleToday(id);
    } catch {
      setActionError('Gagal memperbarui kebiasaan. Silakan coba lagi.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.stateWrap}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.stateWrap}>
          <ErrorState onRetry={retry} onBack={() => router.replace('/error')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Header: sapaan, tanggal, ikon lonceng dekoratif */}
            <View style={styles.header}>
              <View style={styles.headerTexts}>
                <Text style={styles.greeting}>Selamat {getGreeting()}!</Text>
                <Text style={styles.date}>{formatTanggalIndonesia(today)}</Text>
              </View>
              <View
                style={styles.bellBox}
                accessibilityElementsHidden
                importantForAccessibility="no"
              >
                <Bell size={22} color={colors.textSecondary} />
              </View>
            </View>

            {/* Kartu Progres Hari Ini */}
            <ProgressCard percent={todayPercent} done={doneToday} total={total} />

            {/* Daftar Kebiasaan */}
            <Text style={styles.sectionTitle}>Daftar Kebiasaan</Text>

            {actionError ? (
              <Text style={styles.actionError} accessibilityRole="alert">
                {actionError}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="Belum ada kebiasaan"
            description="Mulai bangun rutinitas positifmu dengan menambahkan kebiasaan pertama."
            actionLabel="Tambah Kebiasaan"
            onAction={() => router.push('/add')}
          />
        }
        renderItem={({ item }) => (
          <HabitCard
            habit={item}
            doneToday={item.completions.includes(today)}
            onToggle={() => handleToggle(item.id)}
            onPress={() => router.push({ pathname: '/habit/[id]', params: { id: item.id } })}
          />
        )}
      />

      {/* Tombol bulat + membuka Tambah Kebiasaan */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push('/add')}
        accessibilityRole="button"
        accessibilityLabel="Tambah kebiasaan"
        hitSlop={8}
      >
        <Plus size={28} color="#FFFFFF" strokeWidth={2.6} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 110,
  },
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTexts: {
    flex: 1,
    marginRight: 12,
  },
  greeting: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.text,
  },
  date: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  bellBox: {
    width: HIT_SIZE,
    height: HIT_SIZE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.text,
    marginTop: 24,
    marginBottom: 14,
  },
  actionError: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.error,
    marginBottom: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
});
