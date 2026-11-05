// Add Habit Page — Tambah Kebiasaan (PRD bagian 8.3)
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useHabits } from '../hooks/useHabits';
import type { HabitCategory } from '../types/habit';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { CategoryDropdown, HABIT_CATEGORIES } from '../components/CategoryDropdown';
import { HabitIconPicker } from '../components/HabitIconPicker';
import { colors, fonts, radius, HIT_SIZE } from '../theme';

export default function AddHabitScreen() {
  const { addHabit } = useHabits();

  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [category, setCategory] = useState<HabitCategory>('Kesehatan');
  const [icon, setIcon] = useState('droplet');
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  // Kategori dari dropdown berupa string; sempitkan ke HabitCategory tanpa cast.
  const handleCategoryChange = (value: string) => {
    const next = HABIT_CATEGORIES.find((item) => item === value);
    if (next) setCategory(next);
  };

  const handleSave = async () => {
    if (saving || saved) return; // cegah entri ganda saat ditekan berulang

    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Nama kebiasaan wajib diisi.');
      return;
    }

    setNameError(null);
    setFormError(null);
    setSaving(true);
    try {
      await addHabit({
        name: trimmed,
        target: target.trim() ? target.trim() : undefined,
        category,
        icon,
      });
      setSaved(true); // feedback singkat
      redirectTimer.current = setTimeout(() => router.replace('/(tabs)'), 700);
    } catch {
      setFormError('Gagal menyimpan kebiasaan. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Layar ini punya header sendiri; header bawaan Stack disembunyikan */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header: tombol kembali + judul */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          hitSlop={8}
        >
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Tambah Kebiasaan</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Nama (wajib) */}
          <View style={styles.field}>
            <Text style={styles.label}>Nama Kebiasaan *</Text>
            <TextInput
              style={[styles.input, nameError ? styles.inputError : null]}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (nameError) setNameError(null);
              }}
              placeholder="Contoh: Minum air putih"
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel="Nama kebiasaan"
              returnKeyType="done"
            />
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
          </View>

          {/* Target (opsional) */}
          <View style={styles.field}>
            <Text style={styles.label}>Target (opsional)</Text>
            <TextInput
              style={styles.input}
              value={target}
              onChangeText={setTarget}
              placeholder="Contoh: 8 gelas / 30 menit"
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel="Target kebiasaan"
              returnKeyType="done"
            />
          </View>

          {/* Kategori */}
          <View style={styles.field}>
            <Text style={styles.label}>Kategori</Text>
            <CategoryDropdown value={category} onChange={handleCategoryChange} />
          </View>

          {/* Pilih Ikon (opsional) */}
          <View style={styles.field}>
            <Text style={styles.label}>Pilih Ikon (opsional)</Text>
            <HabitIconPicker value={icon} onChange={setIcon} />
          </View>

          {/* Feedback sukses / gagal simpan */}
          {saved ? (
            <View style={styles.successBanner} accessibilityRole="alert">
              <Text style={styles.successText}>Kebiasaan berhasil ditambahkan.</Text>
            </View>
          ) : null}

          {formError ? (
            <Text style={styles.errorText} accessibilityRole="alert">
              {formError}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <PrimaryButton
              label="Simpan"
              onPress={handleSave}
              disabled={saving || saved}
              loading={saving}
            />
            <View style={styles.gap} />
            <SecondaryButton label="Kembali" onPress={goBack} disabled={saving} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
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
  field: {
    marginBottom: 18,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.error,
    marginTop: 6,
  },
  successBanner: {
    borderRadius: radius.button,
    backgroundColor: colors.softGreen,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  successText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.success,
    textAlign: 'center',
  },
  actions: {
    marginTop: 8,
  },
  gap: {
    height: 12,
  },
});
