import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OptionKey, Question, QuizRun } from '../types';
import { supabaseService } from '../services/supabaseMock';
import { getPhoneHint } from '../services/geminiService';
import { GET_SAFETY_EARNINGS, REWARDS } from '../constants';

type ExpertKind = 'historian' | 'tech' | 'pop';

interface PlayPageProps {
  run: QuizRun | null;
  onFinish: (run: QuizRun) => void;
}

const ALL_KEYS: OptionKey[] = ['A', 'B', 'C', 'D', 'E'];

const getTimerSeconds = (questionNumber: number): number | null => {
  if (questionNumber <= 5) return null;
  if (questionNumber <= 10) return 60;
  return 30;
};

const pickRandomOptions = <T,>(list: T[], count: number): T[] => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0 && count > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
};

const AUDIENCE_KEYS: OptionKey[] = ['A', 'B', 'C', 'D'];

const buildAudienceDistribution = (question: Question): Record<OptionKey, number> => {
  const result: Record<OptionKey, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  const keys = AUDIENCE_KEYS;
  const correct = question.correct_option;
  const wrongs = keys.filter(key => key !== correct);
  const preferCorrect = Math.random() < 0.7;
  const topKey = preferCorrect
    ? correct
    : wrongs[Math.floor(Math.random() * wrongs.length)];
  const topValue = Math.floor(Math.random() * 10) + 55; // 55-64
  result[topKey] = topValue;
  let remaining = 100 - topValue;
  const restKeys = keys.filter(key => key !== topKey);
  restKeys.forEach((key, idx) => {
    if (idx === restKeys.length - 1) {
      result[key] = remaining;
      return;
    }
    const max = Math.max(remaining - (restKeys.length - idx - 1), 0);
    const value = max > 0 ? Math.floor(Math.random() * max) : 0;
    result[key] = value;
    remaining -= value;
  });
  return result;
};

const getExpertReply = (
  expert: ExpertKind,
  question: Question,
  recommendedOption: OptionKey
): { title: string; text: string } => {
  const optionText = question.options[recommendedOption];
  if (expert === 'historian') {
    return {
      title: '🎭 Tarixçi',
      text: `Mən bu cavaba tam əminəm: ${recommendedOption} (${optionText}). Məntiq və kontekst bu variantı gücləndirir.`,
    };
  }
  if (expert === 'tech') {
    return {
      title: '🎭 Texnologiya Manyakı',
      text: `Dəqiq demirəm, amma ən güclü ehtimal ${recommendedOption} (${optionText}) görünür. Yenə də son qərar səndədir.`,
    };
  }
  return {
    title: '🎭 Pop-kultura Fanatı',
    text: `Birbaşa deməyim: ipucu kimi düşün, diqqətini ${recommendedOption} variantına (${optionText}) yaxın saxla.`,
  };
};

const getFallbackHint = (question: Question): string => {
  return `Mövzu: ${question.category}. Açar sözləri və ölçü/tarix fərqlərini diqqətlə müqayisə et.`;
};

const PlayPage: React.FC<PlayPageProps> = ({ run, onFinish }) => {
  const navigate = useNavigate();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<OptionKey | null>(null);
  const [locked, setLocked] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const [jokers, setJokers] = useState({
    expert: false,
    hint: false,
    secondChance: false,
    fiftyFifty: false,
    authority: false,
    audience: false,
  });
  const [secondChanceArmed, setSecondChanceArmed] = useState(false);
  const [fiftyFiftyDisabled, setFiftyFiftyDisabled] = useState<OptionKey[]>([]);
  const [authorityLoading, setAuthorityLoading] = useState(false);
  const [audienceResults, setAudienceResults] = useState<Record<OptionKey, number> | null>(null);
  const [showAudienceModal, setShowAudienceModal] = useState(false);

  const [showExpertPicker, setShowExpertPicker] = useState(false);
  const [modal, setModal] = useState<{ title: string; text: string } | null>(null);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const usedQuestionIdsRef = useRef<string[]>([]);
  const transitionTimerRef = useRef<number | null>(null);

  const totalQuestions = REWARDS.length;
  const currentQuestionNumber = currentQuestionIndex + 1;
  const currentEarned = currentQuestionIndex === 0 ? 0 : REWARDS[currentQuestionIndex - 1];

  const isModalOpen = showExpertPicker || Boolean(modal);

  const desktopLevels = useMemo(() => {
    return REWARDS.map((reward, idx) => ({ idx, reward })).reverse();
  }, []);

  const clearTransitionTimer = () => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  };

  const fetchQuestion = useCallback(async (index: number) => {
    setLoading(true);
    const q = await supabaseService.getQuestion(index + 1, null, usedQuestionIdsRef.current);
    setQuestion(q);
    usedQuestionIdsRef.current = usedQuestionIdsRef.current.includes(q.id)
      ? usedQuestionIdsRef.current
      : [...usedQuestionIdsRef.current, q.id];
    setLoading(false);
  }, []);

  const proceedToNext = useCallback(
    async (nextIndex: number) => {
      setCurrentQuestionIndex(nextIndex);
      setSelectedOption(null);
      setLocked(false);
      setIsRevealed(false);
      setIsCorrect(null);
      setModal(null);
      setSecondChanceArmed(false);
      setFiftyFiftyDisabled([]);
      setAudienceResults(null);
      setShowAudienceModal(false);
      await fetchQuestion(nextIndex);
    },
    [fetchQuestion]
  );

  const finishGame = useCallback(
    async (earnings: number, correctCount: number) => {
      if (!run) return;
      clearTransitionTimer();
      await supabaseService.finishRun(run.id, earnings, correctCount, {
        expert: jokers.expert,
        hint: jokers.hint,
        secondChance: jokers.secondChance,
        fiftyFifty: jokers.fiftyFifty,
        authority: jokers.authority,
        audience: jokers.audience,
      });
      const updatedRun: QuizRun = {
        ...run,
        ended_at: new Date(),
        final_earnings: earnings,
        correct_count: correctCount,
        used_expert: jokers.expert,
        used_hint: jokers.hint,
        used_second_chance: jokers.secondChance,
        used_fifty_fifty: jokers.fiftyFifty,
        used_authority: jokers.authority,
        used_audience: jokers.audience,
      };
      onFinish(updatedRun);
      navigate('/result');
    },
    [run, jokers, onFinish, navigate]
  );

  useEffect(() => {
    if (!run) {
      navigate('/');
      return;
    }
    fetchQuestion(0);
    return () => clearTransitionTimer();
  }, []);

  useEffect(() => {
    if (!question) return;
    setTimeLeft(getTimerSeconds(currentQuestionNumber));
  }, [question?.id, currentQuestionNumber]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (loading || locked || isRevealed || isModalOpen) return;
    if (timeLeft <= 0) return;
    const tick = window.setTimeout(() => {
      setTimeLeft(prev => (prev === null ? null : Math.max(0, prev - 1)));
    }, 1000);
    return () => window.clearTimeout(tick);
  }, [timeLeft, loading, locked, isRevealed, isModalOpen]);

  useEffect(() => {
    if (timeLeft !== 0) return;
    if (!question || locked || isRevealed) return;
    setLocked(true);
    setIsCorrect(false);
    setIsRevealed(true);
    supabaseService.saveStep({
      event_type: 'answer',
      run_id: run!.id,
      question_number: currentQuestionNumber,
      question_id: question.id,
      category: question.category,
      difficulty: question.difficulty,
      is_correct: false,
      earnings_after: GET_SAFETY_EARNINGS(currentQuestionIndex),
    });
    transitionTimerRef.current = window.setTimeout(() => {
      finishGame(GET_SAFETY_EARNINGS(currentQuestionIndex), currentQuestionIndex);
    }, 1200);
  }, [timeLeft, question, locked, isRevealed, currentQuestionIndex, currentQuestionNumber, finishGame, run]);

  const handleOptionClick = (key: OptionKey) => {
    if (locked) return;
    setSelectedOption(key);
  };

  const handleExpertSelect = (expert: ExpertKind) => {
    if (!question || !run || jokers.expert) return;
    const correct = question.correct_option;
    const wrongPool = ALL_KEYS.filter(k => k !== correct);
    const recommended =
      Math.random() < 0.7
        ? correct
        : wrongPool[Math.floor(Math.random() * wrongPool.length)];

    setJokers(prev => ({ ...prev, expert: true }));
    setShowExpertPicker(false);
    setModal(getExpertReply(expert, question, recommended));
    supabaseService.saveStep({
      event_type: 'joker',
      run_id: run.id,
      question_number: currentQuestionNumber,
      question_id: question.id,
      category: question.category,
      difficulty: question.difficulty,
      earnings_after: currentEarned,
      used_joker: 'expert',
    });
  };

  const useHint = () => {
    if (!question || !run || jokers.hint) return;
    setJokers(prev => ({ ...prev, hint: true }));
    setModal({
      title: '💡 İpucu',
      text: question.hint || getFallbackHint(question),
    });
    supabaseService.saveStep({
      event_type: 'joker',
      run_id: run.id,
      question_number: currentQuestionNumber,
      question_id: question.id,
      category: question.category,
      difficulty: question.difficulty,
      earnings_after: currentEarned,
      used_joker: 'hint',
    });
  };

  const useSecondChance = () => {
    if (!question || !run || jokers.secondChance) return;
    setJokers(prev => ({ ...prev, secondChance: true }));
    setSecondChanceArmed(true);
    setModal({
      title: '🔐 Bir Şans Daha',
      text: 'İndi bu sualda ilk səhv cavabdan sonra bir dəfə yenidən seçim edə biləcəksən.',
    });
    supabaseService.saveStep({
      event_type: 'joker',
      run_id: run.id,
      question_number: currentQuestionNumber,
      question_id: question.id,
      category: question.category,
      difficulty: question.difficulty,
      earnings_after: currentEarned,
      used_joker: 'second_chance',
    });
  };

  const useFiftyFifty = () => {
    if (!question || !run || jokers.fiftyFifty) return;
    const wrongKeys = ALL_KEYS.filter(key => key !== question.correct_option);
    const removedKeys = pickRandomOptions(wrongKeys, 2);
    setFiftyFiftyDisabled(removedKeys);
    setJokers(prev => ({ ...prev, fiftyFifty: true }));
    setModal({
      title: '🔍 50/50',
      text: 'İki səhv variantı çıxarıldı, cavabları daraltdın.',
    });
    supabaseService.saveStep({
      event_type: 'joker',
      run_id: run.id,
      question_number: currentQuestionNumber,
      question_id: question.id,
      category: question.category,
      difficulty: question.difficulty,
      earnings_after: currentEarned,
      used_joker: 'fifty_fifty',
    });
  };

  const useAuthority = async () => {
    if (!question || !run || jokers.authority) return;
    setAuthorityLoading(true);
    let hintText = 'Xətt zəifdir, instinktlərinə güvən.';
    try {
      hintText = await getPhoneHint(question, question.difficulty);
    } catch (error) {
      console.error('Authority hint failed', error);
    }
    setModal({
      title: '📣 Autoriyadan Kömək',
      text: hintText,
    });
    setAuthorityLoading(false);
    setJokers(prev => ({ ...prev, authority: true }));
    supabaseService.saveStep({
      event_type: 'joker',
      run_id: run.id,
      question_number: currentQuestionNumber,
      question_id: question.id,
      category: question.category,
      difficulty: question.difficulty,
      earnings_after: currentEarned,
      used_joker: 'authority',
    });
  };

  const useAudience = () => {
    if (!question || !run || jokers.audience) return;
    const distribution = buildAudienceDistribution(question);
    setAudienceResults(distribution);
    setShowAudienceModal(true);
    setJokers(prev => ({ ...prev, audience: true }));
    supabaseService.saveStep({
      event_type: 'joker',
      run_id: run.id,
      question_number: currentQuestionNumber,
      question_id: question.id,
      category: question.category,
      difficulty: question.difficulty,
      earnings_after: currentEarned,
      used_joker: 'audience',
    });
  };

  const handleLock = () => {
    if (!selectedOption || !question || !run) return;

    setLocked(true);
    window.setTimeout(() => {
      const correct = selectedOption === question.correct_option;
      setIsCorrect(correct);
      setIsRevealed(true);

      if (correct) {
        supabaseService.saveStep({
          event_type: 'answer',
          run_id: run.id,
          question_number: currentQuestionNumber,
          question_id: question.id,
          category: question.category,
          difficulty: question.difficulty,
          selected_option: selectedOption,
          is_correct: true,
          earnings_after: REWARDS[currentQuestionIndex],
        });

        if (currentQuestionIndex === totalQuestions - 1) {
          transitionTimerRef.current = window.setTimeout(() => {
            finishGame(REWARDS[totalQuestions - 1], totalQuestions);
          }, 1000);
          return;
        }

        transitionTimerRef.current = window.setTimeout(() => {
          proceedToNext(currentQuestionIndex + 1);
        }, 1000);
        return;
      }

      if (secondChanceArmed) {
        setSecondChanceArmed(false);
        setLocked(false);
        setIsRevealed(false);
        setIsCorrect(null);
        setSelectedOption(null);
        setModal({
          title: '🔐 İkinci Şans Aktiv',
          text: 'İlk cavab səhv oldu. Yenidən seçim et və cavabı kilidlə.',
        });
        return;
      }

      supabaseService.saveStep({
        event_type: 'answer',
        run_id: run.id,
        question_number: currentQuestionNumber,
        question_id: question.id,
        category: question.category,
        difficulty: question.difficulty,
        selected_option: selectedOption,
        is_correct: false,
        earnings_after: GET_SAFETY_EARNINGS(currentQuestionIndex),
      });

      transitionTimerRef.current = window.setTimeout(() => {
        finishGame(GET_SAFETY_EARNINGS(currentQuestionIndex), currentQuestionIndex);
      }, 1000);
    }, 700);
  };

  if (loading && !question) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] text-yellow-500 gap-4">
        <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-2xl font-bold animate-pulse">SUAL PAKETİ YÜKLƏNİR...</div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden p-3 md:p-5">
      <div className="lg:hidden mb-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {REWARDS.map((reward, idx) => {
            const active = idx === currentQuestionIndex;
            const done = idx < currentQuestionIndex;
            return (
              <div
                key={`m-${idx}`}
                className={`px-3 py-1 rounded-lg text-xs font-bold border ${active ? 'bg-yellow-500 text-slate-950 border-yellow-300' : done ? 'bg-green-700 text-white border-green-500' : 'bg-slate-900 text-slate-400 border-slate-700'}`}
              >
                {idx + 1}
              </div>
            );
          })}
        </div>
      </div>

      <div className="h-full flex gap-4">
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex justify-between items-end mb-3 border-b-2 border-slate-700 pb-2">
            <div>
              <div className="text-blue-400 text-xs md:text-sm font-bold uppercase tracking-widest">
                {question?.category || 'Məxfi'} - Q{currentQuestionNumber}/{totalQuestions}
              </div>
              <div className="text-2xl md:text-4xl font-black text-white">
                {REWARDS[currentQuestionIndex]} <span className="text-sm md:text-xl text-slate-500 italic">AZN</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-500 text-[10px] md:text-xs font-bold uppercase">Təminat</div>
              <div className="text-base md:text-xl font-bold text-yellow-500">{GET_SAFETY_EARNINGS(currentQuestionIndex)} AZN</div>
              <div className="text-xs md:text-sm font-bold text-sky-300 mt-1">
                {timeLeft === null ? 'Vaxt: Limitsiz' : `Vaxt: ${timeLeft}s`}
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col justify-between gap-3">
            <div className="flex justify-center gap-3 flex-wrap">
              <button
                onClick={() => setShowExpertPicker(true)}
                disabled={jokers.expert || locked}
                className={`px-4 h-9 rounded-full border-2 text-sm font-bold transition-all ${jokers.expert ? 'bg-slate-800 border-slate-700 text-slate-600' : 'bg-blue-900 border-blue-400 text-blue-200 hover:scale-105'}`}
              >
                🎭 Ekspert
              </button>
              <button
                onClick={useHint}
                disabled={jokers.hint || locked}
                className={`px-4 h-9 rounded-full border-2 text-sm font-bold transition-all ${jokers.hint ? 'bg-slate-800 border-slate-700 text-slate-600' : 'bg-blue-900 border-blue-400 text-blue-200 hover:scale-105'}`}
              >
                💡 İpucu
              </button>
              <button
                onClick={useSecondChance}
                disabled={jokers.secondChance || locked}
                className={`px-4 h-9 rounded-full border-2 text-sm font-bold transition-all ${jokers.secondChance ? 'bg-slate-800 border-slate-700 text-slate-600' : 'bg-blue-900 border-blue-400 text-blue-200 hover:scale-105'}`}
              >
                🔐 2-ci Şans
              </button>
              <button
                onClick={useFiftyFifty}
                disabled={jokers.fiftyFifty || locked}
                className={`px-4 h-9 rounded-full border-2 text-sm font-bold transition-all ${jokers.fiftyFifty ? 'bg-slate-800 border-slate-700 text-slate-600' : 'bg-blue-900 border-blue-400 text-blue-200 hover:scale-105'}`}
              >
                🔍 50/50
              </button>
              <button
                onClick={() => void useAuthority()}
                disabled={jokers.authority || locked || authorityLoading}
                className={`px-4 h-9 rounded-full border-2 text-sm font-bold transition-all ${jokers.authority ? 'bg-slate-800 border-slate-700 text-slate-600' : 'bg-blue-900 border-blue-400 text-blue-200 hover:scale-105'}`}
              >
                📣 Autoriyadan Kömək{authorityLoading ? '...' : ''}
              </button>
              <button
                onClick={() => useAudience()}
                disabled={jokers.audience || locked}
                className={`px-4 h-9 rounded-full border-2 text-sm font-bold transition-all ${jokers.audience ? 'bg-slate-800 border-slate-700 text-slate-600' : 'bg-blue-900 border-blue-400 text-blue-200 hover:scale-105'}`}
              >
                📊 Auditoriyadan Kömək
              </button>
            </div>

            {secondChanceArmed && (
              <div className="text-center text-amber-300 text-sm font-semibold">
                İkinci şans hazırdır: bu sualda ilk səhv cavabdan sonra yenidən seçə biləcəksən.
              </div>
            )}

            <div className="bg-slate-900/50 border-y-2 border-slate-700 py-4 px-4 md:py-7 md:px-6 text-center text-base md:text-2xl font-semibold leading-snug min-h-[84px] md:min-h-[120px] flex items-center justify-center">
              {question?.question_text}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 max-w-4xl mx-auto w-full">
              {ALL_KEYS.map((key) => {
                const isSelected = selectedOption === key;
                const isCorrectOption = question?.correct_option === key;
                const isRemovedByFifty = fiftyFiftyDisabled.includes(key);
                let colorClass = 'bg-slate-900 border-slate-700 text-white hover:border-yellow-400';
                if (isSelected) colorClass = 'bg-yellow-500 border-yellow-300 text-slate-950';
                if (isRevealed) {
                  if (isCorrectOption) colorClass = 'bg-green-600 border-green-400 text-white';
                  else if (isSelected) colorClass = 'bg-red-600 border-red-400 text-white';
                }
                if (isRemovedByFifty && !isRevealed) {
                  colorClass = 'bg-slate-800 border-slate-700 text-slate-500 opacity-70';
                }

                return (
                  <button
                    key={key}
                    disabled={locked || isRemovedByFifty}
                    onClick={() => handleOptionClick(key)}
                    className={`flex items-center p-3 md:p-4 border-2 rounded-xl text-left text-sm md:text-base font-bold leading-snug transition-all active:scale-95 ${colorClass} ${key === 'E' ? 'md:col-span-2' : ''}`}
                  >
                    <span className="text-yellow-500 mr-3 font-black">{key}:</span>
                    {question?.options[key]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex flex-col md:flex-row gap-2 md:gap-4 items-center justify-between">
            <button
              onClick={() => finishGame(currentEarned, currentQuestionIndex)}
              disabled={locked}
              className="w-full md:w-auto px-4 md:px-6 py-2.5 md:py-3 border-2 border-red-500 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-colors disabled:opacity-30"
            >
              Pulu götür və çıx ({currentEarned} AZN)
            </button>

            <button
              onClick={handleLock}
              disabled={!selectedOption || locked}
              className={`w-full md:w-auto px-8 md:px-12 py-2.5 md:py-3 font-black text-base md:text-xl rounded-xl transition-all shadow-lg ${selectedOption && !locked ? 'bg-yellow-500 text-slate-950 hover:bg-yellow-400' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
            >
              {isRevealed ? 'Növbəti sual hazırlanır...' : 'SON QƏRARDIR?'}
            </button>
          </div>
        </div>

        <aside className="hidden lg:block w-56">
          <div className="sticky top-4 bg-slate-900/90 border border-slate-700 rounded-2xl p-3 max-h-[92dvh] overflow-auto">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Level Panel</div>
            <div className="space-y-2">
              {desktopLevels.map(({ idx, reward }) => {
                const active = idx === currentQuestionIndex;
                const done = idx < currentQuestionIndex;
                return (
                  <div
                    key={`d-${idx}`}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm border ${active ? 'bg-yellow-500 text-slate-950 border-yellow-300 font-black' : done ? 'bg-green-700 text-white border-green-500' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
                  >
                    <span>Q{idx + 1}</span>
                    <span>{reward}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {showExpertPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <div className="text-xl font-black text-white mb-2">🎭 Ekspert Masası</div>
            <p className="text-slate-300 text-sm mb-4">Bir ekspert seç:</p>
            <div className="grid gap-2">
              <button onClick={() => handleExpertSelect('historian')} className="bg-slate-800 hover:bg-blue-700 rounded-lg py-3 font-bold">Tarixçi</button>
              <button onClick={() => handleExpertSelect('tech')} className="bg-slate-800 hover:bg-blue-700 rounded-lg py-3 font-bold">Texnologiya manyakı</button>
              <button onClick={() => handleExpertSelect('pop')} className="bg-slate-800 hover:bg-blue-700 rounded-lg py-3 font-bold">Pop-kultura fanatı</button>
            </div>
            <button onClick={() => setShowExpertPicker(false)} className="mt-4 w-full border border-slate-600 rounded-lg py-2 text-slate-300">Bağla</button>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <div className="text-xl font-black text-white mb-3">{modal.title}</div>
            <p className="text-slate-200 leading-relaxed">{modal.text}</p>
            <button onClick={() => setModal(null)} className="mt-5 w-full bg-blue-700 hover:bg-blue-600 rounded-lg py-2 font-bold">Anladım</button>
          </div>
        </div>
      )}

      {showAudienceModal && audienceResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="text-xl font-black text-white">📊 Auditoriyadan Kömək</div>
            <p className="text-slate-400 text-sm">Hər variantın təxminən neçə faiz dəstək gördüyünü göstərir.</p>
            <div className="space-y-2">
              {AUDIENCE_KEYS.map((key) => {
                const percent = audienceResults[key] ?? 0;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-6 font-bold text-white">{key}</span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div style={{ width: `${percent}%` }} className="h-full bg-yellow-500"></div>
                    </div>
                    <span className="w-10 text-right text-xs text-slate-300">{percent}%</span>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setShowAudienceModal(false)} className="w-full bg-blue-700 hover:bg-blue-600 rounded-lg py-2 font-bold">Bağla</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayPage;
