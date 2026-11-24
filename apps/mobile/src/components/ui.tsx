import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { budgetColor } from '../lib/format';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <View className={`rounded-3xl bg-paper-card p-4 dark:bg-ink-card ${className}`}>{children}</View>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text className="text-2xl font-bold text-ink dark:text-paper">{children}</Text>;
}

export function Muted({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <Text className={`text-sm text-muted ${className}`}>{children}</Text>;
}

export function ProgressBar({ percent, color }: { percent: number; color?: string }) {
  const width = Math.min(100, Math.max(0, percent));
  return (
    <View className="h-2.5 overflow-hidden rounded-full bg-paper-line dark:bg-ink-line">
      <View style={{ width: `${width}%`, backgroundColor: color ?? budgetColor(percent) }} className="h-full rounded-full" />
    </View>
  );
}

export function Button({
  label,
  onPress,
  loading,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'ghost';
}) {
  const base = variant === 'primary' ? 'bg-brand' : 'bg-transparent border border-paper-line dark:border-ink-line';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={loading}
      onPress={onPress}
      className={`h-14 items-center justify-center rounded-2xl ${base} active:opacity-80`}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className={`text-base font-semibold ${variant === 'primary' ? 'text-white' : 'text-ink dark:text-paper'}`}>{label}</Text>
      )}
    </Pressable>
  );
}
