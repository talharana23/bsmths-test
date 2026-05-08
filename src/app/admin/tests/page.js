'use client';
import { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Clock, ListChecks, ChevronRight, X, Loader2 } from 'lucide-react';

export default function TestsPage() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [newTest, setNewTest] = useState({
    testId: '',
    title: '',
    duration: 30,
    questions: [
      { question: '', options: ['', '', '', ''], answer: '' }
    ]
  });

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    setLoading(true);
    const res = await fetch('/api/tests');
    const data = await res.json();
    setTests(data);
    setLoading(false);
  };

  const handleAddQuestion = () => {
    setNewTest({
      ...newTest,
      questions: [...newTest.questions, { question: '', options: ['', '', '', ''], answer: '' }]
    });
  };

  const handleRemoveQuestion = (index) => {
    const qs = [...newTest.questions];
    qs.splice(index, 1);
    setNewTest({ ...newTest, questions: qs });
  };

  const handleQuestionChange = (index, field, value) => {
    const qs = [...newTest.questions];
    qs[index][field] = value;
    setNewTest({ ...newTest, questions: qs });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const qs = [...newTest.questions];
    qs[qIndex].options[oIndex] = value;
    setNewTest({ ...newTest, questions: qs });
  };

  const handleSaveTest = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTest),
    });
    
    if (res.ok) {
      setNewTest({
        testId: '',
        title: '',
        duration: 30,
        questions: [{ question: '', options: ['', '', '', ''], answer: '' }]
      });
      setShowAddModal(false);
      fetchTests();
    } else {
      const data = await res.json();
      alert(data.error);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure? This will delete all student records for this test.')) return;
    await fetch(`/api/tests?id=${id}`, { method: 'DELETE' });
    fetchTests();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Test Bank</h1>
          <p className="text-slate-400">Create, edit and manage examination papers.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
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
                    <Clock size={16} className="text-slate-500" />
                    {test.duration} Minutes
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ListChecks size={16} className="text-slate-500" />
                    {test.questions.length} Questions
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="btn-secondary py-1.5 px-4 text-xs">Edit Test</button>
                  <button 
                    onClick={() => handleDelete(test.testId)}
                    className="btn-danger py-1.5 px-4 text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 group-hover:text-indigo-500/50 transition-colors" size={32} />
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex sm:items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
          <div className="glass w-full max-w-4xl relative z-10 animate-slide-up my-auto shadow-2xl shadow-black/50">
            <div className="h-1.5 bg-indigo-500 w-full" />
            <div className="p-5 md:p-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-8 sticky -top-5 md:-top-8 bg-[#151b2b] pb-4 z-20 border-b border-white/5">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold">Manual Test Creation</h3>
                  <p className="text-xs text-slate-500 mt-1">Configure your questions and correct answers below.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveTest} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Test ID</label>
                    <input
                      type="text"
                      required
                      value={newTest.testId}
                      onChange={(e) => setNewTest({...newTest, testId: e.target.value})}
                      className="input-field"
                      placeholder="e.g. MATH001"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Duration (Mins)</label>
                    <input
                      type="number"
                      required
                      value={newTest.duration?.toString() || ''}
                      onChange={(e) => setNewTest({...newTest, duration: e.target.value === '' ? '' : parseInt(e.target.value) || 0})}
                      className="input-field"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Title</label>
                    <input
                      type="text"
                      required
                      value={newTest.title}
                      onChange={(e) => setNewTest({...newTest, title: e.target.value})}
                      className="input-field"
                      placeholder="e.g. Math Final Exam"
                    />
                  </div>
                </div>

                <div className="section-separator" />

                <div className="space-y-10">
                  {newTest.questions.map((q, qIndex) => (
                    <div key={qIndex} className="glass-sm p-6 relative group/q">
                      <div className="flex items-center justify-between mb-6">
                        <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-bold uppercase">Question {qIndex + 1}</span>
                        {newTest.questions.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => handleRemoveQuestion(qIndex)}
                            className="text-slate-500 hover:text-red-500 transition-colors"
                          >
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
                            onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                            className="input-field min-h-[80px]"
                            placeholder="Type your question here..."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {q.options.map((opt, oIndex) => (
                            <div key={oIndex}>
                              <label className="block text-xs font-bold text-slate-500 mb-2">Option {String.fromCharCode(65 + oIndex)}</label>
                              <input
                                type="text"
                                required
                                value={opt}
                                onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
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
                            onChange={(e) => handleQuestionChange(qIndex, 'answer', e.target.value)}
                            className="input-field appearance-none cursor-pointer"
                          >
                            <option value="">Select Correct Option</option>
                            {q.options.map((opt, oIndex) => (
                              opt && <option key={oIndex} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button 
                    type="button" 
                    onClick={handleAddQuestion}
                    className="btn-secondary flex-1"
                  >
                    <Plus size={20} /> Add Another Question
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1">
                    {saving ? <Loader2 className="animate-spin" size={20} /> : 'Publish Test Paper'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
