import '../global.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LockScreen } from '../components/LockScreen';
import { useSession } from '../lib/session';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export default function RootLayout() {
  const { ready, user, locked, load, setLocked } = useSession();

  useEffect(() => {
    void load();
  }, [load]);

  // Al volver a la app después de dejarla en segundo plano, pide Face ID / huella otra vez.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' && useSession.getState().user) setLocked(true);
    });
    return () => sub.remove();
  }, [setLocked]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        {user && locked ? (
          <LockScreen />
        ) : (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={!!user}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="captures" options={{ presentation: 'modal' }} />
            </Stack.Protected>
            <Stack.Protected guard={!user}>
              <Stack.Screen name="login" />
            </Stack.Protected>
          </Stack>
        )}
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
