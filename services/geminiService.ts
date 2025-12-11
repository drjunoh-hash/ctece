import { GoogleGenAI, Type } from "@google/genai";
import { Question, CTCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAssessment = async (age: number, count: number = 5): Promise<Question[]> => {
  const modelId = "gemini-2.5-flash"; // Fast and capable for JSON tasks
  
  const prompt = `
    당신은 유아 교육 전문가이자 컴퓨터 과학자입니다. 
    ${age}세 어린이를 위한 컴퓨팅 사고력(Computational Thinking) 평가 문항 ${count}개를 생성해주세요.
    
    다음 5가지 영역 중 골고루 섞어서 출제하세요:
    1. Pattern (패턴 인식): 다음에 올 모양이나 색깔 찾기
    2. Sequencing (순서 절차): 양치하기 순서, 씨앗이 자라는 순서 등
    3. Abstraction (단순화/분류): 동물 농장에서 다리가 4개인 동물 찾기 등 분류하기
    4. Debugging (디버깅): 길 찾기에서 잘못된 화살표 찾기 등
    5. Logic (논리): "만약 ~라면" 조건에 맞는 행동 고르기

    문항은 아이들이 이해하기 쉬운 한국어로 작성되어야 합니다.
    각 질문에는 3~4개의 선택지가 있어야 합니다.
    
    JSON 형식으로 정확하게 반환해주세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: "You are a friendly AI teacher designed to assess computational thinking in children. Output strictly JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              category: { type: Type.STRING, enum: Object.values(CTCategory) },
              questionText: { type: Type.STRING },
              questionImageUrl: { type: Type.STRING, description: "Optional URL for an image associated with the question" },
              audioUrl: { type: Type.STRING, description: "Optional URL for an audio file associated with the question" },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    text: { type: Type.STRING },
                    imageUrl: { type: Type.STRING, description: "A keyword to search for an image representing this option (e.g. 'cat', 'red triangle', 'sun')" }
                  }
                }
              },
              correctOptionId: { type: Type.INTEGER },
              difficulty: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            }
          }
        }
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) throw new Error("Empty response from Gemini");
    
    const questions = JSON.parse(jsonStr) as Question[];
    return questions;

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback data in case of error (Offline mode simulation)
    return [
      {
        id: 1,
        category: CTCategory.Pattern,
        questionText: "다음 중 사과, 바나나, 사과, 바나나 다음에 올 과일은 무엇일까요?",
        options: [
            { id: 0, text: "사과", imageUrl: "apple" }, 
            { id: 1, text: "수박", imageUrl: "watermelon" }, 
            { id: 2, text: "포도", imageUrl: "grape" }
        ],
        correctOptionId: 0,
        difficulty: 1,
        explanation: "사과와 바나나가 번갈아 나오는 패턴이에요."
      },
      {
        id: 2,
        category: CTCategory.Sequencing,
        questionText: "아침에 일어나서 가장 먼저 해야 할 일은 무엇일까요?",
        options: [
            { id: 0, text: "신발 신기", imageUrl: "shoes" }, 
            { id: 1, text: "세수하기", imageUrl: "washing face" }, 
            { id: 2, text: "학교 가기", imageUrl: "school" }
        ],
        correctOptionId: 1,
        difficulty: 1,
        explanation: "하루의 시작은 씻는 것부터 시작해요."
      }
    ];
  }
};