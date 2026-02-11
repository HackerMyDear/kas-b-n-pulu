
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSummary } from '../types';
import { supabaseService } from '../services/supabaseMock';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = async () => {
    setLoading(true);
    const nextSummary = await supabaseService.getAdminSummary();
    setSummary(nextSummary);
    setLoading(false);
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const formatDateTime = (date?: Date) => {
    if (!date) return '-';
    return date.toLocaleString('az-AZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-white">⚙️ ADMİN PANEL</h1>
        <div className="flex items-center gap-3">
          <button onClick={loadSummary} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-bold">
            Yenilə
          </button>
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white">Geri</button>
        </div>
      </div>

      {loading || !summary ? (
        <div className="bg-slate-900 p-10 rounded-3xl border border-slate-800 text-center text-slate-400">
          Statistikalar yüklənir...
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Bitmiş Oyunlar</div>
              <div className="text-3xl font-black text-yellow-400 mt-2">{summary.total_runs}</div>
            </div>
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Aktiv Oyunçular</div>
              <div className="text-3xl font-black text-blue-400 mt-2">{summary.total_players}</div>
            </div>
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Orta Qazanc</div>
              <div className="text-3xl font-black text-white mt-2">{summary.avg_earnings} AZN</div>
            </div>
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Maksimum Qazanc</div>
              <div className="text-3xl font-black text-green-400 mt-2">{summary.top_earnings} AZN</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
              <h2 className="text-xl font-bold mb-4 text-blue-400">Son Oyunlar</h2>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                {summary.recent_runs.length === 0 ? (
                  <p className="text-slate-500">Hələ tamamlanmış oyun yoxdur.</p>
                ) : summary.recent_runs.map(run => (
                  <div key={run.id} className="bg-slate-800/70 border border-slate-700 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-bold text-white">{run.display_name}</div>
                      <div className="text-yellow-400 font-black">{run.final_earnings} AZN</div>
                    </div>
                    <div className="text-xs text-slate-400">
                      Düz cavab: {run.correct_count} | Rejim: {run.category_mode === 'random' ? 'Random' : run.initial_category}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Başlama: {formatDateTime(run.started_at)} | Bitmə: {formatDateTime(run.ended_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
              <h2 className="text-xl font-bold mb-4 text-yellow-500">Kateqoriya Keçidləri</h2>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                {summary.category_switches.length === 0 ? (
                  <p className="text-slate-500">Kateqoriya dəyişimi qeydə alınmayıb.</p>
                ) : summary.category_switches.map(step => (
                  <div key={step.id} className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 text-sm">
                    <div className="text-white font-bold mb-1">Run: {step.run_id.slice(0, 8)}...</div>
                    <div className="text-slate-300">
                      Q{step.question_number} - {step.category} → <span className="text-yellow-400 font-bold">{step.category_switch_to}</span>
                    </div>
                    <div className="text-slate-500 mt-1">{formatDateTime(step.created_at)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 bg-slate-900 p-6 rounded-3xl border border-slate-800">
            <h2 className="text-xl font-bold mb-4 text-white">Son Addımlar</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500 uppercase tracking-widest text-xs">
                  <tr>
                    <th className="py-3">Vaxt</th>
                    <th>Run</th>
                    <th>Sual</th>
                    <th>Hadisə</th>
                    <th>Nəticə</th>
                    <th className="text-right">Qazanc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {summary.recent_steps.map(step => (
                    <tr key={step.id}>
                      <td className="py-3 text-slate-500">{formatDateTime(step.created_at)}</td>
                      <td className="text-slate-300">{step.run_id.slice(0, 8)}...</td>
                      <td className="text-slate-300">Q{step.question_number}</td>
                      <td className="text-blue-300">{step.event_type}</td>
                      <td className="text-slate-300">
                        {step.event_type === 'answer'
                          ? (step.is_correct ? 'Düzgün' : 'Səhv')
                          : step.used_joker || (step.category_switch_to ? 'switch' : '-')}
                      </td>
                      <td className="text-right font-bold text-yellow-400">{step.earnings_after} AZN</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPage;
