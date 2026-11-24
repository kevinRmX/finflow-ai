import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Mic, Send } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, ApiError } from '../../lib/api';
import { t } from '../../lib/i18n';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface ChatResponse {
  reply: string;
  transaction?: { id: string };
}

/** Registrar gastos hablando: "Compré gasolina en Puma por Q250 con tarjeta BAC". Sin anuncios aquí. */
export default function Chat() {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ id: 'hello', role: 'assistant', text: t('chat.hello') }]);
  const list = useRef<FlatList<Message>>(null);

  const send = useMutation({
    mutationFn: (message: string) => api<ChatResponse>('/ai/chat', { method: 'POST', json: { text: message } }),
    onSuccess: (res) => {
      setMessages((m) => [...m, { id: `${Date.now()}-a`, role: 'assistant', text: res.reply }]);
      if (res.transaction) void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => {
      const text = e instanceof ApiError && e.code === 'AI_DAILY_LIMIT' ? e.message : 'No pude procesarlo. Intenta otra vez.';
      setMessages((m) => [...m, { id: `${Date.now()}-e`, role: 'assistant', text }]);
    },
  });

  const submit = () => {
    const message = text.trim();
    if (!message || send.isPending) return;
    setMessages((m) => [...m, { id: `${Date.now()}-u`, role: 'user', text: message }]);
    setText('');
    send.mutate(message);
  };

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-ink" edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <FlatList
          ref={list}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerClassName="gap-2 p-4"
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View
              className={`max-w-[85%] rounded-3xl px-4 py-3 ${
                item.role === 'user' ? 'self-end bg-brand' : 'self-start bg-paper-card dark:bg-ink-card'
              }`}
            >
              <Text className={item.role === 'user' ? 'text-white' : 'text-ink dark:text-paper'}>{item.text}</Text>
            </View>
          )}
          ListFooterComponent={send.isPending ? <Text className="px-2 text-muted">Pensando…</Text> : undefined}
        />
        <View className="flex-row items-center gap-2 border-t border-paper-line p-3 dark:border-ink-line">
          {/* Voz: expo-speech-recognition en el build de desarrollo (no disponible en Expo Go) */}
          <Pressable accessibilityLabel="Dictar" className="h-12 w-12 items-center justify-center rounded-2xl bg-paper-card dark:bg-ink-card">
            <Mic color="#94A3B8" size={22} />
          </Pressable>
          <TextInput
            className="h-12 flex-1 rounded-2xl bg-paper-card px-4 text-ink dark:bg-ink-card dark:text-paper"
            placeholder={t('chat.placeholder')}
            placeholderTextColor="#94A3B8"
            value={text}
            onChangeText={setText}
            onSubmitEditing={submit}
            returnKeyType="send"
          />
          <Pressable accessibilityLabel="Enviar" onPress={submit} className="h-12 w-12 items-center justify-center rounded-2xl bg-brand">
            <Send color="#fff" size={20} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
