
import React, { useContext, useState } from 'react';
import { FinanceContext } from '../context/FinanceContext';
import { FinancialGoal } from '../types';
import { PlusIcon, EditIcon, TrashIcon, GoalsIcon } from './Icons';

// Modal for Adding/Editing a Goal
interface GoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    goal?: FinancialGoal;
}

const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, goal }) => {
    const context = useContext(FinanceContext);
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState(0);
    const [deadline, setDeadline] = useState(new Date().toISOString().split('T')[0]);

    React.useEffect(() => {
        if (goal) {
            setName(goal.name);
            setTargetAmount(goal.targetAmount);
            setDeadline(new Date(goal.deadline).toISOString().split('T')[0]);
        } else {
            setName('');
            setTargetAmount(0);
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            setDeadline(nextYear.toISOString().split('T')[0]);
        }
    }, [goal, isOpen]);

    if (!isOpen || !context) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newGoalData = { name, targetAmount, deadline };
        if (goal) {
            context.updateGoal({ ...goal, ...newGoalData });
        } else {
            context.addGoal(newGoalData);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">{goal ? 'Modifier' : 'Ajouter'} un Objectif</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Nom de l'objectif (ex: Mise de fonds)</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Montant Cible</label>
                        <input type="number" value={targetAmount} onChange={e => setTargetAmount(parseFloat(e.target.value))} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Date Limite</label>
                        <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded" required />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600">Annuler</button>
                        <button type="submit" className="px-4 py-2 rounded bg-primary-500 text-white">{goal ? 'Mettre à jour' : 'Ajouter'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Card for displaying a single Goal
const GoalCard: React.FC<{ goal: FinancialGoal, onEdit: () => void, onContribute: () => void }> = ({ goal, onEdit, onContribute }) => {
    const context = useContext(FinanceContext);
    const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col">
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold">{goal.name}</h3>
                    <div className="text-right">
                        <p className="text-lg font-bold text-primary-500">${goal.currentAmount.toFixed(2)}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">sur ${goal.targetAmount.toFixed(2)}</p>
                    </div>
                </div>
                <div className="mt-4">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                        <div className="bg-green-500 h-4 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                    </div>
                    <p className="text-right text-sm mt-1 font-semibold">{progress.toFixed(1)}%</p>
                </div>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                    {daysLeft > 0 ? `${daysLeft} jours restants` : 'Date limite atteinte !'}
                </p>
            </div>
            <div className="flex justify-end items-center gap-2 border-t pt-4 mt-4 dark:border-gray-700">
                <button onClick={onContribute} className="bg-secondary-500 text-white px-3 py-1 rounded-lg text-sm">Contribuer</button>
                <button onClick={onEdit} className="text-gray-500 hover:text-primary-500" aria-label="Modifier"><EditIcon /></button>
                <button onClick={() => context?.deleteGoal(goal.id)} className="text-gray-500 hover:text-red-500" aria-label="Supprimer"><TrashIcon /></button>
            </div>
        </div>
    );
};

// Contribution Modal
interface ContributionModalProps {
    isOpen: boolean;
    onClose: () => void;
    goal: FinancialGoal;
}

const ContributionModal: React.FC<ContributionModalProps> = ({ isOpen, onClose, goal }) => {
    const context = useContext(FinanceContext);
    const [amount, setAmount] = useState(0);

    if (!isOpen || !context) return null;
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(amount > 0) {
            context.contributeToGoal(goal.id, amount);
        }
        onClose();
        setAmount(0);
    }
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
             <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-sm">
                 <h2 className="text-2xl font-bold mb-2">Contribuer à</h2>
                 <p className="text-lg text-primary-500 mb-4">{goal.name}</p>
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Montant de la Contribution</label>
                        <input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded" autoFocus required />
                    </div>
                     <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600">Annuler</button>
                        <button type="submit" className="px-4 py-2 rounded bg-primary-500 text-white">Ajouter</button>
                    </div>
                 </form>
             </div>
        </div>
    );
}

// Main Goals Page Component
const Goals: React.FC = () => {
    const context = useContext(FinanceContext);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [isContribModalOpen, setIsContribModalOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | undefined>();

    if (!context) return null;
    const { goals } = context.appState;

    const handleAddNew = () => {
        setSelectedGoal(undefined);
        setIsGoalModalOpen(true);
    };

    const handleEdit = (goal: FinancialGoal) => {
        setSelectedGoal(goal);
        setIsGoalModalOpen(true);
    };

    const handleContribute = (goal: FinancialGoal) => {
        setSelectedGoal(goal);
        setIsContribModalOpen(true);
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Objectifs Financiers</h1>
                <button onClick={handleAddNew} className="bg-primary-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"><PlusIcon /> Ajouter un Objectif</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.length > 0 ? goals.map(g => (
                    <GoalCard key={g.id} goal={g} onEdit={() => handleEdit(g)} onContribute={() => handleContribute(g)} />
                )) : (
                    <div className="col-span-full text-center p-12 text-gray-500 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <GoalsIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h2 className="text-xl font-semibold">Aucun objectif défini.</h2>
                        <p className="mt-2">Définir des objectifs est la première étape pour les atteindre. Ajoutez-en un pour commencer !</p>
                    </div>
                )}
            </div>

            <GoalModal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} goal={selectedGoal} />
            {selectedGoal && <ContributionModal isOpen={isContribModalOpen} onClose={() => setIsContribModalOpen(false)} goal={selectedGoal} />}
        </div>
    );
};

export default Goals;
