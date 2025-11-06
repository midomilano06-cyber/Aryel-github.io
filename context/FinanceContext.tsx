import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppState, Theme, Transaction, Debt, Investment, RecurringExpense, Category, Toast, FinancialGoal } from '../types';
import { encrypt, decrypt } from '../services/cryptoService';
import { INITIAL_CATEGORIES } from '../constants';

export enum Page {
    Dashboard = 'Tableau de bord',
    Transactions = 'Transactions',
    Goals = 'Objectifs',
    Debts = 'Dettes',
    Investments = 'Investissements',
    Zakat = 'Zakat',
    Taxes = 'Impôts',
    AIChat = 'Chat IA',
    Settings = 'Paramètres',
}

interface FinanceContextType {
    appState: AppState;
    setAppState: React.Dispatch<React.SetStateAction<AppState>>;
    isLocked: boolean;
    unlock: (password: string) => Promise<boolean>;
    setPassword: (password: string) => Promise<void>;
    logout: () => void;
    isInitializing: boolean;
    page: Page;
    setPage: (page: Page) => void;
    theme: Theme;
    toggleTheme: () => void;
    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    addMultipleTransactions: (transactions: Omit<Transaction, 'id'>[]) => void;
    updateTransaction: (transaction: Transaction) => void;
    deleteTransaction: (id: string) => void;
    addDebt: (debt: Omit<Debt, 'id'>) => void;
    updateDebt: (debt: Debt) => void;
    deleteDebt: (id: string) => void;
    addInvestment: (investment: Omit<Investment, 'id'>) => void;
    updateInvestment: (investment: Investment) => void;
    deleteInvestment: (id: string) => void;
    addRecurringExpense: (expense: Omit<RecurringExpense, 'id'|'lastGeneratedDate'>) => void;
    updateRecurringExpense: (expense: RecurringExpense) => void;
    deleteRecurringExpense: (id: string) => void;
    addGoal: (goal: Omit<FinancialGoal, 'id' | 'currentAmount'>) => void;
    updateGoal: (goal: FinancialGoal) => void;
    deleteGoal: (id: string) => void;
    contributeToGoal: (id: string, amount: number) => void;
    addCategory: (category: Omit<Category, 'id'>) => void;
    toasts: Toast[];
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    removeToast: (id: number) => void;
}

export const FinanceContext = createContext<FinanceContextType | null>(null);

const initialAppState: AppState = {
    transactions: [],
    recurringExpenses: [],
    debts: [],
    investments: [],
    goals: [],
    categories: INITIAL_CATEGORIES,
    goldGrams: 0,
    savings: 0,
};

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [appState, setAppState] = useState<AppState>(initialAppState);
    const [password, setPassword] = useState<string | null>(sessionStorage.getItem('hadj-finance-key'));
    const [isLocked, setIsLocked] = useState(true);
    const [isInitializing, setIsInitializing] = useState(true);
    const [page, setPage] = useState<Page>(Page.Dashboard);
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || Theme.Light);
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const saveData = useCallback(async (data: AppState, key: string | null) => {
        try {
            if (key) {
                const encryptedData = await encrypt(JSON.stringify(data), key);
                localStorage.setItem('hadj-finance-data', encryptedData);
                localStorage.setItem('hadj-finance-encrypted', 'true');
            } else {
                localStorage.setItem('hadj-finance-data', JSON.stringify(data));
                localStorage.removeItem('hadj-finance-encrypted');
            }
        } catch (error) {
            console.error('Failed to save data:', error);
            addToast("Échec de la sauvegarde des données.", "error");
        }
    }, [addToast]);

    useEffect(() => {
        const loadData = async () => {
            setIsInitializing(true);
            try {
                const isEncrypted = localStorage.getItem('hadj-finance-encrypted') === 'true';
                const storedData = localStorage.getItem('hadj-finance-data');

                if (!storedData) {
                    setIsLocked(false);
                } else if (!isEncrypted) {
                    // Make sure new fields exist
                    const parsedData = JSON.parse(storedData);
                    setAppState({ ...initialAppState, ...parsedData });
                    setIsLocked(false);
                } else {
                    if (password) {
                        const decryptedData = await decrypt(storedData, password);
                        const parsedData = JSON.parse(decryptedData);
                        setAppState({ ...initialAppState, ...parsedData });
                        setIsLocked(false);
                    } else {
                        setIsLocked(true);
                    }
                }
            } catch (error) {
                console.error('Failed to load data, might be wrong password:', error);
                sessionStorage.removeItem('hadj-finance-key');
                setPassword(null);
                setIsLocked(true);
            } finally {
                setIsInitializing(false);
            }
        };

        loadData();
    }, [password]);

    useEffect(() => {
        if (!isInitializing) {
            saveData(appState, password);
        }
    }, [appState, password, isInitializing, saveData]);
    
    useEffect(() => {
        if (isInitializing) return;

        const today = new Date();
        const thisMonth = today.getMonth();
        const thisYear = today.getFullYear();

        const expensesToGenerate = appState.recurringExpenses.filter(exp => {
            const startDate = new Date(exp.startDate);
            if (startDate > today) return false;

            const lastGenerated = exp.lastGeneratedDate ? new Date(exp.lastGeneratedDate) : null;
            if (!lastGenerated) return true;
            
            return lastGenerated.getFullYear() < thisYear || (lastGenerated.getFullYear() === thisYear && lastGenerated.getMonth() < thisMonth);
        });

        if (expensesToGenerate.length > 0) {
            const newTransactions: Omit<Transaction, 'id'>[] = [];
            const updatedRecurringExpenses = appState.recurringExpenses.map(exp => {
                 if (expensesToGenerate.some(e => e.id === exp.id)) {
                    const transactionDate = new Date(thisYear, thisMonth, new Date(exp.startDate).getDate());
                    newTransactions.push({
                        type: 'expense',
                        amount: exp.amount,
                        description: `${exp.description} (Récurrent)`,
                        date: transactionDate.toISOString(),
                        categoryId: exp.categoryId,
                    });
                     return { ...exp, lastGeneratedDate: today.toISOString() };
                 }
                return exp;
            });
            
            const newTransactionsWithIds = newTransactions.map(t => ({...t, id: `txn-${Date.now()}-${Math.random()}`}));

            setAppState(prev => ({
                ...prev,
                transactions: [...prev.transactions, ...newTransactionsWithIds],
                recurringExpenses: updatedRecurringExpenses,
            }));
            addToast(`${newTransactions.length} dépense(s) récurrente(s) générée(s).`);
        }
    // Re-run this check on navigation to keep recurring expenses up-to-date
    }, [isInitializing, page, addToast, appState.recurringExpenses]);

    const unlock = useCallback(async (pass: string): Promise<boolean> => {
        setIsInitializing(true);
        const storedData = localStorage.getItem('hadj-finance-data');
        if (!storedData) {
            console.error('No data to unlock.');
            setIsInitializing(false);
            return false;
        }
        try {
            const decryptedData = await decrypt(storedData, pass);
            const parsedData = JSON.parse(decryptedData);
            setAppState({ ...initialAppState, ...parsedData });
            setPassword(pass);
            sessionStorage.setItem('hadj-finance-key', pass);
            setIsLocked(false);
            setIsInitializing(false);
            return true;
        } catch (error) {
            console.error('Unlock failed:', error);
            setIsInitializing(false);
            return false;
        }
    }, []);

    const setPasswordAndEncrypt = useCallback(async (newPassword: string) => {
        setPassword(newPassword);
        sessionStorage.setItem('hadj-finance-key', newPassword);
        await saveData(appState, newPassword);
        addToast("Mot de passe défini et données chiffrées.", "success");
    }, [appState, saveData, addToast]);

    const logout = useCallback(() => {
        setPassword(null);
        sessionStorage.removeItem('hadj-finance-key');
        setIsLocked(true);
        setPage(Page.Dashboard);
        addToast("Vous avez été déconnecté.", "info");
    }, [addToast]);

    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => {
            const newTheme = prevTheme === Theme.Light ? Theme.Dark : Theme.Light;
            localStorage.setItem('theme', newTheme);
            return newTheme;
        });
    }, []);

    // --- CRUD Functions ---
    const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
        setAppState(prev => ({ ...prev, transactions: [...prev.transactions, { ...transaction, id: `txn-${Date.now()}` }] }));
        addToast('Transaction ajoutée', 'success');
    }, [addToast]);

    const addMultipleTransactions = useCallback((transactions: Omit<Transaction, 'id'>[]) => {
        setAppState(prev => ({ ...prev, transactions: [
            ...prev.transactions, 
            ...transactions.map(t => ({...t, id: `txn-${Date.now()}-${Math.random()}`}))
        ]}));
    }, []);

    const updateTransaction = useCallback((updatedTxn: Transaction) => {
        setAppState(prev => ({ ...prev, transactions: prev.transactions.map(t => t.id === updatedTxn.id ? updatedTxn : t) }));
        addToast('Transaction mise à jour', 'success');
    }, [addToast]);
    const deleteTransaction = useCallback((id: string) => {
        setAppState(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
        addToast('Transaction supprimée', 'success');
    }, [addToast]);
    
    const addDebt = useCallback((debt: Omit<Debt, 'id'>) => {
        setAppState(prev => ({ ...prev, debts: [...prev.debts, { ...debt, id: `debt-${Date.now()}` }] }));
        addToast('Dette ajoutée', 'success');
    }, [addToast]);
    const updateDebt = useCallback((updatedDebt: Debt) => {
        setAppState(prev => ({ ...prev, debts: prev.debts.map(d => d.id === updatedDebt.id ? updatedDebt : d) }));
        addToast('Dette mise à jour', 'success');
    }, [addToast]);
    const deleteDebt = useCallback((id: string) => {
        setAppState(prev => ({ ...prev, debts: prev.debts.filter(d => d.id !== id) }));
        addToast('Dette supprimée', 'success');
    }, [addToast]);

    const addInvestment = useCallback((investment: Omit<Investment, 'id'>) => {
        setAppState(prev => ({ ...prev, investments: [...prev.investments, { ...investment, id: `inv-${Date.now()}` }] }));
        addToast('Investissement ajouté', 'success');
    }, [addToast]);
    const updateInvestment = useCallback((updatedInvestment: Investment) => {
        setAppState(prev => ({ ...prev, investments: prev.investments.map(i => i.id === updatedInvestment.id ? updatedInvestment : i) }));
        addToast('Investissement mis à jour', 'success');
    }, [addToast]);
    const deleteInvestment = useCallback((id: string) => {
        setAppState(prev => ({ ...prev, investments: prev.investments.filter(i => i.id !== id) }));
        addToast('Investissement supprimé', 'success');
    }, [addToast]);
    
    const addRecurringExpense = useCallback((expense: Omit<RecurringExpense, 'id'|'lastGeneratedDate'>) => {
        setAppState(prev => ({...prev, recurringExpenses: [...prev.recurringExpenses, { ...expense, id: `rec-${Date.now()}`, lastGeneratedDate: null }]}));
        addToast('Dépense récurrente ajoutée', 'success');
    }, [addToast]);
    const updateRecurringExpense = useCallback((updatedExpense: RecurringExpense) => {
        setAppState(prev => ({ ...prev, recurringExpenses: prev.recurringExpenses.map(r => r.id === updatedExpense.id ? updatedExpense : r) }));
        addToast('Dépense récurrente mise à jour', 'success');
    }, [addToast]);
    const deleteRecurringExpense = useCallback((id: string) => {
        setAppState(prev => ({ ...prev, recurringExpenses: prev.recurringExpenses.filter(r => r.id !== id) }));
        addToast('Dépense récurrente supprimée', 'success');
    }, [addToast]);

    const addCategory = useCallback((category: Omit<Category, 'id'>) => {
        setAppState(prev => ({ ...prev, categories: [...prev.categories, { ...category, id: `cat-${Date.now()}` }] }));
        addToast('Catégorie ajoutée', 'success');
    }, [addToast]);

    const addGoal = useCallback((goal: Omit<FinancialGoal, 'id' | 'currentAmount'>) => {
        setAppState(prev => ({ ...prev, goals: [...prev.goals, { ...goal, id: `goal-${Date.now()}`, currentAmount: 0 }]}));
        addToast('Objectif ajouté', 'success');
    }, [addToast]);
    const updateGoal = useCallback((updatedGoal: FinancialGoal) => {
        setAppState(prev => ({ ...prev, goals: prev.goals.map(g => g.id === updatedGoal.id ? updatedGoal : g)}));
        addToast('Objectif mis à jour', 'success');
    }, [addToast]);
    const deleteGoal = useCallback((id: string) => {
        setAppState(prev => ({...prev, goals: prev.goals.filter(g => g.id !== id)}));
        addToast('Objectif supprimé', 'success');
    }, [addToast]);
    const contributeToGoal = useCallback((id: string, amount: number) => {
        setAppState(prev => ({
            ...prev,
            goals: prev.goals.map(g => g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g)
        }));
        addToast(`Contribution de ${amount.toFixed(2)}$ ajoutée`, 'success');
    }, [addToast]);

    const contextValue = {
        appState,
        setAppState,
        isLocked,
        unlock,
        setPassword: setPasswordAndEncrypt,
        logout,
        isInitializing,
        page,
        setPage,
        theme,
        toggleTheme,
        addTransaction, addMultipleTransactions, updateTransaction, deleteTransaction,
        addDebt, updateDebt, deleteDebt,
        addInvestment, updateInvestment, deleteInvestment,
        addRecurringExpense, updateRecurringExpense, deleteRecurringExpense,
        addGoal, updateGoal, deleteGoal, contributeToGoal,
        addCategory,
        toasts, addToast, removeToast
    };

    return <FinanceContext.Provider value={contextValue}>{children}</FinanceContext.Provider>;
};
