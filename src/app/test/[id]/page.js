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

export default function TestPage() {
  const router = useRouter();
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Test State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [cheatingAttempts, setCheatingAttempts] = useState(0);
  const [testAborted, setTestAborted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Revision & Learning State
  const [isRevisionMode, setIsRevisionMode] = useState(false);
  const [needsRevision, setNeedsRevision] = useState({}); // { [index]: true }
  const [confidence, setConfidence] = useState({}); // { [index]: 'guess' | 'unsure' | 'confident' }
  const [showAITrick, setShowAITrick] = useState(false);
  const [aiTrick, setAiTrick] = useState('');
  const [loadingTrick, setLoadingTrick] = useState(false);
  const [revisionCompleted, setRevisionCompleted] = useState(false);
  const [revisionList, setRevisionList] = useState([]);
  const [currentRevIndex, setCurrentRevIndex] = useState(0);

  const containerRef = useRef(null);
  const timerRef = useRef(null);

  // AI Trick Logic
  const getAITrick = async () => {
    setLoadingTrick(true);
    setShowAITrick(true);
    const q = isRevisionMode ? test.questions[revisionList[currentRevIndex]] : test.questions[currentQuestionIndex];
    
    try {
      const res = await fetch('/api/ai/trick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q.question,
          answer: q.answer,
          topic: q.topic || test.title
        }),
      });
      const data = await res.json();
      setAiTrick(data.trick);
    } catch (err) {
      setAiTrick("System is busy, but remember: Repetition is key! 🔑");
    } finally {
      setLoadingTrick(false);
    }
  };

  const startRevisionMode = () => {
    const list = test.questions.map((_, i) => i).filter(i => 
      needsRevision[i] || confidence[i] === 'guess' || confidence[i] === 'unsure'
    );
    setRevisionList(list);
    setIsRevisionMode(true);
    setCurrentRevIndex(0);
    // Exit full screen for revision to make it relaxed? No, let's keep it focused.
  };

  // Fetch Test Data
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(storedUser));

    const fetchTest = async () => {
      try {
        const res = await fetch(`/api/tests?id=${id}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setTest(data);
        setTimeLeft(data.duration * 60);
      } catch (err) {
        alert('Test not found');
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [id, router]);

  // Submit Logic
  const submitTest = useCallback(async (isAuto = false, cheatDetected = false) => {
    if (submitting) return;
    setSubmitting(true);

    // Calculate score
    let score = 0;
    test.questions.forEach((q, index) => {
      if (answers[index] === q.answer) {
        score++;
      }
    });

    const resultData = {
      studentId: user.id,
      studentName: user.name,
      testId: test.testId,
      testTitle: test.title,
      score: score,
      total: test.questions.length,
      percentage: Math.round((score / test.questions.length) * 100),
      answers: answers,
      cheatingDetected: cheatDetected,
      autoSubmitted: isAuto,
      durationTaken: (test.duration * 60) - timeLeft,
      confidenceScores: confidence,
      revisionTags: needsRevision,
      isRevisionCompleted: isRevisionMode
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
    } catch (err) {
      console.error('Submission failed');
    } finally {
      setSubmitting(false);
    }
  }, [test, answers, user, timeLeft, router, submitting]);

  // Timer Logic
  useEffect(() => {
    if (!test || testAborted || submitting) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          submitTest(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [test, testAborted, submitting, submitTest]);

  // Anti-Cheating Logic
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !submitting) {
        handleCheating('Tab switch detected');
      }
    };

    const handleBlur = () => {
      if (!submitting) {
        handleCheating('Window focus lost');
      }
    };

    const handleContextMenu = (e) => e.preventDefault();
    
    const handleKeyDown = (e) => {
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'u')) {
        e.preventDefault();
        handleCheating('Shortcut key blocked');
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [submitting]);

  const handleCheating = (reason) => {
    setCheatingAttempts(prev => {
      const newCount = prev + 1;
      if (newCount >= 3) {
        setTestAborted(true);
        submitTest(false, true);
        return newCount;
      }
      return newCount;
    });
    alert(`WARNING: ${reason}. Test will be auto-submitted after 3 violations. Attempts: ${cheatingAttempts + 1}/3`);
  };

  const enterFullScreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
    setIsFullScreen(true);
  };

  // Detect exit fullscreen
  useEffect(() => {
    const fsHandler = () => {
      if (!document.fullscreenElement && !submitting) {
        setIsFullScreen(false);
        handleCheating('Full-screen mode exited');
      }
    };
    document.addEventListener('fullscreenchange', fsHandler);
    return () => document.removeEventListener('fullscreenchange', fsHandler);
  }, [submitting]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleOptionSelect = (option) => {
    setAnswers({ ...answers, [currentQuestionIndex]: option });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500" size={48} />
    </div>
  );

  if (!isFullScreen && !testAborted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <div className="glass max-w-xl w-full p-10 text-center animate-slide-up">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-indigo-500/20 glow-purple">
            <Shield className="text-indigo-400" size={40} />
          </div>
          <h2 className="text-3xl font-black text-white mb-4">Secure Exam Mode</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            This test requires <span className="text-white font-bold">Full-Screen Mode</span>. 
            Once started, do not exit full-screen or switch tabs, as this will trigger an automatic submission.
          </p>
          <button 
            onClick={enterFullScreen}
            className="btn-primary w-full h-14 text-lg font-bold"
          >
            <Maximize size={22} /> Enter Full-Screen & Start
          </button>
        </div>
      </div>
    );
  }

  if (testAborted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-rose-950/20">
        <div className="glass border-rose-500/30 max-w-xl w-full p-10 text-center">
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
            <AlertTriangle className="text-rose-500" size={40} />
          </div>
          <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Test Aborted</h2>
          <p className="text-slate-300 mb-8">
            Suspicious activity detected multiple times. Your attempt has been terminated and recorded.
          </p>
          <button onClick={() => router.push('/dashboard')} className="btn-secondary w-full">Return to Dashboard</button>
        </div>
      </div>
    );
  }

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
          <h1 className="font-bold text-lg hidden md:block">
            {isRevisionMode ? `Practicing: ${currentQuestion.question.substring(0, 30)}...` : test.title}
          </h1>
        </div>

        <div className={`flex items-center gap-3 px-6 py-2 rounded-2xl bg-slate-900/50 border border-white/10 ${timeLeft < 60 ? 'timer-critical text-rose-500 border-rose-500/30' : 'text-indigo-400'}`}>
          <Clock size={20} />
          <span className="text-2xl font-black font-mono">{formatTime(timeLeft)}</span>
        </div>

        <button 
          onClick={() => { if(confirm('Submit test now?')) submitTest(); }}
          disabled={submitting}
          className="btn-primary bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-600/20 border-none"
        >
          {submitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Finish Test</>}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col items-center p-6 md:p-12">
        <div className="max-w-4xl w-full">
          {/* Progress Tracker */}
          <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-4 scrollbar-hide">
            {!isRevisionMode ? test.questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQuestionIndex(i)}
                className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm transition-all border ${
                  currentQuestionIndex === i 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30 scale-110' 
                  : answers[i] 
                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' 
                    : 'bg-slate-900 border-white/5 text-slate-500 hover:border-indigo-500/30'
                }`}
              >
                {i + 1}
              </button>
            )) : revisionList.map((originalIndex, i) => (
              <button
                key={i}
                onClick={() => setCurrentRevIndex(i)}
                className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm transition-all border ${
                  currentRevIndex === i 
                  ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-600/30 scale-110' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}
              >
                {originalIndex + 1}
              </button>
            ))}
          </div>

          {/* Question Card */}
          <div className="glass p-8 md:p-12 animate-fade-in min-h-[500px] flex flex-col">
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-indigo-500 font-black text-sm uppercase tracking-widest">Question {currentQuestionIndex + 1} of {test.questions.length}</span>
                <div className="h-px flex-1 bg-white/5"></div>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                {currentQuestion.question}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 content-start">
              {currentQuestion.options.map((option, index) => (
                <div 
                  key={index}
                  onClick={() => !isRevisionMode && handleOptionSelect(option)}
                  className={`mcq-option ${
                    isRevisionMode 
                    ? (option === currentQuestion.answer ? 'correct border-emerald-500 bg-emerald-500/10' : (answers[revisionList[currentRevIndex]] === option ? 'wrong border-rose-500 bg-rose-500/10' : ''))
                    : (answers[currentQuestionIndex] === option ? 'selected' : '')
                  } ${isRevisionMode ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="option-letter">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-slate-200 font-medium">{option}</span>
                </div>
              ))}
            </div>

            {isRevisionMode && (
              <div className="mt-8 animate-slide-up">
                {!showAITrick ? (
                  <button 
                    onClick={getAITrick}
                    className="w-full p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center gap-2 hover:bg-indigo-500/20 transition-all"
                  >
                    💡 Help me remember this with AI Trick
                  </button>
                ) : (
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setShowAITrick(false)} className="text-white"><X size={16}/></button>
                    </div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Memory Hook by AI</p>
                    {loadingTrick ? (
                      <div className="flex items-center gap-2 text-slate-400 py-2">
                        <Loader2 className="animate-spin" size={16} />
                        <span className="text-sm italic">Crafting a clever trick...</span>
                      </div>
                    ) : (
                      <p className="text-white font-medium italic leading-relaxed text-lg">"{aiTrick}"</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Confidence & Revision Toggle */}
            <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Confidence Level</span>
                <div className="flex gap-2">
                  {[
                    { id: 'guess', label: 'Guess 🎲', color: 'hover:bg-rose-500/20 text-rose-400' },
                    { id: 'unsure', label: 'Unsure 🤔', color: 'hover:bg-amber-500/20 text-amber-400' },
                    { id: 'confident', label: 'Confident 💪', color: 'hover:bg-emerald-500/20 text-emerald-400' }
                  ].map((lvl) => (
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

            <div className="flex items-center justify-between mt-8 pt-8 border-t border-white/5">
              <button
                disabled={isRevisionMode ? currentRevIndex === 0 : currentQuestionIndex === 0}
                onClick={() => {
                  if (isRevisionMode) setCurrentRevIndex(prev => prev - 1);
                  else setCurrentQuestionIndex(prev => prev - 1);
                  setShowAITrick(false);
                }}
                className="btn-secondary disabled:opacity-20 disabled:cursor-not-allowed px-6"
              >
                <ChevronLeft size={20} /> Previous
              </button>
              
              <div className="hidden sm:block text-slate-500 text-sm font-medium">
                {isRevisionMode ? `Revision ${currentRevIndex + 1} of ${revisionList.length}` : `${Object.keys(answers).length} of ${test.questions.length} Answered`}
              </div>

              <div className="flex gap-3">
                {isRevisionMode ? (
                  currentRevIndex === revisionList.length - 1 ? (
                    <button
                      onClick={() => { if(confirm('Finished revision? Submit test now?')) submitTest(); }}
                      className="btn-primary bg-emerald-600 px-8 border-none"
                    >
                      Complete & Finish
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setCurrentRevIndex(prev => prev + 1);
                        setShowAITrick(false);
                      }}
                      className="btn-primary bg-amber-600 px-8 border-none"
                    >
                      Next to Master <ChevronRight size={20} />
                    </button>
                  )
                ) : (
                  currentQuestionIndex === test.questions.length - 1 ? (
                    <button
                      onClick={() => {
                        const revCount = Object.keys(needsRevision).filter(k => needsRevision[k]).length + 
                                         Object.keys(confidence).filter(k => ['guess', 'unsure'].includes(confidence[k])).length;
                        if (revCount > 0) {
                          startRevisionMode();
                        } else {
                          if(confirm('Submit test now?')) submitTest();
                        }
                      }}
                      className="btn-primary bg-indigo-600 px-8"
                    >
                      Finish Test
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setCurrentQuestionIndex(prev => prev + 1);
                        setShowAITrick(false);
                      }}
                      className="btn-primary px-8"
                    >
                      Next <ChevronRight size={20} />
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Violation Alert Toast */}
      {cheatingAttempts > 0 && (
        <div className="toast toast-warning flex items-center gap-3">
          <AlertTriangle size={20} />
          <div>
            <p className="font-bold">Security Alert!</p>
            <p className="text-xs opacity-90">Violation recorded ({cheatingAttempts}/3). Please stay on the page.</p>
          </div>
        </div>
      )}
    </div>
  );
}
