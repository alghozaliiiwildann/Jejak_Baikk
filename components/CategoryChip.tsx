
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, radius } from '../theme';

interface CategoryChipProps {
  category: string;
  selected?: boolean;
  onPress?: () => void;
}

export const CategoryChip = ({
  category,
  selected = false,
  onPress,
}: CategoryChipProps) => {
  return (
    <Pressable
      style={[styles.chip, selected && styles.selectedChip]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Kategori: ${category}`}
    >
      <Text
        style={[styles.chipText, selected && styles.selectedChipText]}
      >
        {category}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.chip,
    backgroundColor: colors.chip.backgroundColor,
    borderWidth: 1,
    borderColor: colors.chip.borderColor,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 88,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    color: colors.chipTextColor,
    fontFamily: fonts.medium,
    fontSize: 12,
    textAlign: 'center',
  },
  selectedChip: {
    backgroundColor: colors.selectedChip.backgroundColor,
    borderColor: colors.selectedChip.borderColor,
  },
  selectedChipText: {
    color: colors.selectedChipTextColor,
  },
});
