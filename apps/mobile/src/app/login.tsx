import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { Mascot } from '../components/Mascot';
import { Button } from '../components/ui';
import { ApiError, register, signIn } from '../lib/api';
import { t } from '../lib/i18n';

const schema = z.object({
  name: z.string().trim().max(80).optional(),
  email: z.email('Revisa el correo'),
  password: z.string().min(10, 'Mínimo 10 caracteres'),
});
type Form = z.infer<typeof schema>;

export default function Login() {
  const [mode, setMode] = useState<'signIn' | 'register'>('signIn');
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (form) => {
    setError(null);
    try {
      if (mode === 'register') await register(form.name || 'Yo', form.email, form.password);
      else await signIn(form.email, form.password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No hay conexión. Intenta de nuevo.');
    }
  });

  const input = 'h-14 rounded-2xl bg-paper-card px-4 text-base text-ink dark:bg-ink-card dark:text-paper';
  const fields = [
    ...(mode === 'register' ? [{ name: 'name' as const, label: t('auth.name'), secure: false }] : []),
    { name: 'email' as const, label: t('auth.email'), secure: false },
    { name: 'password' as const, label: t('auth.password'), secure: true },
  ];

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-ink">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-center gap-4 px-6">
        <View className="items-center">
          <Mascot species="coco" mood="feliz" size={140} />
          <Text className="mt-2 text-3xl font-bold text-ink dark:text-paper">FinFlow AI</Text>
          <Text className="text-center text-muted">Tus finanzas, sin complicarte.</Text>
        </View>

        {fields.map((f) => (
          <Controller
            key={f.name}
            control={control}
            name={f.name}
            render={({ field }) => (
              <View>
                <TextInput
                  className={input}
                  placeholder={f.label}
                  placeholderTextColor="#94A3B8"
                  autoCapitalize={f.name === 'name' ? 'words' : 'none'}
                  keyboardType={f.name === 'email' ? 'email-address' : 'default'}
                  secureTextEntry={f.secure}
                  value={field.value}
                  onChangeText={field.onChange}
                />
                {formState.errors[f.name] && <Text className="mt-1 text-sm text-bad">{formState.errors[f.name]?.message}</Text>}
              </View>
            )}
          />
        ))}

        {error && <Text className="text-center text-bad">{error}</Text>}
        <Button label={mode === 'signIn' ? t('auth.signIn') : t('auth.register')} loading={formState.isSubmitting} onPress={onSubmit} />
        <Pressable onPress={() => setMode(mode === 'signIn' ? 'register' : 'signIn')} className="items-center py-2">
          <Text className="font-semibold text-brand">{mode === 'signIn' ? '¿Nuevo? Crea tu cuenta' : 'Ya tengo cuenta'}</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
