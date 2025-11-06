
import React, { useContext, useState } from 'react';
import { FinanceContext } from '../context/FinanceContext';
import { Investment } from '../types';
import { PlusIcon, EditIcon, TrashIcon, AIChatIcon } from './Icons';
import { analyzeInvestment } from '../services/geminiService';

interface InvestmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    investment?: Investment;
}

const InvestmentModal: React.FC<InvestmentModalProps> = ({ isOpen, onClose, investment }) => {
    const context = useContext(FinanceContext);
    const [name, setName] = useState('');
    const [amount, setAmount] = useState(0);
    const [sector, setSector] = useState('');
    const [country, setCountry] = useState('');
    const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
    const [isShariaCompliant, setIsShariaCompliant] = useState(false);
    const [notes, setNotes] = useState('');

    React.useEffect(() => {
        if (investment) {
            setName(investment.name);
            setAmount(investment.amount);
            setSector(investment.sector);
            setCountry(investment.country);
            setRiskLevel(investment.riskLevel);
            setIsShariaCompliant(investment.isShariaCompliant);
            setNotes(investment.notes);
        } else {
            setName(''); setAmount(0); setSector(''); setCountry('');
            setRiskLevel('medium'); setIsShariaCompliant(false); setNotes('');
        }
    }, [investment, isOpen]);

    if (!isOpen || !context) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newInvestment = { name, amount, sector, country, riskLevel, isShariaCompliant, notes };
        if (investment) {
            context.updateInvestment({ ...newInvestment, id: investment.id, aiAnalysis: investment.aiAnalysis });
        } else {
            context.addInvestment(newInvestment);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">{investment ? 'Modifier' : 'Ajouter'} un Investissement</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Nom de l'investissement</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Montant</label>
                            <input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Secteur</label>
                            <input type="text" value={sector} onChange={e => setSector(e.target.value)} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Pays</label>
                            <input type="text" value={country} onChange={e => setCountry(e.target.value)} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Niveau de risque</label>
                            <select value={riskLevel} onChange={e => setRiskLevel(e.target.value as any)} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded">
                                <option value="low">Faible</option>
                                <option value="medium">Moyen</option>
                                <option value="high">Élevé</option>
                            </select>
                        </div>
                        <div className="flex items-center justify-center">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" checked={isShariaCompliant} onChange={e => setIsShariaCompliant(e.target.checked)} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                                <span>Conforme à la Charia (Halal)</span>
                            </label>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Notes</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded" />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600">Annuler</button>
                        <button type="submit" className="px-4 py-2 rounded bg-primary-500 text-white">{investment ? 'Mettre à jour' : 'Ajouter'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const InvestmentCard: React.FC<{ investment: Investment, onEdit: (investment: Investment) => void }> = ({ investment, onEdit }) => {
    const context = useContext(FinanceContext);
    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
    
    const handleAnalyze = async () => {
        if(!context) return;
        setIsLoadingAnalysis(true);
        const analysis = await analyzeInvestment(investment, context.appState);
        if(analysis) {
            context.updateInvestment({ ...investment, aiAnalysis: analysis });
        } else {
            context.addToast("L'analyse IA a échoué.", "error");
        }
        setIsLoadingAnalysis(false);
    }
    
    const recColor = investment.aiAnalysis?.recommendation === 'Recommandé' ? 'text-green-500 bg-green-100 dark:bg-green-900/50' 
        : investment.aiAnalysis?.recommendation === 'Non Recommandé' ? 'text-red-500 bg-red-100 dark:bg-red-900/50' 
        : 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/50';

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col">
            <div className="flex-grow space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold">{investment.name}</h3>
                        <p className="text-gray-500 dark:text-gray-400">{investment.sector} - {investment.country}</p>
                    </div>
                    <div className="text-2xl font-bold text-primary-500">${investment.amount.toFixed(2)}</div>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize bg-gray-200 dark:bg-gray-700`}>{investment.riskLevel === 'low' ? 'Faible' : investment.riskLevel === 'medium' ? 'Moyen' : 'Élevé'}</span>
                    {investment.isShariaCompliant && <span className="px-2 py-1 rounded-full text-xs font-semibold text-green-700 bg-green-100 dark:bg-green-900/50">Halal</span>}
                </div>
                {investment.notes && <p className="text-sm italic text-gray-600 dark:text-gray-300">"{investment.notes}"</p>}
                
                {investment.aiAnalysis && (
                    <div className="border-t pt-4 mt-4 dark:border-gray-700 space-y-2">
                        <h4 className="font-semibold flex items-center gap-2"><AIChatIcon/> Analyse de Hadj</h4>
                        <p><span className={`font-bold px-2 py-1 rounded-md ${recColor}`}>{investment.aiAnalysis.recommendation}</span></p>
                        <p className="text-sm"><strong className="text-gray-500 dark:text-gray-400">Raisonnement :</strong> {investment.aiAnalysis.reasoning}</p>
                        <p className="text-sm"><strong className="text-gray-500 dark:text-gray-400">Rentabilité :</strong> {investment.aiAnalysis.potentialProfitability}</p>
                        <p className="text-sm"><strong className="text-gray-500 dark:text-gray-400">Risque :</strong> {investment.aiAnalysis.riskAssessment}</p>
                    </div>
                )}
            </div>

            <div className="flex justify-end items-center gap-2 border-t pt-4 mt-4 dark:border-gray-700">
                <button onClick={handleAnalyze} disabled={isLoadingAnalysis} className="bg-secondary-500 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {isLoadingAnalysis ? <><i className="fa-solid fa-spinner fa-spin"></i> Analyse...</> : <><AIChatIcon className="w-4 h-4"/> Analyser</>}
                </button>
                <button onClick={() => onEdit(investment)} className="text-gray-500 hover:text-primary-500" aria-label="Modifier"><EditIcon /></button>
                <button onClick={() => context?.deleteInvestment(investment.id)} className="text-gray-500 hover:text-red-500" aria-label="Supprimer"><TrashIcon /></button>
            </div>
        </div>
    )
}


const Investments: React.FC = () => {
    const context = useContext(FinanceContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInvestment, setEditingInvestment] = useState<Investment | undefined>();

    if (!context) return null;
    const { investments } = context.appState;
    
    const handleAddNew = () => {
        setEditingInvestment(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (investment: Investment) => {
        setEditingInvestment(investment);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Analyse d'Investissements</h1>
                <button onClick={handleAddNew} className="bg-primary-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"><PlusIcon /> Ajouter un Investissement</button>
            </div>
            
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {investments.length > 0 ? investments.map(inv => (
                    <InvestmentCard key={inv.id} investment={inv} onEdit={handleEdit} />
                )) : <div className="col-span-full text-center p-8 text-gray-500 bg-white dark:bg-gray-800 rounded-lg shadow-md">Aucun investissement suivi. Ajoutez-en un pour l'analyser avec Hadj.</div>}
            </div>

            <InvestmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} investment={editingInvestment} />
        </div>
    );
};

export default Investments;
