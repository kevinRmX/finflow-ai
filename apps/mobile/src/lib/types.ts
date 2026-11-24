export type Mood = 'celebrando' | 'feliz' | 'tranquilo' | 'preocupado' | 'triste';
export type Species = 'flo' | 'coco' | 'leo' | 'balam';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: string;
  currency: string;
  date: string;
  description: string | null;
  category: Pick<Category, 'name' | 'icon' | 'color'> | null;
}

export interface Dashboard {
  user: { name: string; currency: string; mascot: Species; mascotStage: number; streakDays: number; plan: 'FREE' | 'AD_FREE' };
  mood: Mood;
  month: { income: number; expense: number; balance: number };
  totalBalance: number;
  accounts: Array<{ id: string; name: string; type: string; balance: string; currency: string }>;
  budgets: Array<{ id: string; category: Pick<Category, 'name' | 'icon' | 'color'>; limit: number; spent: number; percent: number }>;
  goals: Array<{ id: string; name: string; icon: string | null; status: string; target: number; saved: number; percent: number }>;
  pendingCaptures: number;
  recent: Transaction[];
}

export interface PendingCapture {
  id: string;
  source: 'NOTIFICATION' | 'EMAIL';
  amount: string;
  currency: string;
  merchant: string | null;
  cardLast4: string | null;
  occurredAt: string;
}
