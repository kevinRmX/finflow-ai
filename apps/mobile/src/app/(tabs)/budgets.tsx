import { useQuery } from '@tanstack/react-query';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Muted, ProgressBar, Title } from '../../components/ui';
import { api } from '../../lib/api';
import { money } from '../../lib/format';
import { t } from '../../lib/i18n';
import type { Dashboard } from '../../lib/types';

export default function Budgets() {
  const { data } = useQuery({ queryKey: ['dashboard'], queryFn: () => api<Dashboard>('/dashboard') });
  const cur = data?.user.currency ?? 'GTQ';

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-ink" edges={['top']}>
      <ScrollView contentContainerClassName="gap-3 p-4">
        <Title>{t('budgets.title')}</Title>
        {data?.budgets.length === 0 && <Muted>{t('budgets.empty')}</Muted>}
        {data?.budgets.map((b) => {
          const left = b.limit - b.spent;
          return (
            <Card key={b.id} className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-ink dark:text-paper">{b.category.name}</Text>
                <Text className="font-bold text-ink dark:text-paper">{b.percent}%</Text>
              </View>
              <ProgressBar percent={b.percent} />
              <Muted>
                {left >= 0 ? `Te quedan ${money(left, cur)} de ${money(b.limit, cur)}` : `Te pasaste por ${money(-left, cur)}`}
              </Muted>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
