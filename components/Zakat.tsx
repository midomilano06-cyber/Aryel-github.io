
import React, { useContext, useMemo } from 'react';
import { FinanceContext } from '../context/FinanceContext';
import { GOLD_PRICE_PER_GRAM_USD, NISAB_GOLD_GRAMS } from '../constants';

const Zakat: React.FC = () => {
    const context = useContext(FinanceContext);

    const zakatData = useMemo(() => {
        if (!context) return null;
        const { appState } = context;

        const nisabValue = NISAB_GOLD_GRAMS * GOLD_PRICE_PER_GRAM_USD;
        const goldValue = appState.goldGrams * GOLD_PRICE_PER_GRAM_USD;
        
        const totalDeductibleDebts = appState.debts.reduce((sum, debt) => sum + debt.amount, 0);
        
        const zakatableAssets = appState.savings + goldValue;
        
        const netZakatableAmount = zakatableAssets - totalDeductibleDebts;
        
        const isNisabMet = netZakatableAmount >= nisabValue;
        
        const zakatDue = isNisabMet ? netZakatableAmount * 0.025 : 0;
        
        return {
            nisabValue,
            goldValue,
            savings: appState.savings,
            totalDeductibleDebts,
            zakatableAssets,
            netZakatableAmount,
            isNisabMet,
            zakatDue
        };
    }, [context]);

    if (!context || !zakatData) return <div>Chargement...</div>;

    const { setAppState, appState } = context;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white">Calculateur de Zakat</h1>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 border-b pb-2 dark:border-gray-700">1. Actifs Soumis à la Zakat</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Épargne Monétaire</label>
                        <input
                            type="number"
                            value={appState.savings}
                            onChange={e => setAppState(s => ({ ...s, savings: parseFloat(e.target.value) || 0 }))}
                            className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Avoirs en Or (grammes)</label>
                        <input
                            type="number"
                            value={appState.goldGrams}
                            onChange={e => setAppState(s => ({ ...s, goldGrams: parseFloat(e.target.value) || 0 }))}
                            className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded"
                        />
                         <p className="text-xs text-gray-500 mt-1">Valeur: ~${zakatData.goldValue.toFixed(2)} USD</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-2">2. Dettes Déductibles</h2>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Votre dette totale actuelle de la section Dettes est automatiquement déduite.</p>
                 <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                     <p className="font-medium">Total des Dettes Déductibles: <span className="font-bold text-red-500">${zakatData.totalDeductibleDebts.toFixed(2)}</span></p>
                 </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                 <h2 className="text-xl font-semibold mb-4 border-b pb-2 dark:border-gray-700">3. Résumé du Calcul</h2>
                 <div className="space-y-3">
                     <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Total des Actifs Soumis à la Zakat:</span> <span className="font-medium">${zakatData.zakatableAssets.toFixed(2)}</span></div>
                     <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Total des Dettes Déductibles:</span> <span className="font-medium text-red-500">-${zakatData.totalDeductibleDebts.toFixed(2)}</span></div>
                     <hr className="dark:border-gray-700"/>
                     <div className="flex justify-between font-bold text-lg"><span >Montant Net Soumis à la Zakat:</span> <span>${zakatData.netZakatableAmount.toFixed(2)}</span></div>
                 </div>
            </div>

            <div className={`p-8 rounded-lg shadow-lg text-center ${zakatData.isNisabMet ? 'bg-green-100 dark:bg-green-900/50' : 'bg-yellow-100 dark:bg-yellow-900/50'}`}>
                <p className="text-sm text-gray-600 dark:text-gray-300">Seuil du Nisab (85g d'Or): ~${zakatData.nisabValue.toFixed(2)} USD</p>
                <h2 className={`text-2xl font-bold mt-2 ${zakatData.isNisabMet ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'}`}>
                    {zakatData.isNisabMet ? 'Le Nisab est atteint.' : 'Le Nisab n\'est pas atteint.'}
                </h2>
                <p className="text-4xl font-extrabold text-primary-600 dark:text-primary-400 mt-6">${zakatData.zakatDue.toFixed(2)}</p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">Total Zakat Dû</p>
            </div>
        </div>
    );
};

export default Zakat;
