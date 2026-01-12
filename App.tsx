
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateMathExercise } from './services/geminiService';
import { MathExercise, StepRowKey, RowState } from './types';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exercise, setExercise] = useState<MathExercise | null>(null);
  const [finalAnswer, setFinalAnswer] = useState('');
  const [isFinalCorrect, setIsFinalCorrect] = useState<boolean | null>(null);
  
  const [rows, setRows] = useState<Record<StepRowKey, RowState>>({
    centenas: { expressao: '', resultado: '', isCorrect: null, attempts: 0, showDica: false },
    dezenas: { expressao: '', resultado: '', isCorrect: null, attempts: 0, showDica: false },
    unidades: { expressao: '', resultado: '', isCorrect: null, attempts: 0, showDica: false },
  });

  const fetchNewProblem = useCallback(() => {
    setLoading(true);
    setError(null);
    setFinalAnswer('');
    setIsFinalCorrect(null);
    setRows({
      centenas: { expressao: '', resultado: '', isCorrect: null, attempts: 0, showDica: false },
      dezenas: { expressao: '', resultado: '', isCorrect: null, attempts: 0, showDica: false },
      unidades: { expressao: '', resultado: '', isCorrect: null, attempts: 0, showDica: false },
    });
    
    try {
      const data = generateMathExercise();
      setExercise(data);
    } catch (e) { 
      console.error(e);
      setError("Ups! Algo correu mal ao gerar a conta.");
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { 
    fetchNewProblem(); 
  }, [fetchNewProblem]);

  const handleInputChange = (row: StepRowKey, field: 'expressao' | 'resultado', value: string) => {
    setRows(prev => ({
      ...prev,
      [row]: { ...prev[row], [field]: value, isCorrect: null, showDica: false }
    }));
  };

  const validateRow = (rowKey: StepRowKey, rowData: RowState, currentExercise: MathExercise) => {
    const cleanExp = rowData.expressao.replace(/\s/g, '');
    let expectedExp = '';
    let expectedRes = 0;

    if (rowKey === 'centenas') {
      expectedExp = `${currentExercise.n1}-${currentExercise.n2_centenas}`;
      expectedRes = currentExercise.res_centenas;
    } else if (rowKey === 'dezenas') {
      expectedExp = `${currentExercise.res_centenas}-${currentExercise.n2_dezenas}`;
      expectedRes = currentExercise.res_dezenas;
    } else {
      expectedExp = `${currentExercise.res_dezenas}-${currentExercise.n2_unidades}`;
      expectedRes = currentExercise.res_final;
    }

    return (cleanExp === expectedExp || cleanExp === expectedExp.replace('-', '−')) && 
           parseInt(rowData.resultado) === expectedRes;
  };

  const checkRow = (rowKey: StepRowKey) => {
    if (!exercise) return;
    const isCorrect = validateRow(rowKey, rows[rowKey], exercise);

    if (isCorrect) {
      setRows(prev => ({ ...prev, [rowKey]: { ...prev[rowKey], isCorrect: true, showDica: false } }));
    } else {
      const newAttempts = rows[rowKey].attempts + 1;
      if (newAttempts >= 3) {
        let expectedExp = '';
        let expectedRes = 0;
        if (rowKey === 'centenas') { expectedExp = `${exercise.n1}-${exercise.n2_centenas}`; expectedRes = exercise.res_centenas; }
        else if (rowKey === 'dezenas') { expectedExp = `${exercise.res_centenas}-${exercise.n2_dezenas}`; expectedRes = exercise.res_dezenas; }
        else { expectedExp = `${exercise.res_dezenas}-${exercise.n2_unidades}`; expectedRes = exercise.res_final; }

        setRows(prev => ({ 
          ...prev, 
          [rowKey]: { 
            ...prev[rowKey], 
            expressao: expectedExp, 
            resultado: expectedRes.toString(), 
            isCorrect: true, 
            attempts: newAttempts,
            showDica: true 
          } 
        }));
      } else {
        setRows(prev => ({ ...prev, [rowKey]: { ...prev[rowKey], isCorrect: false, attempts: newAttempts, showDica: true } }));
      }
    }
  };

  const checkFinalResult = () => {
    if (!exercise) return;
    if (parseInt(finalAnswer) === exercise.res_final) {
      setIsFinalCorrect(true);
    } else {
      setIsFinalCorrect(false);
    }
  };

  const getPlaceholder = (rowKey: StepRowKey) => {
    if (rowKey === 'centenas') return "▢▢▢ - ▢00";
    if (rowKey === 'dezenas') return "▢▢▢ - ▢0";
    return "▢▢▢ - ▢";
  };

  const getIcon = (rowKey: StepRowKey) => {
    if (rowKey === 'centenas') return "🏛️";
    if (rowKey === 'dezenas') return "🔟";
    return "💎";
  };

  const renderRow = (label: string, rowKey: StepRowKey) => {
    const row = rows[rowKey];
    const dicaOriginal = exercise?.dicas[rowKey];
    const icon = getIcon(rowKey);

    let feedbackText = "";
    if (row.showDica) {
      if (row.isCorrect && row.attempts >= 3) {
        feedbackText = "Não te preocupes! Vê como este passo é feito e tenta o próximo com atenção! 🎓";
      } else if (row.attempts === 1) {
        feedbackText = `Quase! 🧐 ${dicaOriginal}`;
      } else if (row.attempts === 2) {
        feedbackText = `Cuidado! 🚨 Estás a subtrair o valor correto? Tenta outra vez!`;
      }
    }
    
    return (
      <div className="flex flex-col gap-1 mb-4 md:mb-6 animate-fadeIn">
        <div className="flex items-center gap-2 ml-1">
          <span className="text-base">{icon}</span>
          <label className="text-blue-500 font-black text-[10px] uppercase tracking-widest">{label}</label>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative flex-[2.5]">
            <input
              type="text"
              value={row.expressao}
              onChange={(e) => handleInputChange(rowKey, 'expressao', e.target.value)}
              disabled={row.isCorrect === true}
              placeholder={getPlaceholder(rowKey)}
              className={`w-full p-3 md:p-4 text-lg md:text-2xl font-black rounded-2xl border-4 transition-all outline-none text-center
                ${row.isCorrect === true ? 'border-green-400 bg-green-50 text-green-700' : row.isCorrect === false ? 'border-red-400 bg-red-50 text-red-700' : 'border-blue-100 focus:border-blue-400 bg-white text-blue-900 placeholder:text-blue-100'}`}
            />
          </div>

          <span className="text-2xl font-black text-blue-100">=</span>

          <div className="relative flex-1">
            <input
              type="number"
              value={row.resultado}
              onChange={(e) => handleInputChange(rowKey, 'resultado', e.target.value)}
              disabled={row.isCorrect === true}
              placeholder="?"
              className={`w-full p-3 md:p-4 text-lg md:text-2xl font-black rounded-2xl border-4 transition-all outline-none text-center
                ${row.isCorrect === true ? 'border-green-400 bg-green-50 text-green-700' : row.isCorrect === false ? 'border-red-400 bg-red-50 text-red-700' : 'border-blue-100 focus:border-blue-400 bg-white text-blue-900 placeholder:text-blue-100'}`}
            />
          </div>

          <button
            onClick={() => checkRow(rowKey)}
            disabled={row.isCorrect === true}
            className={`w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-2xl font-black text-white shadow-[0_4px_0_0_rgba(0,0,0,0.1)] transition-all active:translate-y-1 active:shadow-none disabled:opacity-50
              ${row.isCorrect === true ? 'bg-green-500 shadow-green-700' : 'bg-blue-500 hover:bg-blue-600 shadow-blue-700'}`}
          >
            {row.isCorrect === true ? '🌟' : 'OK'}
          </button>
        </div>

        {row.showDica && (
          <div className={`mt-2 p-3 rounded-xl text-sm font-bold border-2 animate-slideDown shadow-sm relative
            ${row.isCorrect && row.attempts >= 3 ? 'bg-blue-600 border-blue-400 text-white' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
            <div className="flex items-start gap-2">
              <span className="text-lg">{row.isCorrect && row.attempts >= 3 ? "🎓" : "💡"}</span>
              <p>{feedbackText}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const stepsDone = rows.unidades.isCorrect === true;
  const isFinalSolved = isFinalCorrect === true;

  return (
    <div className="min-h-screen bg-[#f0f9ff] p-2 md:p-6 flex flex-col items-center">
      <header className="text-center mb-4 md:mb-6">
        <div className="bg-white px-3 py-0.5 rounded-full shadow-sm inline-block mb-2 border border-blue-50">
           <span className="text-blue-500 font-black text-[9px] tracking-widest uppercase">Aprendizagem de Matemática</span>
        </div>
        <h1 className="text-xl md:text-3xl lg:text-4xl font-black text-blue-600 drop-shadow-sm">Subtração por Decomposição</h1>
      </header>

      <main className="w-full max-w-2xl bg-white rounded-[25px] md:rounded-[35px] shadow-[0_15px_40px_rgba(0,0,0,0.05)] border-4 md:border-6 border-white p-3 md:p-6 relative overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 border-6 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-blue-400 font-black text-xl animate-pulse">A preparar a conta...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-red-500 font-bold text-lg mb-6">{error}</p>
            <button
              onClick={fetchNewProblem}
              className="px-6 py-3 bg-blue-600 text-white font-black rounded-xl shadow-lg"
            >
              TENTAR NOVAMENTE 🔄
            </button>
          </div>
        ) : exercise && (
          <>
            <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[20px] md:rounded-[25px] p-4 md:p-6 mb-6 md:mb-8 text-center border-2 border-white shadow-inner flex flex-col items-center gap-1 md:gap-2 transition-all ${!stepsDone ? 'opacity-80' : 'ring-2 ring-blue-300 ring-offset-2 ring-offset-white'}`}>
              <div className="flex flex-row items-center justify-center gap-1 md:gap-3 lg:gap-4 w-full flex-nowrap whitespace-nowrap overflow-x-auto no-scrollbar py-0.5">
                <span className="text-lg md:text-2xl lg:text-4xl font-black text-blue-950 tracking-tighter shrink-0">
                  {exercise.n1} <span className="text-red-400">−</span> {exercise.n2}
                </span>
                
                <span className="text-lg md:text-2xl lg:text-4xl font-black text-blue-200 shrink-0">=</span>
                
                <div className="relative shrink-0">
                  <input
                    type="number"
                    value={finalAnswer}
                    onChange={(e) => {
                      setFinalAnswer(e.target.value);
                      setIsFinalCorrect(null);
                    }}
                    disabled={!stepsDone || isFinalSolved}
                    placeholder="?"
                    className={`w-16 md:text-center md:w-24 lg:w-32 p-1.5 md:p-3 lg:p-4 text-lg md:text-2xl lg:text-4xl font-black rounded-[15px] md:rounded-[25px] border-4 transition-all outline-none text-center shadow-sm
                      ${!stepsDone ? 'bg-gray-100 border-gray-100 text-gray-300' : 
                        isFinalSolved ? 'border-green-400 bg-green-50 text-green-700' : 
                        isFinalCorrect === false ? 'border-red-400 bg-red-50 text-red-700' : 
                        'border-blue-200 focus:border-blue-400 bg-white text-blue-900 placeholder:text-blue-100'}`}
                  />
                  {isFinalCorrect === false && (
                    <div className="absolute -bottom-4 left-0 right-0 text-[7px] font-bold text-red-500 uppercase tracking-widest animate-bounce">Tenta outra vez! ❌</div>
                  )}
                </div>
                
                <button
                  onClick={checkFinalResult}
                  disabled={!stepsDone || isFinalSolved || !finalAnswer}
                  className={`w-9 h-9 md:w-14 md:h-14 lg:w-16 lg:h-16 shrink-0 flex items-center justify-center rounded-[12px] md:rounded-[20px] font-black text-white shadow-[0_3px_0_0_rgba(0,0,0,0.1)] transition-all active:translate-y-1 active:shadow-none disabled:opacity-30
                    ${isFinalSolved ? 'bg-green-500 shadow-green-700' : 'bg-indigo-400 hover:bg-indigo-500 shadow-indigo-600'}`}
                >
                  <span className="text-xs md:text-base lg:text-lg">{isFinalSolved ? '🏆' : 'OK'}</span>
                </button>
              </div>

              {!stepsDone && (
                <div className="bg-white/50 px-2 py-0.5 rounded-full text-blue-400 font-bold text-[7px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.15em] animate-pulse">
                  Resolve os passos abaixo primeiro! 👇
                </div>
              )}
            </div>

            <div className="max-w-lg mx-auto space-y-1">
              {renderRow("Centenas", "centenas")}
              
              {(rows.centenas.isCorrect || rows.centenas.attempts >= 3) && 
                renderRow("Dezenas", "dezenas")}
              
              {(rows.dezenas.isCorrect || rows.dezenas.attempts >= 3) && 
                renderRow("Unidades", "unidades")}
            </div>

            <div className="mt-4 flex flex-col gap-2 max-w-lg mx-auto">
              {isFinalSolved && (
                <div className="p-4 md:p-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-[20px] md:rounded-[25px] text-center text-white animate-bounce shadow-lg border-2 border-white">
                  <h2 className="text-xl md:text-2xl font-black mb-1">ÉS UM MESTRE! 🏆</h2>
                  <p className="text-sm md:text-lg font-bold opacity-90">Decomposição completa!</p>
                </div>
              )}

              <button
                onClick={fetchNewProblem}
                className="w-full bg-blue-600 text-white font-black py-4 md:py-5 rounded-[20px] md:rounded-[25px] hover:bg-blue-700 transition-all text-lg md:text-xl shadow-[0_6px_0_0_#1d4ed8] md:shadow-[0_8px_0_0_#1d4ed8] active:translate-y-1 active:shadow-[0_4px_0_0_#1d4ed8]"
              >
                NOVA CONTA 🎲
              </button>
            </div>
          </>
        )}
      </main>

      <footer className="mt-4 md:mt-6 text-blue-200 font-bold text-[8px] tracking-[0.2em] md:tracking-[0.25em] uppercase flex items-center gap-2">
        <span>Subtração Passo a Passo</span>
        <span className="w-1 h-1 bg-blue-100 rounded-full"></span>
        <span>2025</span>
      </footer>
    </div>
  );
};

export default App;
