
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme';
import { HabitIcon } from './HabitIcon';

const HABIT_ICON_OPTIONS = [
  { value: 'droplet', label: 'Air' },
  { value: 'dumbbell', label: 'Olahraga' },
  { value: 'book-open', label: 'Membaca' },
  { value: 'code', label: 'Coding' },
  { value: 'leaf', label: 'Alam' },
  { value: 'heart', label: 'Kesehatan' },
  { value: 'smile', label: 'Bahagia' },
  { value: 'star', label: 'Lainnya' },
] as const;

interface HabitIconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export const HabitIconPicker = ({ value, onChange }: HabitIconPickerProps) => {
  return (
    <View style={styles.grid}>
      {HABIT_ICON_OPTIONS.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.tile, selected && styles.tileSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`Pilih ikon ${option.label}`}
          >
            <HabitIcon
              name={option.value}
              size={22}
              color={selected ? colors.primary : colors.textSecondary}
            />

            <Text
              style={[styles.label, selected && styles.labelSelected]}
              numberOfLines={1}
            >
              {option.label}
            </Text>

            {selected && (
              <Text style={styles.selectedIndicator}>Terpilih</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    width: '22%',
    minWidth: 64,
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  tileSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.softGreen,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 6,
  },
  labelSelected: {
    color: colors.success,
    fontFamily: fonts.medium,
  },
  selectedIndicator: {
    fontFamily: fonts.medium,
    fontSize: 9,
    color: colors.success,
    marginTop: 3,
  },
});
