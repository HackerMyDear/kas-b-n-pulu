
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizRun } from '../types';

interface ResultPageProps {
  run: QuizRun | null;
  onRestart: () => void;
}

const ResultPage: React.FC<ResultPageProps> = ({ run, onRestart }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!run) navigate('/');
  }, [run, navigate]);

  if (!run) return null;

  const isJackpot = run.final_earnings === 1000;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className={`mb-8 p-10 rounded-full border-8 shadow-2xl ${isJackpot ? 'border-yellow-500 animate-pulse bg-yellow-500/10' : 'border-blue-500 bg-blue-500/10'}`}>
        <div className="text-slate-400 text-xl font-bold mb-2">TOPLAM QAZANC</div>
        <div className={`text-7xl font-black ${isJackpot ? 'text-yellow-400' : 'text-blue-400'}`}>
          {run.final_earnings} <span className="text-3xl">AZN</span>
        </div>
      </div>

      <h1 className="text-4xl font-extrabold text-white mb-2">
        {isJackpot ? "HALAL OLSUN, MİLYONÇU!" : "OYUN BİTDİ"}
      </h1>
      <p className="text-slate-400 mb-8 max-w-md">
        {run.correct_count} suala düzgün cavab verdin. Kasıbın pulu xeyirli olsun, bərəkətli olsun!
      </p>

      <div className="bg-slate-900 border-2 border-slate-800 p-6 rounded-3xl w-full max-w-sm mb-8">
        <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-widest text-left border-b border-slate-800 pb-2">Oyun Statistikası</h3>
          <div className="space-y-4 text-left">
            <div className="flex justify-between">
               <span className="text-slate-400">Ekspert Masası:</span>
               <span className={run.used_expert ? "text-green-500 font-bold" : "text-slate-600"}>{run.used_expert ? "İstifadə edilib" : "İstifadə edilməyib"}</span>
            </div>
            <div className="flex justify-between">
               <span className="text-slate-400">İpucu Al:</span>
               <span className={run.used_hint ? "text-green-500 font-bold" : "text-slate-600"}>{run.used_hint ? "İstifadə edilib" : "İstifadə edilməyib"}</span>
            </div>
            <div className="flex justify-between">
               <span className="text-slate-400">🔍 50/50:</span>
               <span className={run.used_fifty_fifty ? "text-green-500 font-bold" : "text-slate-600"}>{run.used_fifty_fifty ? "İstifadə edilib" : "İstifadə edilməyib"}</span>
            </div>
            <div className="flex justify-between">
               <span className="text-slate-400">Bir Şans Daha:</span>
               <span className={run.used_second_chance ? "text-green-500 font-bold" : "text-slate-600"}>{run.used_second_chance ? "İstifadə edilib" : "İstifadə edilməyib"}</span>
            </div>
            <div className="flex justify-between">
               <span className="text-slate-400">📣 Autoriyadan Kömək:</span>
               <span className={run.used_authority ? "text-green-500 font-bold" : "text-slate-600"}>{run.used_authority ? "İstifadə edilib" : "İstifadə edilməyib"}</span>
            </div>
            <div className="flex justify-between">
               <span className="text-slate-400">📊 Auditoriyadan Kömək:</span>
               <span className={run.used_audience ? "text-green-500 font-bold" : "text-slate-600"}>{run.used_audience ? "İstifadə edilib" : "İstifadə edilməyib"}</span>
            </div>
            <div className="flex justify-between">
               <span className="text-slate-400">Başlanğıc Rejim:</span>
               <span className="text-white font-bold">{run.category_mode === 'random' ? "Random" : run.initial_category}</span>
            </div>
          </div>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button 
          onClick={() => { onRestart(); navigate('/'); }}
          className="bg-yellow-500 text-slate-950 font-black py-4 rounded-2xl text-xl shadow-lg transition-transform active:scale-95"
        >
          YENİDƏN OYNA
        </button>
        <button 
          onClick={() => { onRestart(); navigate('/leaderboard'); }}
          className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl text-lg transition-all"
        >
          LİDERLƏR LÖVHƏSİ
        </button>
      </div>
    </div>
  );
};

export default ResultPage;
