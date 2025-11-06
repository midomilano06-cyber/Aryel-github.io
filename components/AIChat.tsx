
import React, { useContext, useState, useRef, useEffect } from 'react';
import { FinanceContext } from '../context/FinanceContext';
import { ChatMessage } from '../types';
import { getAIChatResponse } from '../services/geminiService';
import { AIChatIcon } from './Icons';

const AIChat: React.FC = () => {
    const context = useContext(FinanceContext);
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);
    
    const handleSend = async () => {
        if (!input.trim() || !context) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        const newHistory = [...history, userMessage];
        setHistory(newHistory);
        setInput('');
        setIsLoading(true);

        const responseText = await getAIChatResponse(newHistory, context.appState);
        
        const modelMessage: ChatMessage = { role: 'model', text: responseText };
        setHistory(prev => [...prev, modelMessage]);
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Discuter avec Hadj</h1>
            <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md overflow-y-auto">
                <div className="space-y-4">
                     {history.length === 0 && (
                        <div className="text-center text-gray-500 dark:text-gray-400 p-8">
                            <AIChatIcon className="w-12 h-12 mx-auto mb-4" />
                            <p>Posez n'importe quelle question sur vos finances. Hadj a connaissance de votre situation et peut fournir des conseils personnalisés.</p>
                        </div>
                    )}
                    {history.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white flex-shrink-0"><AIChatIcon /></div>}
                            <div className={`p-3 rounded-lg max-w-lg ${msg.role === 'user' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                {msg.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white flex-shrink-0"><AIChatIcon /></div>
                            <div className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700">
                                <span className="animate-pulse">Hadj réfléchit...</span>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
            </div>
            <div className="mt-4 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                    placeholder="Demandez à Hadj quoi que ce soit sur vos finances..."
                    className="flex-1 bg-white dark:bg-gray-700 p-3 border dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    disabled={isLoading}
                />
                <button onClick={handleSend} disabled={isLoading} className="bg-primary-500 text-white px-6 py-3 rounded-lg disabled:bg-gray-400">
                    Envoyer
                </button>
            </div>
        </div>
    );
};

export default AIChat;
