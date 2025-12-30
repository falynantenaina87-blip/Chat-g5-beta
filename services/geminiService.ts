
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, Message, Fortune, MemoryPair } from "../types";

// Initialisation via la clé d'environnement injectée par l'outil de build
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const BASE_INSTRUCTION = `
Tu es "G5-Tuteur", l'assistant pédagogique officiel du Groupe 5 - Licence 1 Chinois (Promotion 2025).
MISSIONS :
1. Aide aux devoirs, explication de points de grammaire (Le, Ba, Bei...), et vocabulaire HSK 1/2.
2. Toujours fournir le Pinyin pour les nouveaux caractères.
3. Refuser systématiquement les requêtes hors du cadre académique chinois.
4. Ton : Formel, encourageant, expert en linguistique.
5. Adapte-toi à l'utilisateur : Utilise le CONTEXTE ÉLÈVE ci-dessous pour personnaliser tes exemples.
`;

export const geminiService = {
  // Chat principal avec mémoire injectée
  async *streamChatResponse(prompt: string, history: Message[] = [], userMemory: string = "") {
    try {
      const dynamicInstruction = `
      ${BASE_INSTRUCTION}
      
      === CONTEXTE ÉLÈVE (Mémoire Long Terme) ===
      ${userMemory ? userMemory : "Nouvel étudiant, aucune donnée préalable."}
      ============================================
      `;

      // Transformation de l'historique de l'app vers le format Gemini
      const formattedHistory = history.map(msg => ({
        role: msg.isAi ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: dynamicInstruction,
          temperature: 0.6,
        },
        history: formattedHistory
      });

      const result = await chat.sendMessageStream({ message: prompt });
      for await (const chunk of result) {
        yield chunk.text || "";
      }
    } catch (error) {
      console.error("Gemini Error:", error);
      yield "Désolé, une erreur de communication avec le serveur pédagogique est survenue.";
    }
  },

  // Fonction cognitive : Met à jour le profil de l'étudiant
  async updateStudentProfile(oldMemory: string, lastUserMessage: string, lastAiResponse: string): Promise<string> {
    try {
        const analysisPrompt = `
        Tu es l'observateur pédagogique du système.
        
        ANCIEN PROFIL DE L'ÉTUDIANT : "${oldMemory}"
        
        DERNIER ÉCHANGE :
        Étudiant : "${lastUserMessage}"
        IA : "${lastAiResponse}"
        
        TÂCHE :
        Mets à jour le profil de l'étudiant en 1 ou 2 phrases concises.
        - Note les points grammaticaux mal compris (ex: confusion "le/de").
        - Note les centres d'intérêt pour personnaliser les futurs exemples (ex: aime le foot, la cuisine).
        - Note le ton préféré (ex: veut des réponses courtes).
        - Garde l'historique pertinent, supprime l'obsolète.
        
        Si rien de notable, retourne l'ANCIEN PROFIL tel quel.
        Ne sois pas bavard. Juste les faits bruts pour le système.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: analysisPrompt,
            config: {
                temperature: 0.3, // Bas pour être factuel
                maxOutputTokens: 100
            }
        });

        return response.text || oldMemory;
    } catch (e) {
        console.error("Memory Update Error", e);
        return oldMemory;
    }
  },

  async generateQuiz(topic: string, count: number = 3): Promise<QuizQuestion[]> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Génère un quiz de ${count} questions pour un étudiant de L1 Chinois sur : ${topic}.`,
        config: {
          systemInstruction: BASE_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  minItems: 4, maxItems: 4
                },
                correctAnswer: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "correctAnswer", "explanation"]
            }
          }
        }
      });
      
      const text = response.text || "[]";
      const jsonStr = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Quiz Error:", e);
      return [];
    }
  },

  async generateMemoryPairs(topic: string): Promise<MemoryPair[]> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Génère 6 paires de vocabulaire (Hanzi + Pinyin/Traduction) pour un jeu de mémoire sur le thème : ${topic}. Niveau HSK 1/2.`,
        config: {
          systemInstruction: BASE_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                hanzi: { type: Type.STRING },
                pinyin: { type: Type.STRING },
                translation: { type: Type.STRING }
              },
              required: ["id", "hanzi", "pinyin", "translation"]
            }
          }
        }
      });
      
      const text = response.text || "[]";
      const jsonStr = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Memory Game Error:", e);
      return [];
    }
  },

  async generateAnnouncementImage(title: string, content: string): Promise<string | null> {
    try {
      const prompt = `A modern, clean, academic digital illustration suitable for a university announcement board. 
      Subject: ${title}. Context: ${content}. 
      Style: Minimalist vector art, educational, university vibes. No text in the image.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: prompt },
          ],
        },
        config: {
          imageConfig: {
             aspectRatio: "16:9" 
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString: string = part.inlineData.data;
          return `data:image/png;base64,${base64EncodeString}`;
        }
      }
      return null;
    } catch (e) {
      console.error("Image Gen Error:", e);
      return null;
    }
  },

  async generateFortune(): Promise<Fortune | null> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Génère un 'Fortune Cookie' pour un étudiant en chinois.",
        config: {
          systemInstruction: `Tu es un biscuit de la chance mystique mais humoristique pour des étudiants en langue.
          Génère :
          1. Un Chengyu (idiome 4 caractères) aléatoire motivant ou drôle.
          2. Son Pinyin.
          3. Sa traduction française.
          4. Un conseil "Horoscope étudiant" drôle (ex: "Attention aux particules 'le' aujourd'hui").
          5. Une couleur porte-bonheur.`,
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

      const text = response.text || "{}";
      return JSON.parse(text);
    } catch (e) {
      console.error("Fortune Error:", e);
      return null;
    }
  }
};