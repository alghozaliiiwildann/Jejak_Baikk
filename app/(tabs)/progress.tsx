// Progress Page (PRD bagian 8.4)
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';
import { useHabits } from '../../hooks/useHabits';
import { useProgress } from '../../hooks/useProgress';
import { EmptyState } from '../../components/EmptyState';
import { ProgressCard } from '../../components/ProgressCard';
import { WeeklyBarChart } from '../../components/WeeklyBarChart';
import { colors, fonts, radius, shadow } from '../../theme';

export default function ProgressScreen() {
  const { loading, error } = useHabits();
  const { total, doneToday, todayPercent, last7Days, weeklyAverage } = useProgress();

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
        {/* Header: judul + ikon kalender dekoratif */}
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
          <View
            style={styles.calendarBox}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            <CalendarDays size={22} color={colors.textSecondary} />
          </View>
        </View>

        {total === 0 ? (
          <EmptyState
            title="Belum ada kebiasaan"
            description="Tambahkan kebiasaan untuk mulai melihat progres dan ringkasan 7 hari kamu."
            actionLabel="Tambah Kebiasaan"
            onAction={() => router.push('/add')}
          />
        ) : (
          <>
            {/* Kartu Penyelesaian Hari Ini */}
            <ProgressCard
              percent={todayPercent}
              done={doneToday}
              total={total}
              title="Penyelesaian Hari Ini"
              size="large"
            />

            {/* Ringkasan 7 Hari Terakhir */}
            <Text style={styles.sectionTitle}>Ringkasan 7 Hari Terakhir</Text>
            <WeeklyBarChart data={last7Days} />

            {/* Statistik */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{total}</Text>
                <Text style={styles.statLabel}>Total Kebiasaan</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{doneToday}</Text>
                <Text style={styles.statLabel}>Selesai Hari Ini</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{weeklyAverage}%</Text>
                <Text style={styles.statLabel}>Rata-rata Minggu Ini</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
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
    paddingBottom: 40,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.text,
  },
  calendarBox: {
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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 6,
    ...shadow.card,
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.primary,
    marginBottom: 6,
  },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
