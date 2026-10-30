// Detail Habit Page — Detail Kebiasaan (PRD bagian 8.5)
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, ChevronLeft, Trash } from 'lucide-react-native';
import { useHabits } from '../../hooks/useHabits';
import { PrimaryButton } from '../../components/PrimaryButton';
import { CategoryChip } from '../../components/CategoryChip';
import { ConfirmDeleteDialog } from '../../components/ConfirmDeleteDialog';
import { EmptyState } from '../../components/EmptyState';
import { HabitIcon } from '../../components/HabitIcon';
import {
  formatTanggalIndonesia,
  getTodayLocal,
} from '../../utils/date';
import { colors, fonts, radius, shadow, HIT_SIZE } from '../../theme';

export default function DetailHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getHabit, toggleToday, deleteHabit } = useHabits();
  const [confirmVisible, setConfirmVisible] = useState(false);

  const habit = getHabit(id ?? '');

  const goHome = () => router.replace('/(tabs)');

  if (!habit) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={goHome}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            hitSlop={8}
          >
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Detail Kebiasaan</Text>
          <View style={styles.headerSpacer} />
        </View>
        <EmptyState
          title="Kebiasaan tidak ditemukan"
          description="Kebiasaan yang kamu cari sudah dihapus atau tidak tersedia."
          actionLabel="Kembali ke Home"
          onAction={goHome}
        />
      </SafeAreaView>
    );
  }

  const today = getTodayLocal();
  const doneToday = habit.completions.includes(today);
  const history = [...habit.completions].sort((a, b) => (a < b ? 1 : -1));

  const handleConfirmDelete = async () => {
    setConfirmVisible(false);
    await deleteHabit(habit.id);
    goHome();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header: tombol kembali + judul */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => (router.canGoBack() ? router.back() : goHome())}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          hitSlop={8}
        >
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Detail Kebiasaan</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Ikon, nama, target, chip kategori */}
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <HabitIcon name={habit.icon} size={30} color={colors.primary} />
          </View>
          <Text style={styles.habitName}>{habit.name}</Text>
          {habit.target ? (
            <Text style={styles.target}>Target: {habit.target}</Text>
          ) : null}
          <View style={styles.chipRow}>
            <CategoryChip category={habit.category} />
          </View>
        </View>

        {/* Status selesai hari ini */}
        <View style={styles.card}>
          <Text style={styles.todayDate}>
            Tanggal hari ini: {formatTanggalIndonesia(getTodayLocal())}
          </Text>

          {doneToday ? (
            <View style={styles.doneStatus} accessibilityRole="alert">
              <Check size={16} color={colors.success} strokeWidth={3} />
              <Text style={styles.doneStatusText}>Sudah selesai hari ini</Text>
            </View>
          ) : null}

          <View style={styles.toggleWrap}>
            <PrimaryButton
              label={doneToday ? 'Batalkan Penyelesaian' : 'Selesai hari ini'}
              onPress={() => toggleToday(habit.id)}
            />
          </View>
        </View>

        {/* Riwayat */}
        <Text style={styles.sectionTitle}>Riwayat</Text>
        <View style={styles.card}>
          {history.length === 0 ? (
            <Text style={styles.emptyHistory}>Belum ada riwayat.</Text>
          ) : (
            history.map((date) => (
              <View key={date} style={styles.historyRow}>
                <View style={styles.historyCheck}>
                  <Check size={14} color={colors.success} strokeWidth={3} />
                </View>
                <Text style={styles.historyText}>{formatTanggalIndonesia(date)}</Text>
              </View>
            ))
          )}
        </View>

        {/* Hapus kebiasaan (latar merah muda lembut) */}
        <Pressable
          style={({ pressed }) => [styles.deleteButton, pressed && styles.deletePressed]}
          onPress={() => setConfirmVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`Hapus kebiasaan ${habit.name}`}
        >
          <Trash size={18} color={colors.error} />
          <Text style={styles.deleteText}>Hapus Kebiasaan</Text>
        </Pressable>
      </ScrollView>

      <ConfirmDeleteDialog
        visible={confirmVisible}
        habitName={habit.name}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.background,
  },
  backButton: {
    width: HIT_SIZE,
    height: HIT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.text,
    textAlign: 'center',
  },
  headerSpacer: {
    width: HIT_SIZE,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
    ...shadow.card,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  habitName: {
    fontFamily: fonts.semibold,
    fontSize: 20,
    color: colors.text,
  },
  target: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  todayDate: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  doneStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.softGreen,
    borderRadius: radius.button,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  doneStatusText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.success,
  },
  toggleWrap: {
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.text,
    marginBottom: 12,
  },
  emptyHistory: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  deleteButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.button,
    backgroundColor: colors.errorSoft,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 12,
    marginTop: 8,
  },
  deletePressed: {
    opacity: 0.85,
  },
  deleteText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.error,
  },
});
