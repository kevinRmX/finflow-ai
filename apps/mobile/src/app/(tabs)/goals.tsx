import { useQuery } from '@tanstack/react-query';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Muted, ProgressBar, Title } from '../../components/ui';
import { api } from '../../lib/api';
import { money } from '../../lib/format';
import { t } from '../../lib/i18n';
import type { Dashboard } from '../../lib/types';

export default function Goals() {
  const { data } = useQuery({ queryKey: ['dashboard'], queryFn: () => api<Dashboard>('/dashboard') });
  const cur = data?.user.currency ?? 'GTQ';

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-ink" edges={['top']}>
      <ScrollView contentContainerClassName="gap-3 p-4">
        <Title>{t('goals.title')}</Title>
        {data?.goals.length === 0 && <Muted>{t('goals.empty')}</Muted>}
        {data?.goals.map((g) => (
          <Card key={g.id} className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-ink dark:text-paper">{g.name}</Text>
              {g.status === 'COMPLETED' && <Text className="font-semibold text-good">¡Lograda!</Text>}
            </View>
            <ProgressBar percent={g.percent} color="#22C1A8" />
            <Muted>
              {money(g.saved, cur)} de {money(g.target, cur)}
            </Muted>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
