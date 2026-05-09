'use client';
import { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Clock, ListChecks, ChevronRight, X, Loader2, Pencil } from 'lucide-react';

export default function TestsPage() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null); // testId currently being deleted
  const [toast, setToast] = useState(null);        // { type: 'success'|'error', msg }

  const [newTest, setNewTest] = useState({
    testId: '',
    title: '',
    duration: 30,
    questions: [{ question: '', options: ['', '', '', ''], answer: '' }],
  });

  useEffect(() => { fetchTests(); }, []);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchTests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tests');
      const data = await res.json();
      setTests(Array.isArray(data) ? data : []);
    } catch {
      showToast('error', 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  // ── Question helpers ─────────────────────────────────────────────────────────
  const addQuestion = (setter) =>
    setter(prev => ({
      ...prev,
      questions: [...prev.questions, { question: '', options: ['', '', '', ''], answer: '' }],
    }));

  const removeQuestion = (setter, index) =>
    setter(prev => {
      const qs = [...prev.questions];
      qs.splice(index, 1);
      return { ...prev, questions: qs };
    });

  const updateQuestion = (setter, index, field, value) =>
    setter(prev => {
      const qs = [...prev.questions];
      qs[index] = { ...qs[index], [field]: value };
      // clear answer if it no longer matches any option
      if (field === 'options') {
        if (!qs[index].options.includes(qs[index].answer)) qs[index].answer = '';
      }
      return { ...prev, questions: qs };
    });

  const updateOption = (setter, qIndex, oIndex, value) =>
    setter(prev => {
      const qs = [...prev.questions];
      const opts = [...qs[qIndex].options];
      opts[oIndex] = value;
      qs[qIndex] = { ...qs[qIndex], options: opts };
      if (!opts.includes(qs[qIndex].answer)) qs[qIndex].answer = '';
      return { ...prev, questions: qs };
    });

  // ── Save new test ────────────────────────────────────────────────────────────
  const handleSaveTest = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTest),
      });
      const data = await res.json();
      if (res.ok) {
        setNewTest({ testId: '', title: '', duration: 30, questions: [{ question: '', options: ['', '', '', ''], answer: '' }] });
        setShowAddModal(false);
        await fetchTests();
        showToast('success', 'Test published successfully!');
      } else {
        showToast('error', data.error || 'Failed to save test');
      }
    } catch {
      showToast('error', 'Network error — could not save test');
    } finally {
      setSaving(false);
    }
  };

  // ── Update existing test ─────────────────────────────────────────────────────
  const handleUpdateTest = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/tests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTest),
      });
      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        await fetchTests();
        showToast('success', 'Test updated successfully!');
      } else {
        showToast('error', data.error || 'Failed to update test');
      }
    } catch {
      showToast('error', 'Network error — could not update test');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (testId) => {
    // Use a custom inline confirm instead of window.confirm (blocked in some browsers/iframes)
    setDeleting(testId); // this triggers the inline confirmation UI
  };

  const confirmDelete = async (testId) => {
    setDeleting('__loading__');
    try {
      const res = await fetch(`/api/tests?id=${encodeURIComponent(testId)}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchTests();
        showToast('success', `Test "${testId}" deleted.`);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast('error', data.error || 'Delete failed');
      }
    } catch {
      showToast('error', 'Network error — could not delete test');
    } finally {
      setDeleting(null);
    }
  };

  const openEditModal = (test) => {
    // Deep-clone so edits don't mutate the list state
    setEditingTest(JSON.parse(JSON.stringify(test)));
    setShowEditModal(true);
  };

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'} flex items-center gap-3`}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Test Bank</h1>
          <p className="text-slate-400">Create, edit and manage examination papers.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={20} /> Create New Test
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p>Loading test repository...</p>
          </div>
        ) : tests.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 glass">
            <BookOpen size={48} className="mb-4 opacity-20" />
            <p>No tests created yet. Create one manually or upload JSON.</p>
          </div>
        ) : (
          tests.map((test) => (
            <div key={test.testId} className="glass group hover:border-indigo-500/30 transition-all duration-300 p-6 flex flex-col sm:flex-row gap-6 relative overflow-hidden">
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:glow-purple transition-all">
                <BookOpen size={30} />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{test.title}</h3>
                  <div className="badge badge-blue">{test.testId}</div>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-6">
                  <div className="flex items-center gap-1.5">
                    <Clock size={16} className="text-slate-500" /> {test.duration} Minutes
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ListChecks size={16} className="text-slate-500" /> {test.questions.length} Questions
                  </div>
                </div>

                {/* Inline delete confirmation */}
                {deleting === test.testId ? (
                  <div className="flex items-center gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl animate-fade-in">
                    <span className="text-rose-400 text-sm font-semibold flex-1">
                      Delete this test and all its records?
                    </span>
                    <button
                      onClick={() => confirmDelete(test.testId)}
                      className="btn-danger py-1.5 px-4 text-xs"
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setDeleting(null)}
                      className="btn-secondary py-1.5 px-4 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : deleting === '__loading__' ? (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Loader2 className="animate-spin" size={16} /> Deleting...
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => openEditModal(test)}
                      className="btn-secondary py-1.5 px-4 text-xs"
                    >
                      <Pencil size={14} /> Edit Test
                    </button>
                    <button
                      onClick={() => handleDelete(test.testId)}
                      className="btn-danger py-1.5 px-4 text-xs"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 group-hover:text-indigo-500/50 transition-colors" size={32} />
            </div>
          ))
        )}
      </div>

      {/* ── Create Test Modal ── */}
      {showAddModal && (
        <TestFormModal
          title="Manual Test Creation"
          test={newTest}
          setTest={setNewTest}
          onSave={handleSaveTest}
          onClose={() => setShowAddModal(false)}
          saving={saving}
          isEdit={false}
          addQuestion={() => addQuestion(setNewTest)}
          removeQuestion={(i) => removeQuestion(setNewTest, i)}
          updateQuestion={(i, f, v) => updateQuestion(setNewTest, i, f, v)}
          updateOption={(qi, oi, v) => updateOption(setNewTest, qi, oi, v)}
        />
      )}

      {/* ── Edit Test Modal ── */}
      {showEditModal && editingTest && (
        <TestFormModal
          title="Edit Test"
          test={editingTest}
          setTest={setEditingTest}
          onSave={handleUpdateTest}
          onClose={() => setShowEditModal(false)}
          saving={saving}
          isEdit={true}
          addQuestion={() => addQuestion(setEditingTest)}
          removeQuestion={(i) => removeQuestion(setEditingTest, i)}
          updateQuestion={(i, f, v) => updateQuestion(setEditingTest, i, f, v)}
          updateOption={(qi, oi, v) => updateOption(setEditingTest, qi, oi, v)}
        />
      )}
    </div>
  );
}

// ── Shared form modal ─────────────────────────────────────────────────────────
function TestFormModal({ title, test, setTest, onSave, onClose, saving, isEdit, addQuestion, removeQuestion, updateQuestion, updateOption }) {
  return (
    <div className="fixed inset-0 z-[100] flex sm:items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="glass w-full max-w-4xl relative z-10 animate-slide-up my-auto shadow-2xl shadow-black/50">
        <div className={`h-1.5 w-full ${isEdit ? 'bg-amber-500' : 'bg-indigo-500'}`} />
        <div className="p-5 md:p-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-8 sticky -top-5 md:-top-8 bg-[#151b2b] pb-4 z-20 border-b border-white/5">
            <div>
              <h3 className={`text-xl md:text-2xl font-bold ${isEdit ? 'text-amber-400' : ''}`}>{title}</h3>
              <p className="text-xs text-slate-500 mt-1">Configure questions and correct answers below.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={onSave} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-400 mb-2">Test ID</label>
                <input
                  type="text" required
                  value={test.testId}
                  onChange={(e) => setTest(p => ({ ...p, testId: e.target.value }))}
                  className={`input-field ${isEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="e.g. MATH001"
                  disabled={isEdit}
                />
                {isEdit && <p className="text-[10px] text-slate-600 mt-1 ml-1">Test ID cannot be changed</p>}
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-400 mb-2">Duration (Mins)</label>
                <input
                  type="number" required min="1"
                  value={test.duration?.toString() || ''}
                  onChange={(e) => setTest(p => ({ ...p, duration: e.target.value === '' ? '' : parseInt(e.target.value) || 0 }))}
                  className="input-field"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-400 mb-2">Title</label>
                <input
                  type="text" required
                  value={test.title}
                  onChange={(e) => setTest(p => ({ ...p, title: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. Math Final Exam"
                />
              </div>
            </div>

            <div className="section-separator" />

            <div className="space-y-10">
              {test.questions.map((q, qIndex) => (
                <div key={qIndex} className="glass-sm p-6 relative group/q">
                  <div className="flex items-center justify-between mb-6">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase text-white ${isEdit ? 'bg-amber-600' : 'bg-indigo-600'}`}>
                      Question {qIndex + 1}
                    </span>
                    {test.questions.length > 1 && (
                      <button type="button" onClick={() => removeQuestion(qIndex)} className="text-slate-500 hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Question Text</label>
                      <textarea
                        required
                        value={q.question}
                        onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                        className="input-field min-h-[80px]"
                        placeholder="Type your question here..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex}>
                          <label className="block text-xs font-bold text-slate-500 mb-2">Option {String.fromCharCode(65 + oIndex)}</label>
                          <input
                            type="text" required
                            value={opt}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            className="input-field"
                            placeholder={`Enter option ${oIndex + 1}`}
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Correct Answer</label>
                      <select
                        required
                        value={q.answer}
                        onChange={(e) => updateQuestion(qIndex, 'answer', e.target.value)}
                        className="input-field appearance-none cursor-pointer"
                      >
                        <option value="">Select Correct Option</option>
                        {q.options.map((opt, oIndex) =>
                          opt ? <option key={oIndex} value={opt}>{opt}</option> : null
                        )}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button type="button" onClick={addQuestion} className="btn-secondary flex-1">
                <Plus size={20} /> Add Another Question
              </button>
              <button type="submit" disabled={saving} className={`btn-primary flex-1 ${isEdit ? 'bg-amber-600 border-none' : ''}`}>
                {saving ? <Loader2 className="animate-spin" size={20} /> : isEdit ? 'Update Test' : 'Publish Test Paper'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}