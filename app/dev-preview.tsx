/* HAPUS SEBELUM RILIS */
import React from 'react';
import { Alert, SafeAreaView, StyleSheet, ScrollView, StatusBar, Text, View } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { CategoryChip } from '../components/CategoryChip';
import { ProgressBar } from '../components/ProgressBar';
import { CircularProgress } from '../components/CircularProgress';
import { HabitCard } from '../components/HabitCard';
import { ProgressCard } from '../components/ProgressCard';
import { HabitIconPicker } from '../components/HabitIconPicker';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog';
import { WeeklyBarChart } from '../components/WeeklyBarChart';
import { CategoryDropdown } from '../components/CategoryDropdown';

export default function DevPreview() {
  const [chipSelected, setChipSelected] = React.useState(false);
  const [progressPercent, setProgressPercent] = React.useState(75);
  const [circularPercent, setCircularPercent] = React.useState(50);
  const [habitDoneToday, setHabitDoneToday] = React.useState(true);
  const [emptyStateType, setEmptyStateType] = React.useState<'normal' | 'loading' | 'error'>('normal');
  const errorRetry = () => Alert.alert('Coba lagi');
  const [confirmDeleteVisible, setConfirmDeleteVisible] = React.useState(false);
  const [weeklyData, setWeeklyData] = React.useState<{ date: string; dayLabel: string; percent: number }[]>([
    { date: '2026-10-20', dayLabel: 'Min', percent: 20 },
    { date: '2026-10-21', dayLabel: 'Sen', percent: 40 },
    { date: '2026-10-22', dayLabel: 'Sel', percent: 60 },
    { date: '2026-10-23', dayLabel: 'Rab', percent: 80 },
    { date: '2026-10-24', dayLabel: 'Kam', percent: 30 },
    { date: '2026-10-25', dayLabel: 'Jum', percent: 10 },
    { date: '2026-10-26', dayLabel: 'Sab', percent: 50 },
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>📍 PrimaryButton</Text>
        <PrimaryButton label="Tombol Utama" onPress={() => Alert.alert('Ditekan')} disabled={false} loading={false} />

        <Text style={styles.sectionTitle}>📍 SecondaryButton</Text>
        <SecondaryButton label="Tombol Sekunder" onPress={() => Alert.alert('Ditekan')} disabled={false} />

        <Text style={styles.sectionTitle}>📍 CategoryChip (normal)</Text>
        <CategoryChip category="Kesehatan" selected={chipSelected} onPress={() => setChipSelected(!chipSelected)} />

        <Text style={styles.sectionTitle}>📍 CategoryChip (selected)</Text>
        <CategoryChip category="Produktivitas" selected={true} onPress={() => setChipSelected(!chipSelected)} />

        <Text style={styles.sectionTitle}>📍 ProgressBar</Text>
        <ProgressBar percent={progressPercent} />

        <Text style={styles.sectionTitle}>📍 CircularProgress</Text>
        <CircularProgress percent={circularPercent} size={128} />

        <Text style={styles.sectionTitle}>📍 HabitCard (doneToday)</Text>
        <HabitCard
          habit={{
            id: '1',
            name: 'Minum Air',
            icon: 'water',
            target: 8,
          }}
          doneToday={true}
          onToggle={() => setHabitDoneToday(!habitDoneToday)}
          onPress={() => Alert.alert('HabitCard press')}
        />

        <Text style={styles.sectionTitle}>📍 HabitCard (not done)</Text>
        <HabitCard
          habit={{
            id: '2',
            name: 'Olahraga',
            icon: 'dumbbell',
          }}
          doneToday={false}
          onToggle={() => setHabitDoneToday(!habitDoneToday)}
          onPress={() => Alert.alert('HabitCard press')}
        />

        <Text style={styles.sectionTitle}>📍 ProgressCard (default)</Text>
        <ProgressCard percent={60} done={3} total={5} title="Hari Ini" size="default" />

        <Text style={styles.sectionTitle}>📍 ProgressCard (large)</Text>
        <ProgressCard percent={80} done={4} total={5} title="Minggu Ini" size="large" />

        <Text style={styles.sectionTitle}>📍 HabitIconPicker</Text>
        <HabitIconPicker value="produktivitas" onChange={(val) => console.log('Pilih ikon:', val)} />

        <Text style={styles.sectionTitle}>📍 EmptyState (normal)</Text>
        <EmptyState
          title="Belum ada kebiasaan"
          description="Tambah kebiasaan pertama Anda untuk memulai"
          actionLabel="Tambah"
          onAction={() => Alert.alert('Fungsi tambah')}
        />

        <Text style={styles.sectionTitle}>📍 EmptyState (error)</Text>
        <EmptyState
          title="Error"
          description="Gagal memuat data lokal"
          actionLabel="Coba Lagi"
          onAction={() => errorRetry()}
        />

        <Text style={styles.sectionTitle}>📍 ErrorState</Text>
        <ErrorState onRetry={errorRetry} onBack={() => Alert.alert('Kembali home')} />

        <Text style={styles.sectionTitle}>📍 ConfirmDeleteDialog</Text>
        <ConfirmDeleteDialog
          visible={confirmDeleteVisible}
          habitName="Minum Air"
          onConfirm={() => Alert.alert('Kebiasaan dihapus')}
          onCancel={() => setConfirmDeleteVisible(false)}
        />

        <Text style={styles.sectionTitle}>📍 WeeklyBarChart</Text>
        <WeeklyBarChart data={weeklyData} />

        <Text style={styles.sectionTitle}>📍 CategoryDropdown</Text>
        <CategoryDropdown value="Kesehatan" onChange={(val) => console.log('Kategori:', val)} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 20,
    gap: 24,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 8,
  },
});