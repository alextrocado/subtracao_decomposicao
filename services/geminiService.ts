
import { GoogleGenAI, Type } from "@google/genai";
import { MathExercise } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getRandomNumbers = () => {
  const n1 = Math.floor(Math.random() * (999 - 200 + 1)) + 200;
  const n2 = Math.floor(Math.random() * (n1 - 10 - 100 + 1)) + 100;
  return { n1, n2 };
};

export const generateMathExercise = async (): Promise<MathExercise> => {
  const { n1, n2 } = getRandomNumbers();

  const prompt = `Calcula a decomposição passo a passo para: ${n1} - ${n2}.
  
  O segundo número (${n2}) deve ser decomposto em:
  - n2_centenas (centenas)
  - n2_dezenas (dezenas)
  - n2_unidades (unidades)

  Calcula os resultados parciais:
  - res_centenas = ${n1} - n2_centenas
  - res_dezenas = res_centenas - n2_dezenas
  - res_final = res_dezenas - n2_unidades

  Cria 3 dicas pedagógicas em Português para crianças.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: "És um assistente de matemática para crianças. Devolve APENAS o formato JSON em Português.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          n1: { type: Type.INTEGER },
          n2: { type: Type.INTEGER },
          n2_centenas: { type: Type.INTEGER },
          n2_dezenas: { type: Type.INTEGER },
          n2_unidades: { type: Type.INTEGER },
          res_centenas: { type: Type.INTEGER },
          res_dezenas: { type: Type.INTEGER },
          res_final: { type: Type.INTEGER },
          dicas: {
            type: Type.OBJECT,
            properties: {
              centenas: { type: Type.STRING },
              dezenas: { type: Type.STRING },
              unidades: { type: Type.STRING }
            },
            required: ["centenas", "dezenas", "unidades"]
          }
        },
        required: ["n1", "n2", "n2_centenas", "n2_dezenas", "n2_unidades", "res_centenas", "res_dezenas", "res_final", "dicas"]
      }
    }
  });

  try {
    const text = response.text || "{}";
    const data = JSON.parse(text) as MathExercise;
    data.n1 = n1;
    data.n2 = n2;
    return data;
  } catch (error) {
    return generateMathExercise();
  }
};

export const analyzeResolutionPhoto = async (base64Image: string, exercise: MathExercise) => {
  const prompt = `Analisa esta imagem de um exercício de matemática feito à mão para o problema: ${exercise.n1} - ${exercise.n2}.
  
  O utilizador está a usar o método de decomposição. Por favor extrai:
  1. Passo das Centenas: geralmente parece "${exercise.n1} - ${exercise.n2_centenas} = ${exercise.res_centenas}"
  2. Passo das Dezenas: geralmente parece "${exercise.res_centenas} - ${exercise.n2_dezenas} = ${exercise.res_dezenas}"
  3. Passo das Unidades: geralmente parece "${exercise.res_dezenas} - ${exercise.n2_unidades} = ${exercise.res_final}"
  4. Resultado FINAL: O número único escrito como resposta ao problema principal "${exercise.n1} - ${exercise.n2} = ?". Neste caso, o resultado final esperado é ${exercise.res_final}.
  
  Procura em toda a imagem por estes números. Devolve um objeto JSON.
  
  O "resultado_final" é MUITO importante. É a resposta final de ${exercise.n1} - ${exercise.n2}.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          centenas: {
            type: Type.OBJECT,
            properties: {
              expressao: { type: Type.STRING },
              resultado: { type: Type.STRING }
            }
          },
          dezenas: {
            type: Type.OBJECT,
            properties: {
              expressao: { type: Type.STRING },
              resultado: { type: Type.STRING }
            }
          },
          unidades: {
            type: Type.OBJECT,
            properties: {
              expressao: { type: Type.STRING },
              resultado: { type: Type.STRING }
            }
          },
          resultado_final: { type: Type.STRING, description: "A resposta final ao problema de subtração principal." }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
};
