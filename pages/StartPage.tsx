
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizRun } from '../types';
import { supabaseService } from '../services/supabaseMock';

interface StartPageProps {
  onStart: (run: QuizRun) => void;
}

const StartPage: React.FC<StartPageProps> = ({ onStart }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('kasinin-pulu:display-name:v1') || '';
  });

  const resolveUserId = () => {
    if (typeof window === 'undefined') return `guest-${Date.now()}`;
    const existing = localStorage.getItem('kasinin-pulu:user-id:v1');
    if (existing) return existing;
    const nextId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `guest-${Date.now()}`;
    localStorage.setItem('kasinin-pulu:user-id:v1', nextId);
    return nextId;
  };

  const handleStart = async () => {
    const cleanedName = displayName.trim();
    if (!cleanedName) return;

    setLoading(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('kasinin-pulu:display-name:v1', cleanedName);
      }
      const run = await supabaseService.startRun(
        resolveUserId(),
        cleanedName,
        'random'
      );
      onStart(run);
      navigate('/play');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-6xl font-extrabold mb-4 tracking-tighter text-yellow-400 glow-blue italic">
        KASIBIN PULU
      </h1>
      <p className="text-xl mb-8 text-blue-200 max-w-lg">
        "Milyonçu" olmaq üçün çox pulun olmalıdır, amma "Kasıbın Pulu" olmaq üçün ancaq ağlın!
      </p>

      <div className="bg-slate-900/80 border-2 border-slate-700 p-8 rounded-3xl w-full max-w-xl shadow-2xl backdrop-blur-sm">
        <h2 className="text-2xl font-bold mb-4 text-white">Oyun Qaydaları</h2>
        <ul className="text-left text-slate-300 space-y-3 mb-8">
          <li className="flex items-start">
            <span className="bg-yellow-500 text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-1 shrink-0">1</span>
            15 Sual, 15 addım. Maksimum 1000 AZN.
          </li>
          <li className="flex items-start">
            <span className="bg-yellow-500 text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-1 shrink-0">2</span>
            50 AZN və 400 AZN təminat pillələridir.
          </li>
          <li className="flex items-start">
            <span className="bg-yellow-500 text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-1 shrink-0">3</span>
            İstənilən vaxt "Pul götür və çıx" edə bilərsən.
          </li>
          <li className="flex items-start">
            <span className="bg-yellow-500 text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-1 shrink-0">4</span>
            6 Joker: Ekspert Masası, İpucu Al, Bir Şans Daha, 50/50, Autoriyadan Kömək, Auditoriyadan Kömək.
          </li>
        </ul>

        <div className="space-y-4">
          <div>
            <label className="block text-left text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">
              Oyunçu adı
            </label>
            <input
              type="text"
              value={displayName}
              maxLength={24}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Məsələn: Kasıb_Nəbi"
              className="w-full bg-slate-800 border-2 border-slate-700 p-3 rounded-xl text-white outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="bg-slate-800 p-3 rounded-xl text-slate-300 text-sm border border-slate-700">
            Rejim: Ümumi suallar (bütün kateqoriyalar qarışıq)
          </div>

          <button 
            onClick={handleStart}
            disabled={loading || !displayName.trim()}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-4 rounded-xl text-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50"
          >
            {loading ? "HAZIRLANIR..." : "OYUNA BAŞLA!"}
          </button>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <button onClick={() => navigate('/leaderboard')} className="text-blue-400 hover:text-blue-300 underline font-bold">Liderlər Lövhəsi</button>
        <button onClick={() => navigate('/admin')} className="text-slate-500 hover:text-slate-400 text-sm">Admin</button>
      </div>
      <div className="mt-4 text-xs text-slate-500">Oyun Əhmədov Sənan tərəfindən hazırlanıb.</div>
    </div>
  );
};

export default StartPage;
