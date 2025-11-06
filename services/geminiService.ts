import { GoogleGenAI, Type } from "@google/genai";
import { AppState, Investment, ChatMessage } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Clé API Gemini non trouvée. Les fonctionnalités IA seront désactivées.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });
const modelFlash = 'gemini-2.5-flash';
const modelPro = 'gemini-2.5-pro';

function getFinancialSummary(state: AppState): string {
    const totalIncome = state.transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = state.transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const totalDebt = state.debts.reduce((acc, d) => acc + d.amount, 0);
    const totalInvestments = state.investments.reduce((acc, i) => acc + i.amount, 0);
    // Corrected net worth calculation: Assets - Liabilities
    const netWorth = (state.savings + totalInvestments) - totalDebt;

    return `
    - Revenu total (historique): ${totalIncome.toFixed(2)}
    - Dépenses totales (historique): ${totalExpenses.toFixed(2)}
    - Épargne actuelle: ${state.savings.toFixed(2)}
    - Dette totale: ${totalDebt.toFixed(2)}
    - Investissements totaux: ${totalInvestments.toFixed(2)}
    - Valeur nette estimée: ${netWorth.toFixed(2)}
    - Avoirs en or: ${state.goldGrams} grammes
    `;
}

export const getDashboardInsights = async (state: AppState) => {
    if (!API_KEY) return [];
    try {
        const prompt = `En vous basant sur le résumé financier suivant, fournissez 2-3 conseils concis et actionnables en français pour l'utilisateur. Classez chaque conseil comme 'success', 'warning', ou 'info'. L'utilisateur vient du Canada/Québec/Algérie, donc gardez les conseils culturellement pertinents si possible. Concentrez-vous sur des conseils proactifs. Résumé financier : ${getFinancialSummary(state)}`;

        const response = await ai.models.generateContent({
            model: modelFlash,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, enum: ['success', 'warning', 'info'] },
                            text: { type: Type.STRING, description: "Le conseil en français." }
                        },
                        required: ["type", "text"]
                    }
                }
            }
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Error fetching dashboard insights:", error);
        return [];
    }
};

export const analyzeInvestment = async (investment: Investment, state: AppState) => {
    if (!API_KEY) return null;
    try {
        const complianceNote = investment.isShariaCompliant ? "L'utilisateur a marqué ceci comme étant conforme à la Charia. Analysez-le en gardant à l'esprit les principes de la finance islamique (par exemple, pas de Riba/intérêt, secteurs éthiques)." : "La conformité à la Charia n'est pas spécifiée.";

        const prompt = `Analysez cette opportunité d'investissement dans le contexte de la situation financière de l'utilisateur.
        Résumé financier de l'utilisateur : ${getFinancialSummary(state)}
        Détails de l'investissement :
        - Nom : ${investment.name}
        - Montant : ${investment.amount}
        - Secteur : ${investment.sector}
        - Pays : ${investment.country}
        - Niveau de risque : ${investment.riskLevel}
        - Notes : ${investment.notes}
        - ${complianceNote}
        
        Fournissez une analyse détaillée en français. Votre réponse doit être au format JSON.
        `;

        const response = await ai.models.generateContent({
            model: modelPro,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        recommendation: { type: Type.STRING, enum: ['Recommandé', 'Non Recommandé', 'Neutre'] },
                        reasoning: { type: Type.STRING, description: "Le raisonnement détaillé en français." },
                        potentialProfitability: { type: Type.STRING, description: "Une évaluation de la rentabilité potentielle en français." },
                        riskAssessment: { type: Type.STRING, description: "Une évaluation des risques en français." }
                    },
                    required: ["recommendation", "reasoning", "potentialProfitability", "riskAssessment"]
                }
            }
        });
        
        const jsonString = response.text.trim();
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error analyzing investment:", error);
        return null;
    }
};


export const getAIChatResponse = async (history: ChatMessage[], state: AppState) => {
    if (!API_KEY) return "Les fonctionnalités IA sont actuellement désactivées. Aucune clé API n'est fournie.";
    try {
        const formattedHistory = history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));

        const systemInstruction = `Vous êtes Hadj, un assistant financier amical et compétent. Vous aidez un utilisateur à gérer ses finances avec l'application Hadj Finance. Son résumé financier actuel est le suivant : ${getFinancialSummary(state)}. Gardez vos réponses utiles, concises et culturellement adaptées au Canada/Québec et à l'Algérie. Répondez toujours en français.`;

        // We create a new chat session for each request to inject the latest financial summary
        // This is a stateless approach suitable for this app's design.
        const chat = ai.chats.create({
            model: modelFlash,
            config: { systemInstruction },
            history: formattedHistory.slice(0, -1), // Send all but the last message as history
        });
        
        const lastMessageText = history[history.length - 1]?.text;
        if (!lastMessageText) {
            return "Je suis désolé, je n'ai pas reçu de message.";
        }

        const result = await chat.sendMessage({ message: lastMessageText });
        
        return result.text;
    } catch (error) {
        console.error("Error getting AI chat response:", error);
        return "Je suis désolé, j'ai rencontré une erreur. Veuillez réessayer plus tard.";
    }
};
