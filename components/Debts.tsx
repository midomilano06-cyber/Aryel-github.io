
import React, { useContext, useState, useMemo } from 'react';
import { FinanceContext } from '../context/FinanceContext';
import { Debt } from '../types';
import { PlusIcon, EditIcon, TrashIcon } from './Icons';

interface DebtModalProps {
    isOpen: boolean;
    onClose: () => void;
    debt?: Debt;
}

const DebtModal: React.FC<DebtModalProps> = ({ isOpen, onClose, debt }) => {
    const context = useContext(FinanceContext);
    const [name, setName] = useState('');
    const [amount, setAmount] = useState(0);
    const [interestRate, setInterestRate] = useState(0);
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

    React.useEffect(() => {
        if (debt) {
            setName(debt.name);
            setAmount(debt.amount);
            setInterestRate(debt.interestRate);
            setDueDate(new Date(debt.dueDate).toISOString().split('T')[0]);
        } else {
            setName('');
            setAmount(0);
            setInterestRate(0);
            setDueDate(new Date().toISOString().split('T')[0]);
        }
    }, [debt, isOpen]);

    if (!isOpen || !context) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newDebt = { name, amount, interestRate, dueDate };
        if (debt) {
            context.updateDebt({ ...newDebt, id: debt.id });
        } else {
            context.addDebt(newDebt);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">{debt ? 'Modifier' : 'Ajouter'} une Dette</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Nom de la dette (ex: Prêt auto)</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Montant</label>
                        <input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Taux d'intérêt (%)</label>
                        <input type="number" step="0.01" value={interestRate} onChange={e => setInterestRate(parseFloat(e.target.value))} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Date d'échéance</label>
                        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded" required />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600">Annuler</button>
                        <button type="submit" className="px-4 py-2 rounded bg-primary-500 text-white">{debt ? 'Mettre à jour' : 'Ajouter'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Debts: React.FC = () => {
    const context = useContext(FinanceContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDebt, setEditingDebt] = useState<Debt | undefined>();

    const { totalDebt, weightedAverageRate } = useMemo(() => {
        if (!context) return { totalDebt: 0, weightedAverageRate: 0 };
        const debts = context.appState.debts;
        const totalDebt = debts.reduce((sum, d) => sum + d.amount, 0);
        if (totalDebt === 0) return { totalDebt: 0, weightedAverageRate: 0 };
        const weightedSum = debts.reduce((sum, d) => sum + d.amount * d.interestRate, 0);
        return { totalDebt, weightedAverageRate: weightedSum / totalDebt };
    }, [context]);

    if (!context) return null;
    const { debts, deleteDebt } = context;

    const handleEdit = (debt: Debt) => {
        setEditingDebt(debt);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingDebt(undefined);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gestion des Dettes</h1>
                <button onClick={handleAddNew} className="bg-primary-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"><PlusIcon /> Ajouter une Dette</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Dette Totale</p>
                    <p className="text-3xl font-bold text-red-500">${totalDebt.toFixed(2)}</p>
                 </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Taux d'Intérêt Moyen Pondéré</p>
                    <p className="text-3xl font-bold text-yellow-500">{weightedAverageRate.toFixed(2)}%</p>
                 </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Détails des Dettes</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b dark:border-gray-700">
                                <th className="p-3">Nom</th>
                                <th className="p-3 text-right">Montant</th>
                                <th className="p-3 text-right">Taux d'intérêt</th>
                                <th className="p-3">Date d'échéance</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {debts.length > 0 ? debts.map(d => (
                                <tr key={d.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-3 font-medium">{d.name}</td>
                                    <td className="p-3 text-right">${d.amount.toFixed(2)}</td>
                                    <td className="p-3 text-right">{d.interestRate.toFixed(2)}%</td>
                                    <td className="p-3">{new Date(d.dueDate).toLocaleDateString('fr-CA')}</td>
                                    <td className="p-3 text-right">
                                        <button onClick={() => handleEdit(d)} className="text-gray-500 hover:text-primary-500 mr-2" aria-label="Modifier"><EditIcon /></button>
                                        <button onClick={() => deleteDebt(d.id)} className="text-gray-500 hover:text-red-500" aria-label="Supprimer"><TrashIcon /></button>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan={5} className="text-center p-8 text-gray-500">Aucune dette suivie. Beau travail !</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <DebtModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} debt={editingDebt} />
        </div>
    );
};

export default Debts;
