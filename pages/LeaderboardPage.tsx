
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LeaderboardEntry } from '../types';
import { supabaseService } from '../services/supabaseMock';

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabaseService.getLeaderboard().then(res => {
      setData(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12">
      <div className="flex justify-between items-center mb-8">
         <h1 className="text-4xl font-black text-white glow-blue">🏆 LİDERLƏR LÖVHƏSİ</h1>
         <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white transition-colors">Ana Səhifə</button>
      </div>

      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-slate-800 text-slate-400 text-xs font-bold uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Sıra</th>
              <th className="px-6 py-4">Oyunçu</th>
              <th className="px-6 py-4 text-right">Ən Yüksək Qazanc</th>
              <th className="px-6 py-4 text-right">Oyun Sayı</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-10 text-slate-500">Yüklənir...</td></tr>
            ) : data.map((entry, idx) => (
              <tr key={entry.user_id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${idx === 0 ? 'bg-yellow-500 text-slate-950' : 'bg-slate-700 text-white'}`}>
                    {idx + 1}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-white">{entry.display_name}</td>
                <td className="px-6 py-4 text-right font-black text-yellow-400">{entry.best_earnings} AZN</td>
                <td className="px-6 py-4 text-right text-slate-400">{entry.runs_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12 text-center">
         <button 
           onClick={() => navigate('/')}
           className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-black text-xl shadow-lg transition-all"
         >
           SƏN DƏ QOŞUL!
         </button>
      </div>
    </div>
  );
};

export default LeaderboardPage;
