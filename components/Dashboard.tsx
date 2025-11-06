
import React, { useContext, useMemo, useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FinanceContext } from '../context/FinanceContext';
import { getDashboardInsights } from '../services/geminiService';
import { AIInsight } from '../types';

const StatCard: React.FC<{ title: string; value: string; icon: string }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center">
        <div className="bg-primary-100 dark:bg-primary-900/50 p-3 rounded-full mr-4">
            <i className={`${icon} text-2xl text-primary-500`}></i>
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    const context = useContext(FinanceContext);
    const [insights, setInsights] = useState<AIInsight[]>([]);
    const [isLoadingInsights, setIsLoadingInsights] = useState(true);

    const financialData = useMemo(() => {
        if (!context) return null;
        const { appState } = context;
        const totalDebts = appState.debts.reduce((sum, d) => sum + d.amount, 0);
        const totalInvestments = appState.investments.reduce((sum, i) => sum + i.amount, 0);
        
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyIncome = appState.transactions.filter(t => t.type === 'income' && new Date(t.date) >= startOfMonth).reduce((sum, t) => sum + t.amount, 0);
        const monthlyExpenses = appState.transactions.filter(t => t.type === 'expense' && new Date(t.date) >= startOfMonth).reduce((sum, t) => sum + t.amount, 0);
        const cashFlow = monthlyIncome - monthlyExpenses;

        const totalAssets = appState.savings + totalInvestments;
        const netWorth = totalAssets - totalDebts;

        return { totalAssets, totalDebts, netWorth, cashFlow };
    }, [context]);

    const expenseByCategory = useMemo(() => {
        if (!context) return [];
        const { transactions, categories } = context.appState;
        const expenseData: { [key: string]: number } = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            const category = categories.find(c => c.id === t.categoryId);
            if (category) {
                expenseData[category.name] = (expenseData[category.name] || 0) + t.amount;
            }
        });
        return Object.entries(expenseData).map(([name, value]) => ({ name, value }));
    }, [context]);

    const incomeVsExpenseData = useMemo(() => {
         if (!context) return [];
        const data: { [key: string]: { Revenu: number, Dépense: number } } = {};
        const monthFormatter = new Intl.DateTimeFormat('fr-CA', { month: 'short', year: 'numeric' });
        context.appState.transactions.forEach(t => {
            const month = monthFormatter.format(new Date(t.date));
            if (!data[month]) data[month] = { Revenu: 0, Dépense: 0 };
            if (t.type === 'income') data[month].Revenu += t.amount;
            else data[month].Dépense += t.amount;
        });
        return Object.entries(data).map(([name, values]) => ({ name, ...values })).slice(-6); // Last 6 months
    }, [context]);
    
    useEffect(() => {
        const fetchInsights = async () => {
            if (context?.appState) {
                setIsLoadingInsights(true);
                const result = await getDashboardInsights(context.appState);
                setInsights(result);
                setIsLoadingInsights(false);
            }
        };
        fetchInsights();
    // Only re-fetch insights when transaction count changes, to avoid excessive API calls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [context?.appState.transactions.length]);

    if (!context || !financialData) return <div>Chargement...</div>;

    const COLORS = ['#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e'];
    const insightMeta = {
        success: { icon: 'fa-check-circle', color: 'text-green-500' },
        warning: { icon: 'fa-exclamation-triangle', color: 'text-yellow-500' },
        info: { icon: 'fa-info-circle', color: 'text-blue-500' },
    };
    
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Tableau de bord</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total des Actifs" value={`$${financialData.totalAssets.toFixed(2)}`} icon="fa-solid fa-wallet" />
                <StatCard title="Total des Dettes" value={`$${financialData.totalDebts.toFixed(2)}`} icon="fa-solid fa-credit-card" />
                <StatCard title="Valeur Nette" value={`$${financialData.netWorth.toFixed(2)}`} icon="fa-solid fa-balance-scale" />
                <StatCard title="Flux de Trésorerie Mensuel" value={`${financialData.cashFlow < 0 ? '-' : ''}$${Math.abs(financialData.cashFlow).toFixed(2)}`} icon="fa-solid fa-chart-line" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Revenu vs. Dépense</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={incomeVsExpenseData}>
                            <XAxis dataKey="name" stroke="rgb(107 114 128)" />
                            <YAxis stroke="rgb(107 114 128)"/>
                            <Tooltip contentStyle={{ backgroundColor: 'rgb(31 41 55)', border: 'none' }}/>
                            <Legend />
                            <Bar dataKey="Revenu" fill="#22c55e" name="Revenu"/>
                            <Bar dataKey="Dépense" fill="#ef4444" name="Dépense" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Dépenses par Catégorie</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                                {expenseByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'rgb(31 41 55)', border: 'none' }}/>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-2">Conseils de Hadj</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Conseils proactifs basés sur votre situation financière.</p>
                    {isLoadingInsights ? <div className="text-center p-4">Hadj analyse...</div> :
                        <div className="space-y-4">
                            {insights.length > 0 ? insights.map((insight, index) => (
                                <div key={index} className="flex items-start p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <i className={`fa ${insightMeta[insight.type].icon} ${insightMeta[insight.type].color} text-2xl mt-1`}></i>
                                    <p className="ml-4 text-gray-700 dark:text-gray-300">{insight.text}</p>
                                </div>
                            )) : <div className="text-center p-4">Pas assez de données pour des conseils. Ajoutez plus de transactions !</div>}
                        </div>
                    }
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Suivi de l'Or</h2>
                     <p className="text-sm text-gray-500 dark:text-gray-400">Valeur Actuelle : ~${(context.appState.goldGrams * 65.00).toFixed(2)} USD</p>
                    <div className="mt-4">
                        <label htmlFor="goldGrams" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Or (grammes)</label>
                        <input
                            type="number"
                            id="goldGrams"
                            value={context.appState.goldGrams}
                            onChange={(e) => context.setAppState(s => ({ ...s, goldGrams: parseFloat(e.target.value) || 0 }))}
                            className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
