import { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { colors } from '../theme';

/** Ondas sonoras animadas — ativas enquanto o Jarvis grava/processa/fala. */
export function Waveform({ active, color = colors.amber }: { active: boolean; color?: string }) {
  const bars = useRef([0, 1, 2, 3, 4, 5, 6].map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    const animations = bars.map((bar, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: 1,
            duration: 380 + i * 60,
            delay: i * 70,
            useNativeDriver: true,
          }),
          Animated.timing(bar, {
            toValue: 0.3,
            duration: 380 + i * 60,
            useNativeDriver: true,
          }),
        ])
      )
    );

    if (active) {
      animations.forEach((a) => a.start());
    } else {
      bars.forEach((b) => b.setValue(0.3));
    }

    return () => animations.forEach((a) => a.stop());
  }, [active, bars]);

  return (
    <View style={styles.row}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[styles.bar, { backgroundColor: color, transform: [{ scaleY: bar }] }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44 },
  bar: { width: 5, height: 44, borderRadius: 3 },
});
