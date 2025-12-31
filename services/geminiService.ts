
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, Message, Fortune, MemoryPair } from "../types";

// Helper pour lire les variables d'environnement (Compatible Vite & Standard)
const getEnv = (key: string) => {
  try {
    // @ts-ignore - Support Vite
    if (import.meta && import.meta.env) {
      // @ts-ignore
      const val = import.meta.env[`VITE_${key}`] || import.meta.env[key];
      if (val) return val;
    }
  } catch (e) {}
  
  try {
    // Support Node/Webpack
    if (typeof process !== 'undefined' && process.env) {
      return process.env[`VITE_${key}`] || process.env[key];
    }
  } catch (e) {}
  
  return undefined;
};

// Initialisation avec support Vite
const apiKey = getEnv('API_KEY');
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

const BASE_INSTRUCTION = `
Tu es "Lǎoshī Bot", l'assistant pédagogique officiel du Groupe 5.
Ton : Formel, expert, dévoué.
Aide les étudiants en Licence 1 Chinois pour leurs devoirs et révisions.
`;

export const geminiService = {
  async *streamChatResponse(prompt: string, history: Message[] = [], userMemory: string = "", userName: string = "") {
    if (!apiKey) {
      yield "⚠️ Erreur : Clé API manquante. Vérifiez la variable VITE_API_KEY sur Vercel.";
      return;
    }

    try {
      const historyFormatted = history.slice(-10).map(msg => ({
        role: msg.isAi ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      const response = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: [
            { role: 'user', parts: [{ text: `${BASE_INSTRUCTION}\nContexte: ${userMemory}\nUtilisateur: ${userName}` }] },
            ...historyFormatted as any,
            { role: 'user', parts: [{ text: prompt }] }
        ],
        config: { temperature: 0.7 }
      });

      for await (const chunk of response) {
        yield chunk.text || "";
      }
    } catch (error: any) {
      yield `❌ Erreur IA : ${error.message}`;
    }
  },

  async generateFortune(): Promise<Fortune | null> {
    try {
      const resp = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Génère un proverbe chinois (Chengyu) avec Pinyin, traduction française et un conseil.",
        config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                chengyu: { type: Type.STRING },
                pinyin: { type: Type.STRING },
                translation: { type: Type.STRING },
                advice: { type: Type.STRING },
                luckyColor: { type: Type.STRING }
              },
              required: ["chengyu", "pinyin", "translation", "advice", "luckyColor"]
            }
        }
      });
      return JSON.parse(resp.text || "{}");
    } catch (e) {
      return null;
    }
  }
};
