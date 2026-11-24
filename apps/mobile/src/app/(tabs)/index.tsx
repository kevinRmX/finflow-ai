import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { Flame } from 'lucide-react-native';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdSlot } from '../../components/AdSlot';
import { Mascot, MOODS, mascotMessage } from '../../components/Mascot';
import { Card, Muted, ProgressBar } from '../../components/ui';
import { api } from '../../lib/api';
import { money } from '../../lib/format';
import { t } from '../../lib/i18n';
import type { Dashboard } from '../../lib/types';

export default function Home() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<Dashboard>('/dashboard'),
  });

  if (isLoading || !data) {
    return <SafeAreaView className="flex-1 bg-paper dark:bg-ink" />;
  }
  const cur = data.user.currency;

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-ink" edges={['top']}>
      <ScrollView
        contentContainerClassName="gap-4 p-4 pb-10"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-ink dark:text-paper">{t('home.greeting', { name: data.user.name })}</Text>
          <View className="flex-row items-center gap-1 rounded-full bg-paper-card px-3 py-1.5 dark:bg-ink-card">
            <Flame color="#F97316" size={16} />
            <Text className="font-semibold text-ink dark:text-paper">{data.user.streakDays}</Text>
          </View>
        </View>

        {/* Mascota: su humor resume el mes de un vistazo */}
        <Card className="items-center">
          <Mascot species={data.user.mascot} mood={data.mood} size={150} />
          <View className="mt-1 flex-row items-center gap-2">
            <View style={{ backgroundColor: MOODS[data.mood].color }} className="h-2.5 w-2.5 rounded-full" />
            <Muted>{MOODS[data.mood].label}</Muted>
          </View>
          <Text className="mt-2 text-center text-base font-medium text-ink dark:text-paper">
            {mascotMessage(data.user.mascot, data.mood)}
          </Text>
        </Card>

        {data.pendingCaptures > 0 && (
          <Link href="/captures" asChild>
            <Pressable className="rounded-2xl bg-brand px-4 py-3">
              <Text className="font-semibold text-white">{t('home.pending', { count: data.pendingCaptures })} →</Text>
            </Pressable>
          </Link>
        )}

        <Card>
          <Muted>{t('home.balance')}</Muted>
          <Text className="text-4xl font-bold text-ink dark:text-paper">{money(data.totalBalance, cur)}</Text>
          <View className="mt-3 flex-row gap-3">
            <View className="flex-1 rounded-2xl bg-good/15 p-3">
              <Muted>{t('home.income')}</Muted>
              <Text className="text-lg font-bold text-mint-deep dark:text-good">{money(data.month.income, cur)}</Text>
            </View>
            <View className="flex-1 rounded-2xl bg-bad/15 p-3">
              <Muted>{t('home.expense')}</Muted>
              <Text className="text-lg font-bold text-bad">{money(data.month.expense, cur)}</Text>
            </View>
          </View>
        </Card>

        {data.budgets.slice(0, 3).map((b) => (
          <Card key={b.id} className="gap-2">
            <View className="flex-row justify-between">
              <Text className="font-semibold text-ink dark:text-paper">{b.category.name}</Text>
              <Muted>
                {money(b.spent, cur)} / {money(b.limit, cur)}
              </Muted>
            </View>
            <ProgressBar percent={b.percent} />
          </Card>
        ))}

        <AdSlot hidden={data.user.plan === 'AD_FREE'} />

        <Card className="gap-3">
          <Text className="font-semibold text-ink dark:text-paper">{t('home.recent')}</Text>
          {data.recent.map((tx) => (
            <View key={tx.id} className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View style={{ backgroundColor: tx.category?.color ?? '#94A3B8' }} className="h-9 w-9 rounded-xl" />
                <View>
                  <Text className="text-ink dark:text-paper">{tx.description ?? tx.category?.name ?? 'Movimiento'}</Text>
                  <Muted>{new Date(tx.date).toLocaleDateString()}</Muted>
                </View>
              </View>
              <Text className={`font-semibold ${tx.type === 'INCOME' ? 'text-mint-deep dark:text-good' : 'text-ink dark:text-paper'}`}>
                {tx.type === 'INCOME' ? '+' : '-'}
                {money(tx.amount, tx.currency)}
              </Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
