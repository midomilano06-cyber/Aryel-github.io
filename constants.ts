
import { Category } from './types';

export const INITIAL_CATEGORIES: Category[] = [
    // Dépenses
    { id: 'cat-exp-1', name: 'Logement', type: 'expense' },
    { id: 'cat-exp-2', name: 'Transport', type: 'expense' },
    { id: 'cat-exp-3', name: 'Alimentation', type: 'expense' },
    { id: 'cat-exp-4', name: 'Services publics', type: 'expense' },
    { id: 'cat-exp-5', name: 'Assurances', type: 'expense' },
    { id: 'cat-exp-6', name: 'Santé', type: 'expense' },
    { id: 'cat-exp-7', name: 'Dépenses personnelles', type: 'expense' },
    { id: 'cat-exp-8', name: 'Divertissement', type: 'expense' },
    { id: 'cat-exp-9', name: 'Abonnements', type: 'expense' },
    { id: 'cat-exp-10', name: 'Remboursement de dettes', type: 'expense' },
    { id: 'cat-exp-11', name: 'Charité', type: 'expense' },
    { id: 'cat-exp-12', name: 'Autre', type: 'expense' },

    // Revenus
    { id: 'cat-inc-1', name: 'Salaire', type: 'income' },
    { id: 'cat-inc-2', name: 'Freelance', type: 'income' },
    { id: 'cat-inc-3', name: 'Investissement', type: 'income' },
    { id: 'cat-inc-4', name: 'Cadeau', type: 'income' },
    { id: 'cat-inc-5', name: 'Autre', type: 'income' },
];

export const GOLD_PRICE_PER_GRAM_USD = 65.0; // Placeholder value, in a real app this would be fetched from an API
export const NISAB_GOLD_GRAMS = 85;

// 2023 Tax Brackets (Simplified) - For demonstration purposes
export const FEDERAL_TAX_BRACKETS = [
    { limit: 53359, rate: 0.15 },
    { limit: 106717, rate: 0.205 },
    { limit: 165430, rate: 0.26 },
    { limit: 235675, rate: 0.29 },
    { limit: Infinity, rate: 0.33 }
];

export const QUEBEC_TAX_BRACKETS = [
    { limit: 49275, rate: 0.14 },
    { limit: 98540, rate: 0.19 },
    { limit: 119910, rate: 0.24 },
    { limit: Infinity, rate: 0.2575 }
];
