import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mascot, SPECIES } from '../../components/Mascot';
import { Button, Card, Muted, Title } from '../../components/ui';
import { api, signOut } from '../../lib/api';
import { t } from '../../lib/i18n';
import type { Species } from '../../lib/types';

interface Profile {
  name: string;
  email: string;
  mascot: Species;
  streakDays: number;
}

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['me'], queryFn: () => api<Profile>('/me') });
  const { data: inbound } = useQuery({ queryKey: ['inbound'], queryFn: () => api<{ address: string }>('/me/inbound-address') });

  const pick = useMutation({
    mutationFn: (mascot: Species) => api<Profile>('/me', { method: 'PATCH', json: { mascot } }),
    onSuccess: (me) => {
      queryClient.setQueryData(['me'], me);
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-ink" edges={['top']}>
      <ScrollView contentContainerClassName="gap-4 p-4">
        <Title>{data?.name ?? ''}</Title>
        <Muted>{data?.email}</Muted>

        <Card className="gap-3">
          <Text className="font-semibold text-ink dark:text-paper">{t('profile.mascot')}</Text>
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {(Object.keys(SPECIES) as Species[]).map((sp) => {
              const selected = data?.mascot === sp;
              return (
                <Pressable
                  key={sp}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => pick.mutate(sp)}
                  style={{ borderColor: selected ? SPECIES[sp].accent : 'transparent' }}
                  className="w-[48%] items-center rounded-2xl border-2 bg-paper p-2 dark:bg-ink"
                >
                  <Mascot species={sp} mood="feliz" size={90} />
                  <Text className="font-semibold text-ink dark:text-paper">{SPECIES[sp].name}</Text>
                  <Muted>{SPECIES[sp].kind}</Muted>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card className="gap-1">
          <Text className="font-semibold text-ink dark:text-paper">Reenvía los correos de tu banco</Text>
          <Muted>Crea una regla en tu correo para reenviar las alertas de compra a esta dirección:</Muted>
          <Text selectable className="mt-1 font-semibold text-brand">
            {inbound?.address ?? '…'}
          </Text>
        </Card>

        <Button label={t('profile.signOut')} variant="ghost" onPress={() => void signOut()} />
      </ScrollView>
    </SafeAreaView>
  );
}
