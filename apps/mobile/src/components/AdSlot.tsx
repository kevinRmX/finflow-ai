import { Text, View } from 'react-native';
import { t } from '../lib/i18n';

/**
 * Lugar reservado para un anuncio nativo de AdMob, siempre marcado como "Anuncio".
 * Se conecta a react-native-google-mobile-ads en el build de desarrollo (no funciona en Expo Go).
 * Reglas: nunca en el chat, al registrar un gasto, en login ni en pantallas de seguridad,
 * y no se muestra a usuarios con el plan sin anuncios.
 */
export function AdSlot({ hidden }: { hidden?: boolean }) {
  if (hidden) return null;
  return (
    <View className="rounded-3xl border border-dashed border-paper-line p-4 dark:border-ink-line">
      <Text className="text-xs font-semibold uppercase text-muted">{t('ad.label')}</Text>
      <View className="mt-2 h-16 rounded-2xl bg-paper-line dark:bg-ink-line" />
    </View>
  );
}
