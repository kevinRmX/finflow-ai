import { Tabs } from 'expo-router';
import { ChartPie, House, MessageCircle, Target, User } from 'lucide-react-native';
import { useColorScheme } from 'react-native';
import { t } from '../../lib/i18n';

export default function TabsLayout() {
  const dark = useColorScheme() === 'dark';
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3366FF',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: { backgroundColor: dark ? '#121826' : '#FFFFFF', borderTopColor: dark ? '#1E2638' : '#E5E9F2' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarIcon: ({ color }) => <House color={color} size={22} /> }} />
      <Tabs.Screen name="chat" options={{ title: t('tabs.chat'), tabBarIcon: ({ color }) => <MessageCircle color={color} size={22} /> }} />
      <Tabs.Screen name="budgets" options={{ title: t('tabs.budgets'), tabBarIcon: ({ color }) => <ChartPie color={color} size={22} /> }} />
      <Tabs.Screen name="goals" options={{ title: t('tabs.goals'), tabBarIcon: ({ color }) => <Target color={color} size={22} /> }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile'), tabBarIcon: ({ color }) => <User color={color} size={22} /> }} />
    </Tabs>
  );
}
