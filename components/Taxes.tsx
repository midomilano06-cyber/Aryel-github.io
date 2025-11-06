
import React, { useState, useMemo } from 'react';
import { FEDERAL_TAX_BRACKETS, QUEBEC_TAX_BRACKETS } from '../constants';

const calculateProgressiveTax = (income: number, brackets: { limit: number, rate: number }[]) => {
    let tax = 0;
    let remainingIncome = income;
    let previousLimit = 0;

    for (const bracket of brackets) {
        if (remainingIncome <= 0) break;
        
        const taxableInBracket = Math.min(remainingIncome, bracket.limit - previousLimit);
        tax += taxableInBracket * bracket.rate;
        remainingIncome -= taxableInBracket;
        previousLimit = bracket.limit;
    }
    
    return tax;
};


const Taxes: React.FC = () => {
    const [income, setIncome] = useState(0);
    const [rrsp, setRrsp] = useState(0);
    const [donations, setDonations] = useState(0);
    const [medical, setMedical] = useState(0);

    const taxCalculation = useMemo(() => {
        const taxableIncome = Math.max(0, income - rrsp);
        
        const federalTax = calculateProgressiveTax(taxableIncome, FEDERAL_TAX_BRACKETS);
        const quebecTax = calculateProgressiveTax(taxableIncome, QUEBEC_TAX_BRACKETS);

        // Simplified credit calculation
        const federalDonationCredit = Math.min(donations * 0.15, taxableIncome * 0.15);
        const quebecDonationCredit = Math.min(donations * 0.14, taxableIncome * 0.14);
        
        // Medical expense credit is more complex, this is a simplification
        const federalMedicalCredit = Math.max(0, medical - 2635) * 0.15;
        const quebecMedicalCredit = Math.max(0, medical - (taxableIncome * 0.03)) * 0.14;

        const totalFederalTax = federalTax - federalDonationCredit - federalMedicalCredit;
        const totalQuebecTax = quebecTax - quebecDonationCredit - quebecMedicalCredit;

        const totalTax = totalFederalTax + totalQuebecTax;

        return {
            taxableIncome,
            federalTax: totalFederalTax,
            quebecTax: totalQuebecTax,
            totalTax,
        };
    }, [income, rrsp, donations, medical]);

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white">Simulateur d'Impôts (Québec/Canada)</h1>
            <p className="text-center text-gray-500 dark:text-gray-400">Estimez votre impôt sur le revenu annuel. Ceci est à titre informatif seulement.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
                    <h2 className="text-xl font-semibold">Revenus & Déductions</h2>
                    <div>
                        <label className="block text-sm font-medium">Revenu Annuel Brut</label>
                        <input type="number" value={income} onChange={e => setIncome(parseFloat(e.target.value) || 0)} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Cotisations REER</label>
                        <input type="number" value={rrsp} onChange={e => setRrsp(parseFloat(e.target.value) || 0)} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Dons de Charité</label>
                        <input type="number" value={donations} onChange={e => setDonations(parseFloat(e.target.value) || 0)} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Frais Médicaux</label>
                        <input type="number" value={medical} onChange={e => setMedical(parseFloat(e.target.value) || 0)} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded" />
                    </div>
                </div>
                
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col justify-center">
                    <h2 className="text-xl font-semibold mb-4">Estimation de l'Impôt</h2>
                    <div className="space-y-3">
                         <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Revenu Imposable:</span> <span className="font-medium">${taxCalculation.taxableIncome.toFixed(2)}</span></div>
                         <hr className="dark:border-gray-700"/>
                         <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Impôt Fédéral Estimé:</span> <span className="font-medium">${taxCalculation.federalTax.toFixed(2)}</span></div>
                         <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Impôt du Québec Estimé:</span> <span className="font-medium">${taxCalculation.quebecTax.toFixed(2)}</span></div>
                         <hr className="dark:border-gray-700"/>
                         <div className="flex justify-between font-bold text-2xl text-primary-600 dark:text-primary-400 mt-4"><span>Total de l'Impôt Dû:</span> <span>${taxCalculation.totalTax.toFixed(2)}</span></div>
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default Taxes;
