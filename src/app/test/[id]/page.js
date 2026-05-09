'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Clock,
  Shield,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  Maximize,
  Loader2,
  X
} from 'lucide-react';
import { MathText } from '@/components/MathRenderer';

export default function TestPage() {
  const router = useRouter();
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [cheatingAttempts, setCheatingAttempts] = useState(0);
  const [testFinalized, setTestFinalized] = useState(false);
  const [testAborted, setTestAborted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [isRevisionMode, setIsRevisionMode] = useState(false);
  const [needsRevision, setNeedsRevision] = useState({});
  const [confidence, setConfidence] = useState({});
  const [showAITrick, setShowAITrick] = useState(false);
  const [aiTrick, setAiTrick] = useState('');
  const [loadingTrick, setLoadingTrick] = useState(false);
  const [revisionList, setRevisionList] = useState([]);
  const [currentRevIndex, setCurrentRevIndex] = useState(0);

  const containerRef = useRef(null);
  const timerRef = useRef(null);

  const testRef = useRef(null);
  const answersRef = useRef({});
  const userRef = useRef(null);
  const timeLeftRef = useRef(0);
  const testFinalizedRef = useRef(false);
  const cheatingAttemptsRef = useRef(0);
  const needsRevisionRef = useRef({});
  const confidenceRef = useRef({});
  const isRevisionModeRef = useRef(false);

  useEffect(() => { testRef.current = test; }, [test]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { testFinalizedRef.current = testFinalized; }, [testFinalized]);
  useEffect(() => { cheatingAttemptsRef.current = cheatingAttempts; }, [cheatingAttempts]);
  useEffect(() => { needsRevisionRef.current = needsRevision; }, [needsRevision]);
  useEffect(() => { confidenceRef.current = confidence; }, [confidence]);
  useEffect(() => { isRevisionModeRef.current = isRevisionMode; }, [isRevisionMode]);

  const submitTestCore = useCallback(async ({ isAuto = false, cheatDetected = false } = {}) => {
    if (testFinalizedRef.current) return;
    testFinalizedRef.current = true;
    setTestFinalized(true);
    setSubmitting(true);
    clearInterval(timerRef.current);

    const currentTest = testRef.current;
    const currentAnswers = answersRef.current;
    const currentUser = userRef.current;
    if (!currentTest || !currentUser) { setSubmitting(false); return; }

    let score = 0;
    currentTest.questions.forEach((q, index) => {
      if (currentAnswers[index] === q.answer) score++;
    });

    const resultData = {
      studentId: currentUser.id,
      studentName: currentUser.name,
      testId: currentTest.testId,
      testTitle: currentTest.title,
      score,
      total: currentTest.questions.length,
      percentage: Math.round((score / currentTest.questions.length) * 100),
      answers: currentAnswers,
      cheatingDetected: cheatDetected,
      autoSubmitted: isAuto,
      durationTaken: (currentTest.duration * 60) - timeLeftRef.current,
      confidenceScores: confidenceRef.current,
      revisionTags: needsRevisionRef.current,
      isRevisionCompleted: isRevisionModeRef.current,
    };

    try {
      const res = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resultData),
      });
      if (res.ok) {
        localStorage.setItem('lastResult', JSON.stringify(resultData));
        router.push('/result');
      }
    } catch {
      localStorage.setItem('lastResult', JSON.stringify(resultData));
      router.push('/result');
    } finally {
      setSubmitting(false);
    }
  }, [router]);

  const handleCheating = useCallback((reason) => {
    if (testFinalizedRef.current) return;
    const newCount = cheatingAttemptsRef.current + 1;
    cheatingAttemptsRef.current = newCount;
    setCheatingAttempts(newCount);
    if (newCount >= 3) {
      setTestAborted(true);
      submitTestCore({ isAuto: false, cheatDetected: true });
    } else {
      alert(`⚠️ SECURITY WARNING\n\nReason: ${reason}\n\nViolation ${newCount}/3 recorded.\nOn the 3rd violation your test will be immediately submitted.`);
    }
  }, [submitTestCore]);

  const getAITrick = async () => {
    setLoadingTrick(true);
    setShowAITrick(true);
    const q = isRevisionMode
      ? test.questions[revisionList[currentRevIndex]]
      : test.questions[currentQuestionIndex];
    try {
      const res = await fetch('/api/ai/trick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q.question, answer: q.answer, topic: q.topic || test.title }),
      });
      const data = await res.json();
      setAiTrick(data.trick);
    } catch {
      setAiTrick("System is busy, but remember: Repetition is key! 🔑");
    } finally {
      setLoadingTrick(false);
    }
  };

  const startRevisionMode = () => {
    const list = test.questions.map((_, i) => i)
      .filter(i => needsRevision[i] || confidence[i] === 'guess' || confidence[i] === 'unsure');
    setRevisionList(list);
    setIsRevisionMode(true);
    setCurrentRevIndex(0);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) { router.push('/login'); return; }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    const fetchTest = async () => {
      try {
        const res = await fetch(`/api/tests?id=${id}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setTest(data);
        setTimeLeft(data.duration * 60);
        timeLeftRef.current = data.duration * 60;
      } catch {
        alert('Test not found');
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [id, router]);

  useEffect(() => {
    if (!test || testFinalized) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        timeLeftRef.current = next;
        if (next <= 0) { clearInterval(timerRef.current); submitTestCore({ isAuto: true }); return 0; }
        return next;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [test, testFinalized, submitTestCore]);

  useEffect(() => {
    const onVisibility = () => { if (document.hidden) handleCheating('Tab switch / window hidden'); };
    const onBlur      = () => handleCheating('Window lost focus');
    const onCtx       = (e) => e.preventDefault();
    const onKey       = (e) => {
      const blocked = (e.ctrlKey || e.metaKey) && ['c','v','u','a','s'].includes(e.key.toLowerCase());
      if (blocked) { e.preventDefault(); handleCheating(`Keyboard shortcut blocked (${e.key.toUpperCase()})`); }
      if (e.key === 'F12') { e.preventDefault(); handleCheating('DevTools shortcut blocked'); }
    };
    window.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('contextmenu', onCtx);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('contextmenu', onCtx);
      window.removeEventListener('keydown', onKey);
    };
  }, [handleCheating]);

  useEffect(() => {
    const fsHandler = () => {
      if (!document.fullscreenElement) { setIsFullScreen(false); handleCheating('Full-screen mode exited'); }
    };
    document.addEventListener('fullscreenchange', fsHandler);
    return () => document.removeEventListener('fullscreenchange', fsHandler);
  }, [handleCheating]);

  const enterFullScreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    setIsFullScreen(true);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const handleOptionSelect = (option) => {
    const updated = { ...answersRef.current, [currentQuestionIndex]: option };
    setAnswers(updated);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500" size={48} />
    </div>
  );

  if (!isFullScreen && !testAborted && !testFinalized) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <div className="glass max-w-xl w-full p-10 text-center animate-slide-up">
        <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-indigo-500/20 glow-purple">
          <Shield className="text-indigo-400" size={40} />
        </div>
        <h2 className="text-3xl font-black text-white mb-4">Secure Exam Mode</h2>
        <p className="text-slate-400 mb-8 leading-relaxed">
          This test requires <span className="text-white font-bold">Full-Screen Mode</span>.
          Once started, do not exit full-screen or switch tabs.<br /><br />
          <span className="text-rose-400 font-semibold">3 violations = immediate termination.</span>
        </p>
        <button onClick={enterFullScreen} className="btn-primary w-full h-14 text-lg font-bold">
          <Maximize size={22} /> Enter Full-Screen & Start
        </button>
      </div>
    </div>
  );

  if (testAborted) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-rose-950/20">
      <div className="glass border-rose-500/30 max-w-xl w-full p-10 text-center">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
          <AlertTriangle className="text-rose-500" size={40} />
        </div>
        <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Test Terminated</h2>
        <p className="text-slate-300 mb-4">3 security violations detected. Your attempt has been forcibly submitted and flagged.</p>
        <p className="text-slate-500 text-sm mb-8">Your answers have been recorded with <span className="text-rose-400 font-bold">CHEATING DETECTED</span> status. Redirecting...</p>
        {submitting && <div className="flex items-center justify-center gap-2 text-slate-400"><Loader2 className="animate-spin" size={20} /><span className="text-sm">Submitting...</span></div>}
      </div>
    </div>
  );

  const currentQuestion = isRevisionMode
    ? test.questions[revisionList[currentRevIndex]]
    : test.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0b14] test-fullscreen select-none" ref={containerRef}>
      {/* Header */}
      <header className="h-20 bg-[#16213e]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className={`badge ${isRevisionMode ? 'badge-amber' : 'badge-blue'} font-mono py-1.5`}>
            {isRevisionMode ? 'REVISION MODE' : test.testId}
          </div>
          <h1 className="font-bold text-lg hidden md:block">{test.title}</h1>
        </div>
        <div className={`flex items-center gap-3 px-6 py-2 rounded-2xl bg-slate-900/50 border border-white/10 ${timeLeft < 60 ? 'timer-critical text-rose-500 border-rose-500/30' : 'text-indigo-400'}`}>
          <Clock size={20} />
          <span className="text-2xl font-black font-mono">{formatTime(timeLeft)}</span>
        </div>
        <button
          onClick={() => { if (confirm('Submit test now?')) submitTestCore(); }}
          disabled={submitting || testFinalized}
          className="btn-primary bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg border-none"
        >
          {submitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Finish Test</>}
        </button>
      </header>

      <main className="flex-1 overflow-auto flex flex-col items-center p-6 md:p-12">
        <div className="max-w-4xl w-full">
          {/* Question nav dots */}
          <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-4 scrollbar-hide">
            {(!isRevisionMode ? test.questions : revisionList.map(i => test.questions[i])).map((_, i) => (
              <button
                key={i}
                onClick={() => isRevisionMode ? setCurrentRevIndex(i) : setCurrentQuestionIndex(i)}
                className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm transition-all border ${
                  (isRevisionMode ? currentRevIndex : currentQuestionIndex) === i
                    ? (isRevisionMode ? 'bg-amber-600 border-amber-500 text-white scale-110' : 'bg-indigo-600 border-indigo-500 text-white scale-110')
                    : (!isRevisionMode && answers[i])
                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                    : 'bg-slate-900 border-white/5 text-slate-500 hover:border-indigo-500/30'
                }`}
              >
                {isRevisionMode ? revisionList[i] + 1 : i + 1}
              </button>
            ))}
          </div>

          {/* Question card */}
          <div className="glass p-8 md:p-12 animate-fade-in min-h-[500px] flex flex-col">
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-indigo-500 font-black text-sm uppercase tracking-widest">
                  Question {isRevisionMode ? revisionList[currentRevIndex] + 1 : currentQuestionIndex + 1} of {test.questions.length}
                </span>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              {/* ── Math-rendered question text ── */}
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                <MathText>{currentQuestion.question}</MathText>
              </h2>
            </div>

            {/* ── Math-rendered options ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 content-start">
              {currentQuestion.options.map((option, index) => {
                let optClass = '';
                if (isRevisionMode) {
                  if (String(option).trim() === String(currentQuestion.answer).trim()) optClass = 'correct border-emerald-500 bg-emerald-500/10';
                  else if (answers[revisionList[currentRevIndex]] === option) optClass = 'wrong border-rose-500 bg-rose-500/10';
                } else {
                  if (answers[currentQuestionIndex] === option) optClass = 'selected';
                }
                return (
                  <div
                    key={index}
                    onClick={() => !isRevisionMode && handleOptionSelect(option)}
                    className={`mcq-option ${optClass} ${isRevisionMode ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className="option-letter">{String.fromCharCode(65 + index)}</div>
                    <span className="text-slate-200 font-medium">
                      <MathText>{String(option)}</MathText>
                    </span>
                  </div>
                );
              })}
            </div>

            {/* AI trick (revision mode) */}
            {isRevisionMode && (
              <div className="mt-8 animate-slide-up">
                {!showAITrick ? (
                  <button onClick={getAITrick} className="w-full p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center gap-2 hover:bg-indigo-500/20 transition-all">
                    💡 Help me remember this with AI Trick
                  </button>
                ) : (
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 relative">
                    <button onClick={() => setShowAITrick(false)} className="absolute top-3 right-3 text-slate-500 hover:text-white"><X size={16}/></button>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Memory Hook by AI</p>
                    {loadingTrick
                      ? <div className="flex items-center gap-2 text-slate-400 py-2"><Loader2 className="animate-spin" size={16}/><span className="text-sm italic">Crafting a clever trick...</span></div>
                      : <p className="text-white font-medium italic leading-relaxed text-lg">"{aiTrick}"</p>
                    }
                  </div>
                )}
              </div>
            )}

            {/* Confidence & revision tag */}
            <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Confidence Level</span>
                <div className="flex gap-2">
                  {[
                    { id: 'guess', label: 'Guess 🎲', color: 'hover:bg-rose-500/20 text-rose-400' },
                    { id: 'unsure', label: 'Unsure 🤔', color: 'hover:bg-amber-500/20 text-amber-400' },
                    { id: 'confident', label: 'Confident 💪', color: 'hover:bg-emerald-500/20 text-emerald-400' },
                  ].map(lvl => (
                    <button
                      key={lvl.id}
                      onClick={() => setConfidence({ ...confidence, [currentQuestionIndex]: lvl.id })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        confidence[currentQuestionIndex] === lvl.id
                          ? lvl.color.replace('hover:bg', 'bg').replace('/20', '/40') + ' border-current'
                          : 'bg-white/5 border-transparent text-slate-400 ' + lvl.color
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setNeedsRevision({ ...needsRevision, [currentQuestionIndex]: !needsRevision[currentQuestionIndex] })}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all border ${
                  needsRevision[currentQuestionIndex]
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Send size={18} className={needsRevision[currentQuestionIndex] ? 'animate-pulse' : ''} />
                {needsRevision[currentQuestionIndex] ? 'Marked for Revision' : 'Need to Revise?'}
              </button>
            </div>

            {/* Nav buttons */}
            <div className="flex items-center justify-between mt-8 pt-8 border-t border-white/5">
              <button
                disabled={isRevisionMode ? currentRevIndex === 0 : currentQuestionIndex === 0}
                onClick={() => { if (isRevisionMode) setCurrentRevIndex(p => p - 1); else setCurrentQuestionIndex(p => p - 1); setShowAITrick(false); }}
                className="btn-secondary disabled:opacity-20 disabled:cursor-not-allowed px-6"
              >
                <ChevronLeft size={20} /> Previous
              </button>

              <div className="hidden sm:block text-slate-500 text-sm font-medium">
                {isRevisionMode
                  ? `Revision ${currentRevIndex + 1} of ${revisionList.length}`
                  : `${Object.keys(answers).length} of ${test.questions.length} Answered`}
              </div>

              <div className="flex gap-3">
                {isRevisionMode ? (
                  currentRevIndex === revisionList.length - 1 ? (
                    <button onClick={() => { if (confirm('Finished revision? Submit now?')) submitTestCore(); }} className="btn-primary bg-emerald-600 px-8 border-none">Complete & Finish</button>
                  ) : (
                    <button onClick={() => { setCurrentRevIndex(p => p + 1); setShowAITrick(false); }} className="btn-primary bg-amber-600 px-8 border-none">Next to Master <ChevronRight size={20} /></button>
                  )
                ) : currentQuestionIndex === test.questions.length - 1 ? (
                  <button
                    onClick={() => {
                      const revCount = Object.keys(needsRevision).filter(k => needsRevision[k]).length +
                        Object.keys(confidence).filter(k => ['guess','unsure'].includes(confidence[k])).length;
                      if (revCount > 0) startRevisionMode();
                      else if (confirm('Submit test now?')) submitTestCore();
                    }}
                    className="btn-primary bg-indigo-600 px-8"
                  >
                    Finish Test
                  </button>
                ) : (
                  <button onClick={() => { setCurrentQuestionIndex(p => p + 1); setShowAITrick(false); }} className="btn-primary px-8">
                    Next <ChevronRight size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {cheatingAttempts > 0 && !testAborted && (
        <div className="toast toast-warning flex items-center gap-3">
          <AlertTriangle size={20} />
          <div>
            <p className="font-bold">Security Violation Recorded!</p>
            <p className="text-xs opacity-90">{cheatingAttempts}/3 violations. {3 - cheatingAttempts} remaining before forced submission.</p>
          </div>
        </div>
      )}
    </div>
  );
}