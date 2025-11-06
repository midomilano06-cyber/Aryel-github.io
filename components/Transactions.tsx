
import React, { useContext, useState, useMemo } from 'react';
import { FinanceContext } from '../context/FinanceContext';
import { Transaction } from '../types';
import { PlusIcon, EditIcon, TrashIcon } from './Icons';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction?: Transaction;
    type: 'income' | 'expense';
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, transaction, type }) => {
    const context = useContext(FinanceContext);
    const [amount, setAmount] = useState(0);
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [categoryId, setCategoryId] = useState('');

    const categories = useMemo(() => {
        return context?.appState.categories.filter(c => c.type === type) || [];
    }, [context?.appState.categories, type]);

    React.useEffect(() => {
        if (transaction) {
            setAmount(transaction.amount);
            setDescription(transaction.description);
            setDate(new Date(transaction.date).toISOString().split('T')[0]);
            setCategoryId(transaction.categoryId);
        } else {
            setAmount(0);
            setDescription('');
            setDate(new Date().toISOString().split('T')[0]);
            setCategoryId(categories.length > 0 ? categories[0].id : '');
        }
    }, [transaction, isOpen, categories]);

    if (!isOpen || !context) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newTransaction = { amount: Math.abs(amount), description, date, categoryId, type };
        if (transaction) {
            context.updateTransaction({ ...newTransaction, id: transaction.id });
        } else {
            context.addTransaction(newTransaction);
        }
        onClose();
    };

    const typeText = type === 'income' ? 'Revenu' : 'Dépense';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 capitalize">{transaction ? 'Modifier' : 'Ajouter'} {typeText}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium">Montant</label>
                        <input id="amount" type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded" required />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium">Description</label>
                        <input id="description" type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded" required />
                    </div>
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium">Date</label>
                        <input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded" required />
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium">Catégorie</label>
                        <select id="category" value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded" required>
                             {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600">Annuler</button>
                        <button type="submit" className="px-4 py-2 rounded bg-primary-500 text-white">{transaction ? 'Mettre à jour' : 'Ajouter'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const Transactions: React.FC = () => {
    const context = useContext(FinanceContext);
    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();

    if (!context) return null;
    const { transactions, categories, deleteTransaction } = context;
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Non Catégorisé';
    
    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        if(transaction.type === 'income') setIsIncomeModalOpen(true);
        else setIsExpenseModalOpen(true);
    };

    const handleAddNew = (type: 'income' | 'expense') => {
        setEditingTransaction(undefined);
        if(type === 'income') setIsIncomeModalOpen(true);
        else setIsExpenseModalOpen(true);
    };

    const closeModals = () => {
        setIsIncomeModalOpen(false);
        setIsExpenseModalOpen(false);
    }
    
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Transactions</h1>
                <div className="flex gap-2">
                    <button onClick={() => handleAddNew('income')} className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"><PlusIcon /> Revenu</button>
                    <button onClick={() => handleAddNew('expense')} className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"><PlusIcon /> Dépense</button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                 <h2 className="text-xl font-semibold mb-4">Historique</h2>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b dark:border-gray-700">
                                <th className="p-3">Date</th>
                                <th className="p-3">Description</th>
                                <th className="p-3">Catégorie</th>
                                <th className="p-3 text-right">Montant</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                             {sortedTransactions.length > 0 ? sortedTransactions.map(t => (
                                <tr key={t.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-3">{new Date(t.date).toLocaleDateString('fr-CA')}</td>
                                    <td className="p-3">{t.description}</td>
                                    <td className="p-3">{getCategoryName(t.categoryId)}</td>
                                    <td className={`p-3 text-right font-medium ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                        {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                                    </td>
                                    <td className="p-3 text-right">
                                        <button onClick={() => handleEdit(t)} className="text-gray-500 hover:text-primary-500 mr-2" aria-label="Modifier"><EditIcon /></button>
                                        <button onClick={() => deleteTransaction(t.id)} className="text-gray-500 hover:text-red-500" aria-label="Supprimer"><TrashIcon /></button>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan={5} className="text-center p-8 text-gray-500">Aucune transaction pour le moment. Ajoutez-en une pour commencer !</td></tr>}
                        </tbody>
                    </table>
                 </div>
            </div>

            <TransactionModal 
                isOpen={isIncomeModalOpen} 
                onClose={closeModals} 
                transaction={editingTransaction}
                type="income"
            />
            <TransactionModal 
                isOpen={isExpenseModalOpen} 
                onClose={closeModals} 
                transaction={editingTransaction}
                type="expense"
            />
        </div>
    );
};

export default Transactions;
