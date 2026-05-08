'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Home, 
  Award,
  Calendar,
  Clock,
  Target,
  ArrowRight
} from 'lucide-react';

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState(null);

  useEffect(() => {
    const storedResult = localStorage.getItem('lastResult');
    if (!storedResult) {
      router.push('/dashboard');
      return;
    }
    setResult(JSON.parse(storedResult));
  }, [router]);

  if (!result) return null;

  const getStatusColor = (percentage) => {
    if (percentage >= 70) return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
    if (percentage >= 40) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-rose-400 bg-rose-500/20 border-rose-500/30';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 70) return 'bg-emerald-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-rose-500';
  };

  const getStatusText = (percentage) => {
    if (percentage >= 70) return 'Distinction';
    if (percentage >= 40) return 'Qualified';
    return 'Failed';
  };

  return (
    <div className="min-h-screen p-6 md:p-12 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-10 animate-slide-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Performance <span className="gradient-text">Report</span></h1>
            <p className="text-slate-400 flex items-center gap-2">
              <Calendar size={16} /> Submitted on {new Date().toLocaleDateString()}
            </p>
          </div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="btn-secondary group"
          >
            <Home size={18} /> Return Home <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Main Score Card */}
        <div className="glass overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
            <div 
              className={`h-full ${getProgressColor(result.percentage)} shadow-[0_0_15px_rgba(0,0,0,0.5)]`}
              style={{ width: `${result.percentage}%`, transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          </div>

          <div className="p-10 md:p-14 flex flex-col md:flex-row items-center gap-12">
            {/* Circular Progress */}
            <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="96" cy="96" r="88"
                  fill="none" stroke="currentColor" strokeWidth="12"
                  className="text-slate-800"
                />
                <circle
                  cx="96" cy="96" r="88"
                  fill="none" stroke="currentColor" strokeWidth="12"
                  strokeDasharray="552.92"
                  strokeDashoffset={552.92 - (552.92 * result.percentage) / 100}
                  strokeLinecap="round"
                  className={`${result.percentage >= 70 ? 'text-emerald-500' : result.percentage >= 40 ? 'text-yellow-500' : 'text-rose-500'} transition-all duration-[1.5s] ease-out`}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-5xl font-black text-white leading-none">{result.percentage}%</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Overall Score</span>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-6">
              <div>
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border ${getStatusColor(result.percentage)}`}>
                  {result.percentage >= 70 ? <CheckCircle2 size={14}/> : <XCircle size={14}/>}
                  Status: {getStatusText(result.percentage)}
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">{result.testTitle}</h2>
                <p className="text-slate-400">Student: {result.studentName} ({result.studentId})</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-sm p-4 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Score</p>
                  <p className="text-xl font-black text-white">{result.score}/{result.total}</p>
                </div>
                <div className="glass-sm p-4 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Time</p>
                  <p className="text-xl font-black text-white">{Math.floor(result.durationTaken / 60)}m</p>
                </div>
                <div className="glass-sm p-4 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Attempt</p>
                  <p className="text-xl font-black text-white">Valid</p>
                </div>
                <div className="glass-sm p-4 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Cheating</p>
                  <p className={`text-xl font-black ${result.cheatingDetected ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {result.cheatingDetected ? 'YES' : 'NO'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass p-8 space-y-6">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
              <Target size={24} />
            </div>
            <h3 className="text-xl font-bold">Accuracy</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              You answered {result.score} questions correctly out of {result.total}. 
              Your accuracy rate is {result.percentage}%.
            </p>
          </div>

          <div className="glass p-8 space-y-6">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-xl font-bold">Improvement</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Focus on the topics where you missed marks. Practice makes perfect.
            </p>
          </div>

          <div className="glass p-8 space-y-6">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
              <Award size={24} />
            </div>
            <h3 className="text-xl font-bold">Certificates</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {result.percentage >= 70 
                ? "Excellent performance! You are eligible for the course certificate." 
                : "Keep trying! You need at least 70% to unlock the certificate."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
