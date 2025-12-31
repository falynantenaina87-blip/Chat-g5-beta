
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, Message, Fortune, MemoryPair } from "../types";

// Accès direct à la clé d'environnement selon les standards du projet
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BASE_INSTRUCTION = `
Tu es "Lǎoshī Bot", l'assistant pédagogique officiel du Groupe 5.
Ton : Formel, expert, dévoué.
Aide les étudiants en Licence 1 Chinois pour leurs devoirs et révisions.
`;

export const geminiService = {
  async *streamChatResponse(prompt: string, history: Message[] = [], userMemory: string = "", userName: string = "") {
    if (!process.env.API_KEY) {
      yield "⚠️ Erreur : Clé API manquante. Contactez l'administrateur.";
      return;
    }

    try {
      const historyFormatted = history.slice(-10).map(msg => ({
        role: msg.isAi ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      // Correct: Use ai.models.generateContentStream and await the call
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
        // Correct: Accessing .text property directly
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
      // Correct: Accessing .text property directly
      return JSON.parse(resp.text || "{}");
    } catch (e) {
      return null;
    }
  }
};
