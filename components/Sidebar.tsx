
import React, { useContext } from 'react';
import { FinanceContext, Page } from '../context/FinanceContext';
import { Theme } from '../types';
import {
    DashboardIcon, TransactionsIcon, DebtsIcon, InvestmentsIcon, ZakatIcon, TaxesIcon,
    AIChatIcon, SettingsIcon, CompassIcon, SunIcon, MoonIcon, LogoutIcon, GoalsIcon
} from './Icons';

interface SidebarProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, setIsSidebarOpen }) => {
    const context = useContext(FinanceContext);

    if (!context) return null;

    const { page, setPage, theme, toggleTheme, logout } = context;

    const navItems = [
        { name: Page.Dashboard, icon: DashboardIcon },
        { name: Page.Transactions, icon: TransactionsIcon },
        { name: Page.Goals, icon: GoalsIcon },
        { name: Page.Debts, icon: DebtsIcon },
        { name: Page.Investments, icon: InvestmentsIcon },
        { name: Page.Zakat, icon: ZakatIcon },
        { name: Page.Taxes, icon: TaxesIcon },
        { name: Page.AIChat, icon: AIChatIcon },
        { name: Page.Settings, icon: SettingsIcon },
    ];

    const NavLink: React.FC<{ item: typeof navItems[0] }> = ({ item }) => (
        <button
            onClick={() => {
                setPage(item.name);
                setIsSidebarOpen(false);
            }}
            className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors duration-200 rounded-lg ${
                page === item.name
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
            <item.icon className="w-5 h-5 mr-3" />
            <span>{item.name}</span>
        </button>
    );
    
    const sidebarContent = (
         <div className="flex flex-col justify-between h-full p-4">
            <div>
                <div className="flex items-center mb-8">
                    <CompassIcon className="w-8 h-8 text-primary-500" />
                    <span className="ml-3 text-xl font-bold text-gray-800 dark:text-white">Hadj Finance</span>
                </div>
                <nav className="space-y-2">
                    {navItems.map((item) => <NavLink key={item.name} item={item} />)}
                </nav>
            </div>
            <div className="space-y-2">
                 <button
                    onClick={toggleTheme}
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                >
                    {theme === Theme.Light ? <MoonIcon className="w-5 h-5 mr-3" /> : <SunIcon className="w-5 h-5 mr-3" />}
                    <span>{theme === Theme.Light ? 'Mode Sombre' : 'Mode Clair'}</span>
                </button>
                <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg"
                >
                    <LogoutIcon className="w-5 h-5 mr-3" />
                    <span>Déconnexion & Verrouiller</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
               {sidebarContent}
            </aside>

             {/* Mobile Sidebar */}
            <div className={`fixed inset-0 z-30 transition-opacity bg-black bg-opacity-50 md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)}></div>
            <aside className={`fixed top-0 left-0 z-40 w-64 h-full transform md:hidden bg-white dark:bg-gray-800 transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
               {sidebarContent}
            </aside>
        </>
    );
};

export default Sidebar;
