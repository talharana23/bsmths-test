'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, User, Calendar, CheckCircle2, XCircle, Search, Loader2 } from 'lucide-react';

export default function AdminResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    const res = await fetch('/api/results');
    const data = await res.json();
    setResults(data.reverse());
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Exam Analytics</h1>
        <p className="text-slate-400">Monitor student performance and review cheating logs.</p>
      </div>

      <div className="glass overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 w-full max-w-md">
            <Search size={18} className="text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Filter by student or test name..." 
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p>Fetching result database...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500">
              <TrendingUp size={48} className="mb-4 opacity-20" />
              <p>No exam submissions recorded yet.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Test Paper</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th>Security</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">{r.studentName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{r.studentId}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{r.testTitle}</span>
                        <span className="text-[10px] text-indigo-400 font-mono">{r.testId}</span>
                      </div>
                    </td>
                    <td className="font-bold text-white">{r.score}/{r.total}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${r.percentage >= 70 ? 'bg-emerald-500' : r.percentage >= 40 ? 'bg-yellow-500' : 'bg-rose-500'}`}
                            style={{ width: `${r.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold">{r.percentage}%</span>
                      </div>
                    </td>
                    <td>
                      {r.percentage >= 40 ? (
                        <div className="badge badge-green text-[10px]">Passed</div>
                      ) : (
                        <div className="badge badge-red text-[10px]">Failed</div>
                      )}
                    </td>
                    <td>
                      {r.cheatingDetected ? (
                        <div className="flex items-center gap-1.5 text-rose-500 font-bold text-[10px] uppercase">
                          <AlertTriangle size={12} /> Flagged
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-[10px] uppercase">
                          <CheckCircle2 size={12} /> Clean
                        </div>
                      )}
                    </td>
                    <td className="text-slate-500 text-xs">
                      {new Date(r.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
