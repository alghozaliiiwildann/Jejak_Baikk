
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme';

interface WeeklyBarChartProps {
  data: {
    date: string;
    dayLabel: string;
    percent: number;
  }[];
}

export const WeeklyBarChart = ({ data }: WeeklyBarChartProps) => {
  if (data.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>
          Belum ada data progres minggu ini.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel="Grafik penyelesaian tujuh hari terakhir"
    >
      {data.map((day) => {
        const percent = Math.max(
          0,
          Math.min(100, Math.round(day.percent))
        );

        return (
          <View key={day.date} style={styles.column}>
            <Text style={styles.percentLabel}>{percent}%</Text>

            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { height: `${percent}%` },
                ]}
              />
            </View>

            <Text style={styles.dayLabel}>{day.dayLabel}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 10,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    minHeight: 120,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  percentLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  barTrack: {
    width: 18,
    height: 120,
    justifyContent: 'flex-end',
    borderRadius: radius.button,
    backgroundColor: colors.softGreen,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderTopLeftRadius: radius.button,
    borderTopRightRadius: radius.button,
    backgroundColor: colors.primary,
  },
  dayLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.text,
    marginTop: 8,
  },
});
