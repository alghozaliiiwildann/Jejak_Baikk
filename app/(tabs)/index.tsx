// Home Page (PRD bagian 8.2)
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
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
import { HabitCard } from '../../components/HabitCard';
import { ProgressCard } from '../../components/ProgressCard';
import { formatTanggalIndonesia, getGreeting, getTodayLocal } from '../../utils/date';
import { colors, fonts, shadow } from '../../theme';

export default function HomeScreen() {
  const { habits, loading, error, toggleToday } = useHabits();
  const { todayPercent, doneToday, total } = useProgress();
  const today = getTodayLocal();

  // Jika pembacaan data gagal, arahkan ke layar Error (PRD bagian 8.6)
  useEffect(() => {
    if (error) {
      router.replace('/error');
    }
  }, [error]);

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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: sapaan, subteks, tanggal, ikon lonceng dekoratif */}
        <View style={styles.header}>
          <View style={styles.headerTexts}>
            <Text style={styles.greeting}>Hai, Arief 👋</Text>
            <Text style={styles.subGreeting}>{'Selamat ' + getGreeting() + '!'}</Text>
            <Text style={styles.date}>{formatTanggalIndonesia(getTodayLocal())}</Text>
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

        {habits.length === 0 ? (
          <EmptyState
            title="Belum ada kebiasaan"
            description="Mulai bangun rutinitas positifmu dengan menambahkan kebiasaan pertama."
            actionLabel="Tambah Kebiasaan"
            onAction={() => router.push('/add')}
          />
        ) : (
          habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={{ id: habit.id, name: habit.name, icon: habit.icon }}
              doneToday={habit.completions.includes(today)}
              onToggle={() => toggleToday(habit.id)}
              onPress={() =>
                router.push({ pathname: '/habit/[id]', params: { id: habit.id } })
              }
            />
          ))
        )}
      </ScrollView>

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
  subGreeting: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  date: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },
  bellBox: {
    width: 44,
    height: 44,
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
