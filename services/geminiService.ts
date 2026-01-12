
import { MathExercise } from "../types";

export const generateMathExercise = (): MathExercise => {
  // Gerar n1 entre 200 e 999
  const n1 = Math.floor(Math.random() * (999 - 200 + 1)) + 200;
  // Gerar n2 entre 100 e n1 - 10 para garantir que o resultado é positivo e há algo para subtrair
  const n2 = Math.floor(Math.random() * (n1 - 100 - 10 + 1)) + 100;

  const n2_centenas = Math.floor(n2 / 100) * 100;
  const n2_dezenas = Math.floor((n2 % 100) / 10) * 10;
  const n2_unidades = n2 % 10;

  const res_centenas = n1 - n2_centenas;
  const res_dezenas = res_centenas - n2_dezenas;
  const res_final = res_dezenas - n2_unidades;

  return {
    n1,
    n2,
    n2_centenas,
    n2_dezenas,
    n2_unidades,
    res_centenas,
    res_dezenas,
    res_final,
    dicas: {
      centenas: `Subtrai as centenas (${n2_centenas}) ao número inicial (${n1}). Pensa: ${Math.floor(n1/100)} - ${Math.floor(n2_centenas/100)} centenas.`,
      dezenas: `Agora tira as dezenas (${n2_dezenas}) ao resultado anterior (${res_centenas}).`,
      unidades: `Por fim, subtrai as unidades (${n2_unidades}) para chegares ao resultado final!`
    }
  };
};

// Função mantida apenas para evitar erros de importação se outros ficheiros não forem atualizados instantaneamente, 
// mas não será usada na interface.
export const analyzeResolutionPhoto = async () => {
  return {};
};
