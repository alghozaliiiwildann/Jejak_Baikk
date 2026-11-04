
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import type { HabitCategory } from '../types/habit';
import { colors, fonts, radius, shadow } from '../theme';

export const HABIT_CATEGORIES: HabitCategory[] = [
  'Kesehatan',
  'Produktivitas',
  'Pendidikan',
  'Hiburan',
  'Self Care',
  'Lainnya',
];

interface CategoryDropdownProps {
  value: HabitCategory;
  onChange: (category: HabitCategory) => void;
}

export const CategoryDropdown = ({
  value,
  onChange,
}: CategoryDropdownProps) => {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <Pressable
        style={styles.trigger}
        onPress={() => setOpen((prev) => !prev)}
        accessibilityRole="button"
        accessibilityLabel={`Kategori saat ini: ${value}`}
        accessibilityState={{ expanded: open }}
      >
        <Text style={styles.triggerText}>{value}</Text>

        <ChevronDown
          size={20}
          color={colors.textSecondary}
          style={open ? styles.chevronUp : undefined}
        />
      </Pressable>

      {open && (
        <View style={styles.list}>
          {HABIT_CATEGORIES.map((category) => {
            const selected = category === value;

            return (
              <Pressable
                key={category}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => {
                  onChange(category);
                  setOpen(false);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Pilih kategori ${category}`}
                accessibilityState={{ selected }}
              >
                <Text
                  style={[
                    styles.optionText,
                    selected && styles.optionTextSelected,
                  ]}
                >
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    zIndex: 10,
  },
  trigger: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  triggerText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  chevronUp: {
    transform: [{ rotate: '180deg' }],
  },
  list: {
    marginTop: 6,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: 'hidden',
    ...shadow.card,
  },
  option: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.softGreen,
  },
  optionText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  optionTextSelected: {
    fontFamily: fonts.semibold,
    color: colors.success,
  },
});
