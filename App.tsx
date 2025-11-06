
import React, { useState, useContext, useEffect, Suspense, lazy } from 'react';
import { FinanceProvider, FinanceContext, Page } from './context/FinanceContext';
import Auth from './components/Auth';
import { CompassIcon } from './components/Icons';
import { Toast as ToastType } from './types';
import Sidebar from './components/Sidebar';

// Lazy load page components
const Dashboard = lazy(() => import('./components/Dashboard'));
const Transactions = lazy(() => import('./components/Transactions'));
const Debts = lazy(() => import('./components/Debts'));
const Investments = lazy(() => import('./components/Investments'));
const Zakat = lazy(() => import('./components/Zakat'));
const Taxes = lazy(() => import('./components/Taxes'));
const AIChat = lazy(() => import('./components/AIChat'));
const Settings = lazy(() => import('./components/Settings'));
const Goals = lazy(() => import('./components/Goals'));


const Toast: React.FC<{ toast: ToastType; onDismiss: () => void }> = ({ toast, onDismiss }) => {
    const { type, message } = toast;
    const baseClasses = "flex items-center w-full max-w-xs p-4 space-x-4 rtl:space-x-reverse divide-x rtl:divide-x-reverse rounded-lg shadow text-gray-500 dark:text-gray-400 divide-gray-200 dark:divide-gray-700 space-x";
    const typeClasses = {
        success: "bg-green-100 dark:bg-green-800 text-green-500 dark:text-green-200",
        error: "bg-red-100 dark:bg-red-800 text-red-500 dark:text-red-200",
        info: "bg-blue-100 dark:bg-blue-800 text-blue-500 dark:text-blue-200",
    };
    const iconClasses = {
        success: "fa-solid fa-check-circle",
        error: "fa-solid fa-exclamation-triangle",
        info: "fa-solid fa-info-circle",
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onDismiss]);


    return (
        <div className={`${baseClasses} ${typeClasses[type]}`} role="alert">
            <i className={`${iconClasses[type]} w-5 h-5`}></i>
            <div className="ps-4 text-sm font-normal">{message}</div>
            <button onClick={onDismiss} aria-label="Fermer" className="p-1.5 -m-1.5 ms-auto inline-flex items-center justify-center h-8 w-8 text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-500 dark:hover:text-white">
                <span className="sr-only">Fermer</span>
                <i className="fa-solid fa-times w-3 h-3"></i>
            </button>
        </div>
    );
};

const ToastContainer: React.FC = () => {
    const context = useContext(FinanceContext);
    if (!context) return null;

    return (
        <div className="fixed top-5 right-5 z-50 space-y-4">
            {context.toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onDismiss={() => context.removeToast(toast.id)} />
            ))}
        </div>
    );
};


const PageContent: React.FC = () => {
    const context = useContext(FinanceContext);

    if (!context) {
        return <LoadingScreen message="Initialisation du contexte..." />;
    }

    const { page } = context;

    const renderPage = () => {
        switch (page) {
            case Page.Dashboard:
                return <Dashboard />;
            case Page.Transactions:
                return <Transactions />;
            case Page.Goals:
                return <Goals />;
            case Page.Debts:
                return <Debts />;
            case Page.Investments:
                return <Investments />;
            case Page.Zakat:
                return <Zakat />;
            case Page.Taxes:
                return <Taxes />;
            case Page.AIChat:
                return <AIChat />;
            case Page.Settings:
                return <Settings />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <Suspense fallback={<LoadingScreen message="Chargement de la page..." />}>
            {renderPage()}
        </Suspense>
    )
};

const LoadingScreen: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <CompassIcon className="w-16 h-16 text-primary-500 animate-spin" />
        <h1 className="text-2xl font-bold mt-4">Hadj Finance</h1>
        <p className="mt-2">{message}</p>
    </div>
);

const AppContainer: React.FC = () => {
    const context = useContext(FinanceContext);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (context) {
            const root = window.document.documentElement;
            if (context.theme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
    }, [context?.theme]);

    if (!context || context.isInitializing) {
        return (
            <div className="h-screen w-screen">
                <LoadingScreen message="Chargement de vos données financières..." />
            </div>
        );
    }

    if (context.isLocked) {
        return <Auth />;
    }
    
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <main className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 md:hidden">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-gray-500 focus:outline-none" aria-label="Ouvrir le menu">
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                    <h1 className="text-xl font-semibold">Hadj Finance</h1>
                </div>
                <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">
                    <PageContent />
                </div>
            </main>
            <ToastContainer />
        </div>
    );
};


const App: React.FC = () => {
  return (
    <FinanceProvider>
        <AppContainer />
    </FinanceProvider>
  );
};

export default App;
