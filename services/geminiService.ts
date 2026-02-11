
import { GoogleGenAI } from "@google/genai";
import { Question, OptionKey, Category } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

// AI cavablarında tez-tez rast gəlinən ```json və ``` işarələrini təmizləyir
const cleanJson = (text: string): string => {
  if (!text) return "{}";
  return text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
};

export const getPhoneHint = async (question: Question, difficulty: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Sən 'Kasıbın Pulu' oyununda oyunçunun ən yaxın dostusan. Oyunçu sənə zəng edib kömək istəyir.
      Sual: ${question.question_text}
      Variantlar: A: ${question.options.A}, B: ${question.options.B}, C: ${question.options.C}, D: ${question.options.D}, E: ${question.options.E}
      Düzgün cavab: ${question.correct_option}.
      Xarakterin: Zarafatcıl, amma ciddi məsləhət verən.
      Çətinlik: ${difficulty}/12.
      Tələb: Maksimum 2 cümlə. Düzgün cavabı ehtimal ilə vurğula.`,
      config: {
        systemInstruction: "Dostuna zəng jokerisən. Azərbaycan dilində danış.",
        temperature: 0.8,
      }
    });
    return response.text || "Dostum, xətt zəifdir, məncə C variantı ağlabatandır...";
  } catch (error) {
    return "Məncə düzgün cavab variantlardan biridir, özünə güvən!";
  }
};

export const getAudiencePoll = (question: Question, difficulty: number): Record<OptionKey, number> => {
  const correctOption = question.correct_option;
  let correctWeight: number;

  if (difficulty <= 4) correctWeight = Math.floor(Math.random() * 20) + 60;
  else if (difficulty <= 8) correctWeight = Math.floor(Math.random() * 20) + 35;
  else correctWeight = Math.floor(Math.random() * 20) + 20;

  const remaining = 100 - correctWeight;
  const keys: OptionKey[] = ['A', 'B', 'C', 'D', 'E'];
  const result: Record<string, number> = {};

  let remainingShare = remaining;
  keys.forEach((key, index) => {
    if (key === correctOption) {
      result[key] = correctWeight;
    } else {
      if (index === 4 || (index === 3 && keys[4] === correctOption)) {
         result[key] = remainingShare;
      } else {
         const portion = Math.floor(Math.random() * (remainingShare / 2));
         result[key] = portion;
         remainingShare -= portion;
      }
    }
  });

  return result as Record<OptionKey, number>;
};

// --- YENİ: Canlı AI Sual Generasiyası ---
export const generateQuestionByAI = async (difficulty: number, category: Category | null): Promise<Question | null> => {
  try {
    const targetCategory = category || "Ümumi dünyagörüşü";
    
    const prompt = `Mənə Azərbaycan dilində, 'Kim Milyonçu Olmaq İstəyir' formatında YALNIZ BİR sual yarat.
    
    ÇOX VACİB ŞƏRTLƏR:
    1. Kateqoriya: "${targetCategory}".
    2. Çətinlik: ${difficulty}/12.
    3. 5 variantlı (A, B, C, D, E).
    4. Sual orijinal olsun.
    
    YALNIZ bu JSON formatında cavab ver (Markdown istifadə etmə):
    {
      "question_text": "Sualın mətni",
      "options": {
        "A": "Variant 1",
        "B": "Variant 2",
        "C": "Variant 3",
        "D": "Variant 4",
        "E": "Variant 5"
      },
      "correct_option": "A",
      "explanation": "Qısa izah",
      "category": "${targetCategory}"
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const rawText = response.text || "{}";
    const cleanText = cleanJson(rawText);
    const data = JSON.parse(cleanText);
    
    if (!data.question_text || !data.options || !data.correct_option) return null;

    return {
      id: `ai-${Date.now()}-${Math.random()}`,
      category: category || Category.GENERAL,
      difficulty: difficulty,
      question_text: data.question_text,
      options: data.options,
      correct_option: data.correct_option as OptionKey,
      explanation: data.explanation || "AI tərəfindən yaradılıb."
    };

  } catch (error) {
    console.error("AI Question Generation Error:", error);
    return null;
  }
};
