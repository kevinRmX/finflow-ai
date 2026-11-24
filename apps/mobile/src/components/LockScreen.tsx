import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect } from 'react';
import { Text, View } from 'react-native';
import { signOut } from '../lib/api';
import { t } from '../lib/i18n';
import { useSession } from '../lib/session';
import { Button } from './ui';

/** Cubre la app (y la vista del selector de apps) hasta que pase Face ID / huella. */
export function LockScreen() {
  const setLocked = useSession((s) => s.setLocked);

  const unlock = useCallback(async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = hasHardware && (await LocalAuthentication.isEnrolledAsync());
    if (!enrolled) {
      setLocked(false); // sin biometría configurada, se confía en el bloqueo del teléfono
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: t('lock.title') });
    if (result.success) setLocked(false);
  }, [setLocked]);

  useEffect(() => {
    void unlock();
  }, [unlock]);

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-paper px-8 dark:bg-ink">
      <Text className="text-3xl font-bold text-ink dark:text-paper">FinFlow</Text>
      <Text className="text-center text-muted">{t('lock.title')}</Text>
      <View className="w-full gap-3">
        <Button label={t('lock.title')} onPress={unlock} />
        <Button label={t('profile.signOut')} variant="ghost" onPress={() => void signOut()} />
      </View>
    </View>
  );
}
