import React, { useContext, useRef, useState } from 'react';
import { FinanceContext } from '../context/FinanceContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Transaction } from '../types';

// Robust CSV parser that handles quoted fields
const parseCSV = (csvText: string): Omit<Transaction, 'id' | 'categoryId'>[] => {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) throw new Error("CSV invalide: En-tête ou données manquantes.");

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const dateIndex = headers.indexOf('date');
    const descriptionIndex = headers.indexOf('description');
    const amountIndex = headers.indexOf('amount');

    if (dateIndex === -1 || descriptionIndex === -1 || amountIndex === -1) {
        throw new Error("En-têtes CSV invalides. Doit inclure 'date', 'description', et 'amount'.");
    }

    const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^",]*))/g;
    
    return lines.slice(1).map(line => {
        let values: string[] = [];
        let match;
        while ((match = regex.exec(line))) {
            values.push(match[1] ? match[1].replace(/""/g, '"') : match[2]);
        }

        if (values.length < headers.length) {
            console.warn("Ligne CSV mal formée ignorée:", line);
            return null;
        }

        const date = new Date(values[dateIndex].trim());
        const description = values[descriptionIndex].trim();
        const amount = parseFloat(values[amountIndex].trim());

        if (isNaN(date.getTime()) || !description || isNaN(amount)) {
            console.warn("Ligne CSV ignorée (données invalides):", line);
            return null;
        }

        return {
            date: date.toISOString(),
            description,
            amount: Math.abs(amount),
            type: amount >= 0 ? 'income' : 'expense'
        };
    }).filter((t): t is Omit<Transaction, 'id' | 'categoryId'> => t !== null);
};


const Settings: React.FC = () => {
    const context = useContext(FinanceContext);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const csvFileInputRef = useRef<HTMLInputElement>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);

    if (!context) return null;
    const { appState, setAppState, addToast, addMultipleTransactions } = context;

    const handleExport = () => {
        try {
            const dataStr = JSON.stringify(appState, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const exportFileDefaultName = 'hadj-finance-sauvegarde.json';

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            addToast("Données exportées avec succès.", "success");
        } catch(error){
            addToast("Échec de l'exportation des données.", "error");
            console.error(error);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setPendingFile(event.target.files[0]);
            setShowConfirmModal(true);
        }
    };
    
    const proceedWithImport = () => {
        if (!pendingFile) return;

        const fileReader = new FileReader();
        fileReader.readAsText(pendingFile, "UTF-8");
        fileReader.onload = e => {
            if (e.target && typeof e.target.result === 'string') {
                try {
                    const importedState = JSON.parse(e.target.result);
                    // Basic validation
                    if (typeof importedState.transactions !== 'undefined' && typeof importedState.categories !== 'undefined') {
                        setAppState(s => ({ ...s, ...importedState }));
                        addToast("Données importées avec succès !", 'success');
                    } else {
                        throw new Error("Format de fichier invalide");
                    }
                } catch (error) {
                    addToast("Échec de l'importation des données. Fichier corrompu ou format incorrect.", 'error');
                } finally {
                    resetImport();
                }
            }
        };
        fileReader.onerror = () => {
            addToast("Erreur de lecture du fichier.", "error");
            resetImport();
        }
    };
    
    const resetImport = () => {
        setShowConfirmModal(false);
        setPendingFile(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const otherCategoryId = appState.categories.find(c => c.name.toLowerCase() === 'autre' && c.type === 'expense')?.id || '';
                const parsedTransactions = parseCSV(text).map(t => ({...t, categoryId: otherCategoryId}));
                addMultipleTransactions(parsedTransactions);
                addToast(`${parsedTransactions.length} transactions importées avec succès.`, 'success');
            } catch (error: any) {
                addToast(`Erreur d'importation CSV: ${error.message}`, 'error');
                console.error(error);
            } finally {
                if (csvFileInputRef.current) csvFileInputRef.current.value = "";
            }
        };
        reader.readAsText(file);
    };

    const generatePDFReport = () => {
        const doc = new jsPDF();
        const getCategoryName = (id: string) => appState.categories.find(c => c.id === id)?.name || 'N/C';

        doc.setFontSize(22);
        doc.text("Hadj Finance - Rapport Financier", 14, 20);
        doc.setFontSize(12);
        doc.text(`Rapport généré le : ${new Date().toLocaleDateString('fr-CA')}`, 14, 30);
        
        const totalIncome = appState.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = appState.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const totalDebts = appState.debts.reduce((sum, d) => sum + d.amount, 0);
        const totalInvestments = appState.investments.reduce((sum, i) => sum + i.amount, 0);
        const netWorth = (appState.savings + totalInvestments) - totalDebts;

        (doc as any).autoTable({
            startY: 40,
            head: [['Métrique', 'Valeur (USD)']],
            body: [
                ['Actifs Totaux (Épargne + Investissements)', `$${(appState.savings + totalInvestments).toFixed(2)}`],
                ['Dettes Totales', `$${totalDebts.toFixed(2)}`],
                ['Valeur Nette', `$${netWorth.toFixed(2)}`],
                ['Revenu Total (Historique)', `$${totalIncome.toFixed(2)}`],
                ['Dépenses Totales (Historique)', `$${totalExpenses.toFixed(2)}`],
            ]
        });
        
        (doc as any).autoTable({
            startY: (doc as any).lastAutoTable.finalY + 10,
            head: [['Date', 'Description', 'Catégorie', 'Montant']],
            body: appState.transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => [
                new Date(t.date).toLocaleDateString('fr-CA'),
                t.description,
                getCategoryName(t.categoryId),
                `${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}`
            ])
        });

        doc.save("rapport-financier-hadj.pdf");
    };
    
    const ConfirmationModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md text-center">
                <h2 className="text-2xl font-bold mb-4">Confirmer l'Importation</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Cela écrasera toutes vos données actuelles. Cette action est irréversible. Êtes-vous sûr de vouloir continuer ?</p>
                <div className="flex justify-center gap-4">
                    <button onClick={resetImport} className="px-6 py-2 rounded bg-gray-200 dark:bg-gray-600">Annuler</button>
                    <button onClick={proceedWithImport} className="px-6 py-2 rounded bg-red-500 text-white">Confirmer & Écraser</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {showConfirmModal && <ConfirmationModal/>}
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Paramètres</h1>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-2">Gestion des Données</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Exportez vos données pour une sauvegarde (.json) ou importez-les pour restaurer votre état. Les exportations ne sont pas chiffrées.</p>
                <div className="flex flex-wrap gap-4">
                    <button onClick={handleExport} className="bg-blue-500 text-white px-4 py-2 rounded-lg">Exporter Sauvegarde (.json)</button>
                    <button onClick={() => fileInputRef.current?.click()} className="bg-blue-700 text-white px-4 py-2 rounded-lg">Importer Sauvegarde (.json)</button>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".json" className="hidden" />
                </div>
                 <hr className="my-6 dark:border-gray-700"/>
                 <h3 className="text-lg font-semibold mb-2">Importer l'historique des transactions</h3>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Importez un fichier CSV depuis votre banque pour ajouter rapidement de nombreuses transactions. Le fichier doit contenir les colonnes : `date`, `description`, `amount`.</p>
                 <button onClick={() => csvFileInputRef.current?.click()} className="bg-green-500 text-white px-4 py-2 rounded-lg">Importer Transactions (.csv)</button>
                 <input type="file" ref={csvFileInputRef} onChange={handleCSVImport} accept=".csv" className="hidden" />
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-2">Rapports</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Générez un résumé PDF professionnel de votre situation financière.</p>
                 <button onClick={generatePDFReport} className="bg-secondary-500 text-white px-4 py-2 rounded-lg">Générer un Rapport PDF</button>
            </div>

             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-2">Notre Modèle de Sécurité</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Votre vie privée est notre priorité absolue. Vos données financières sont chiffrées directement sur votre appareil à l'aide de votre mot de passe. Pensez à votre mot de passe comme la clé unique d'un coffre-fort physique.
                    <strong className="block mt-2 text-red-500">Si vous perdez cette clé, personne ne peut ouvrir le coffre-fort, pas même nous.</strong>
                    C'est pourquoi nous ne pouvons pas récupérer votre mot de passe.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    Nous vous recommandons de faire des sauvegardes régulières (export .json) et de conserver votre mot de passe dans un gestionnaire de mots de passe sécurisé. Pour définir ou modifier votre mot de passe, déconnectez-vous et utilisez l'option sur l'écran de verrouillage.
                </p>
            </div>
        </div>
    );
};

export default Settings;
