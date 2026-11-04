
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

interface ProgressBarProps {
  percent: number;
}

export const ProgressBar = ({ percent }: ProgressBarProps) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: clamped,
      }}
    >
      <View style={styles.barBackground}>
        <View
          style={[
            styles.barFill,
            { width: `${clamped}%` },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  barBackground: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border,
    borderRadius: radius.chip,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.chip,
  },
});
