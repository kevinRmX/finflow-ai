import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Muted, Title } from '../components/ui';
import { api } from '../lib/api';
import { money } from '../lib/format';
import { t } from '../lib/i18n';
import type { PendingCapture } from '../lib/types';

/** Gastos que la app detectó (notificación del banco o correo reenviado) y esperan un toque. */
export default function Captures() {
  const queryClient = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ['captures'], queryFn: () => api<PendingCapture[]>('/captures/pending') });

  const act = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'confirm' | 'dismiss' }) =>
      api(`/captures/${id}/${action}`, { method: 'POST', json: {} }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['captures'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-ink">
      <ScrollView contentContainerClassName="gap-3 p-4">
        <Title>{t('captures.title')}</Title>
        {data.length === 0 && <Muted>¡Todo al día!</Muted>}
        {data.map((c) => (
          <Card key={c.id} className="gap-3">
            <View>
              <Text className="text-2xl font-bold text-ink dark:text-paper">{money(c.amount, c.currency)}</Text>
              <Muted>
                {c.merchant ?? 'Comercio desconocido'}
                {c.cardLast4 ? ` · tarjeta ${c.cardLast4}` : ''} · {new Date(c.occurredAt).toLocaleString()}
              </Muted>
            </View>
            <Button label={t('captures.confirm')} onPress={() => act.mutate({ id: c.id, action: 'confirm' })} />
            <Button label={t('captures.dismiss')} variant="ghost" onPress={() => act.mutate({ id: c.id, action: 'dismiss' })} />
          </Card>
        ))}
        <Button label="Cerrar" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}
