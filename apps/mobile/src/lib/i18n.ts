import { getLocales } from 'expo-localization';

const es = {
  'tabs.home': 'Inicio',
  'tabs.chat': 'Chat',
  'tabs.budgets': 'Presupuestos',
  'tabs.goals': 'Metas',
  'tabs.profile': 'Perfil',
  'home.greeting': 'Hola, {name}',
  'home.balance': 'Saldo total',
  'home.income': 'Ingresos',
  'home.expense': 'Gastos',
  'home.recent': 'Últimos movimientos',
  'home.pending': '{count} gastos por confirmar',
  'home.streak': '{days} días seguidos registrando',
  'chat.placeholder': 'Ej: Gasté Q85 en Walmart con la BAC',
  'chat.hello': '¡Hola! Cuéntame qué gastaste o ganaste y yo lo anoto.',
  'budgets.title': 'Presupuestos del mes',
  'budgets.empty': 'Aún no tienes presupuestos. Ponle un límite a lo que más gastas.',
  'goals.title': 'Metas de ahorro',
  'goals.empty': 'Crea tu primera meta: un viaje, un fondo de emergencia, lo que quieras.',
  'profile.mascot': 'Tu mascota',
  'profile.signOut': 'Cerrar sesión',
  'auth.signIn': 'Entrar',
  'auth.register': 'Crear cuenta',
  'auth.email': 'Correo',
  'auth.password': 'Contraseña',
  'auth.name': 'Tu nombre',
  'lock.title': 'Desbloquea FinFlow',
  'captures.title': 'Gastos por confirmar',
  'captures.confirm': 'Sí, guardar',
  'captures.dismiss': 'No fue gasto',
  'ad.label': 'Anuncio',
} as const;

export type MessageKey = keyof typeof es;

const en: Record<MessageKey, string> = {
  'tabs.home': 'Home',
  'tabs.chat': 'Chat',
  'tabs.budgets': 'Budgets',
  'tabs.goals': 'Goals',
  'tabs.profile': 'Profile',
  'home.greeting': 'Hi, {name}',
  'home.balance': 'Total balance',
  'home.income': 'Income',
  'home.expense': 'Spending',
  'home.recent': 'Recent activity',
  'home.pending': '{count} expenses to confirm',
  'home.streak': '{days}-day logging streak',
  'chat.placeholder': 'E.g. Spent $20 at Walmart with my Visa',
  'chat.hello': "Hi! Tell me what you spent or earned and I'll log it.",
  'budgets.title': 'This month’s budgets',
  'budgets.empty': 'No budgets yet. Set a limit on what you spend the most on.',
  'goals.title': 'Savings goals',
  'goals.empty': 'Create your first goal: a trip, an emergency fund, anything.',
  'profile.mascot': 'Your buddy',
  'profile.signOut': 'Sign out',
  'auth.signIn': 'Sign in',
  'auth.register': 'Create account',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.name': 'Your name',
  'lock.title': 'Unlock FinFlow',
  'captures.title': 'Expenses to confirm',
  'captures.confirm': 'Yes, save it',
  'captures.dismiss': 'Not an expense',
  'ad.label': 'Ad',
};

const dictionaries = { es, en };
const lang = getLocales()[0]?.languageCode === 'en' ? 'en' : 'es';

/** t('home.greeting', { name: 'Ana' }) */
export function t(key: MessageKey, vars: Record<string, string | number> = {}) {
  const text: string = dictionaries[lang][key];
  return text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
}
