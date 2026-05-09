'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, Calendar, CheckCircle2, XCircle, Search, Loader2, RefreshCw, X } from 'lucide-react';

export default function AdminResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [reattempting, setReattempting] = useState(null); // resultIndex being processed
  const [confirmModal, setConfirmModal] = useState(null); // { index, studentName, testTitle }
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchResults(); }, []);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchResults = async () => {
    setLoading(true);
    const res = await fetch('/api/results');
    const data = await res.json();
    setResults(data.reverse());
    setLoading(false);
  };

  const handleGrantReattempt = async (result, index) => {
    setReattempting(index);
    setConfirmModal(null);
    try {
      const res = await fetch('/api/results', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: result.studentId, testId: result.testId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Re-attempt granted to ${result.studentName} for "${result.testTitle}"`);
        await fetchResults();
      } else {
        showToast('error', data.error || 'Failed to grant re-attempt');
      }
    } catch {
      showToast('error', 'Network error — could not grant re-attempt');
    } finally {
      setReattempting(null);
    }
  };

  const filtered = results.filter(r =>
    r.studentName?.toLowerCase().includes(search.toLowerCase()) ||
    r.studentId?.toLowerCase().includes(search.toLowerCase()) ||
    r.testTitle?.toLowerCase().includes(search.toLowerCase()) ||
    r.testId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'} flex items-center gap-3`}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setConfirmModal(null)} />
          <div className="glass w-full max-w-md relative z-10 animate-slide-up overflow-hidden">
            <div className="h-1.5 bg-amber-500 w-full" />
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/20">
                  <RefreshCw size={24} />
                </div>
                <button onClick={() => setConfirmModal(null)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Grant Re-attempt?</h3>
              <p className="text-slate-400 text-sm mb-2">
                This will delete the existing submission for:
              </p>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-6 space-y-1">
                <p className="text-white font-semibold">{confirmModal.studentName}</p>
                <p className="text-slate-400 text-sm font-mono">{confirmModal.studentId}</p>
                <p className="text-indigo-400 text-sm mt-2">Test: {confirmModal.testTitle}</p>
              </div>
              <p className="text-amber-400 text-xs mb-6 flex items-center gap-2">
                <AlertTriangle size={14} />
                The student will be able to retake this exam from scratch.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleGrantReattempt(confirmModal.result, confirmModal.index)}
                  className="btn-primary flex-1 bg-amber-600 border-none"
                >
                  <RefreshCw size={16} /> Yes, Grant Re-attempt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Exam Analytics</h1>
        <p className="text-slate-400">Monitor student performance, review cheating logs, and manage re-attempts.</p>
      </div>

      <div className="glass overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 w-full max-w-md">
            <Search size={18} className="text-slate-400 mr-2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by student, ID, or test name..."
              className="bg-transparent border-none outline-none text-sm w-full text-slate-200 placeholder:text-slate-500"
            />
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-lg border border-white/5">
            Total Submissions: <span className="text-indigo-400">{filtered.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p>Fetching result database...</p>
            </div>
          ) : filtered.length === 0 ? (
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
                  <th className="text-right">Re-attempt</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i} className={r.cheatingDetected ? 'bg-rose-500/5' : ''}>
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
                      {r.percentage >= 40
                        ? <div className="badge badge-green text-[10px]">Passed</div>
                        : <div className="badge badge-red text-[10px]">Failed</div>
                      }
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
                    <td className="text-right">
                      {reattempting === i ? (
                        <Loader2 className="animate-spin text-amber-400 ml-auto" size={18} />
                      ) : (
                        <button
                          onClick={() => setConfirmModal({
                            index: i,
                            result: r,
                            studentName: r.studentName,
                            studentId: r.studentId,
                            testTitle: r.testTitle,
                          })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 ml-auto"
                          title="Grant Re-attempt"
                        >
                          <RefreshCw size={12} /> Re-attempt
                        </button>
                      )}
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