
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts } from '../theme';

interface CircularProgressProps {
  percent: number;
  size?: number;
}

export const CircularProgress = ({
  percent,
  size = 128,
}: CircularProgressProps) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));

  const strokeWidth = 16;
  const radiusVal = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusVal;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size },
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: clamped,
      }}
    >
      <Svg width={size} height={size} style={styles.svg}>
        {/* Track atau lingkaran latar */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusVal}
          fill="none"
          stroke={colors.border}
          strokeWidth={strokeWidth}
        />

        {/* Fill atau progres */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusVal}
          fill="none"
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <Text style={styles.percentText}>{clamped}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  percentText: {
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
  },
});
