
import React, { useState, useContext } from 'react';
import { FinanceContext } from '../context/FinanceContext';
import { CompassIcon } from './Icons';

const Auth: React.FC = () => {
    const context = useContext(FinanceContext);
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSettingPassword, setIsSettingPassword] = useState(localStorage.getItem('hadj-finance-encrypted') !== 'true');

    if (!context) return null;

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const success = await context.unlock(password);
        if (!success) {
            setError('Mot de passe invalide. Veuillez réessayer.');
        }
    };

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }
        await context.setPassword(newPassword);
        // The app will re-render into a locked state, so we just need to clear fields
        setNewPassword('');
        setConfirmPassword('');
        setIsSettingPassword(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <div className="text-center">
                    <CompassIcon className="w-12 h-12 mx-auto text-primary-500" />
                    <h1 className="mt-4 text-3xl font-bold text-gray-800 dark:text-white">Bienvenue sur Hadj Finance</h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Votre Boussole Financière Personnelle</p>
                </div>
                
                {isSettingPassword ? (
                    <form onSubmit={handleSetPassword} className="space-y-6">
                        <h2 className="text-xl font-semibold text-center">Créez votre mot de passe</h2>
                        <p className="text-sm text-center text-gray-500">
                            Vos données seront chiffrées dans un coffre-fort numérique sur cet appareil. Votre mot de passe est la seule clé.
                            <strong className="text-red-500 block mt-2">Nous ne pouvons JAMAIS récupérer votre mot de passe, alors ne l'oubliez pas !</strong>
                        </p>
                        <div>
                            <label className="block text-sm font-medium">Nouveau mot de passe</label>
                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Confirmez le mot de passe</label>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded" required />
                        </div>
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <button type="submit" className="w-full px-4 py-2 text-white bg-primary-600 rounded-md hover:bg-primary-700">Définir le mot de passe & Chiffrer</button>
                    </form>
                ) : (
                    <form onSubmit={handleUnlock} className="space-y-6">
                         <h2 className="text-xl font-semibold text-center">Déverrouillez vos données</h2>
                        <div>
                            <label className="block text-sm font-medium">Mot de passe</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 p-2 border dark:border-gray-600 rounded" required autoFocus />
                        </div>
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <button type="submit" className="w-full px-4 py-2 text-white bg-primary-600 rounded-md hover:bg-primary-700">Déverrouiller</button>
                    </form>
                )}
                 <div className="text-center">
                    <button onClick={() => { setIsSettingPassword(!isSettingPassword); setError(''); }} className="text-sm text-primary-500 hover:underline">
                        {isSettingPassword ? 'Déjà un mot de passe ? Se connecter' : 'Configurer ou réinitialiser le mot de passe'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;
