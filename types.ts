
export interface Category {
    id: string;
    name: string;
    type: 'income' | 'expense';
}

export interface Transaction {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    description: string;
    date: string; // ISO string
    categoryId: string;
}

export interface RecurringExpense {
    id: string;
    amount: number;
    description: string;
    categoryId: string;
    startDate: string; // ISO string
    lastGeneratedDate: string | null; // ISO string
}

export interface Debt {
    id: string;
    name: string;
    amount: number;
    interestRate: number;
    dueDate: string; // ISO string
}

export interface Investment {
    id:string;
    name: string;
    amount: number;
    sector: string;
    country: string;
    riskLevel: 'low' | 'medium' | 'high';
    isShariaCompliant: boolean;
    notes: string;
    aiAnalysis?: {
        recommendation: 'Recommandé' | 'Non Recommandé' | 'Neutre';
        reasoning: string;
        potentialProfitability: string;
        riskAssessment: string;
    };
}

export interface FinancialGoal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string; // ISO string
}

export interface AIInsight {
    type: 'success' | 'warning' | 'info';
    text: string;
}

export interface AppState {
    transactions: Transaction[];
    recurringExpenses: RecurringExpense[];
    debts: Debt[];
    investments: Investment[];
    goals: FinancialGoal[];
    categories: Category[];
    goldGrams: number;
    savings: number;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export enum Theme {
    Light = 'light',
    Dark = 'dark'
}

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}
