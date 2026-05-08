'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  GraduationCap, 
  BookOpen, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  LogOut,
  Bell,
  Search,
  Star,
  Award,
  Loader2
} from 'lucide-react';

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    const fetchData = async () => {
      try {
        const [testsRes, resultsRes] = await Promise.all([
          fetch('/api/tests'),
          fetch(`/api/results?studentId=${parsedUser.id}`)
        ]);
        
        const testsData = await testsRes.json();
        const resultsData = await resultsRes.json();
        
        setTests(testsData);
        setResults(resultsData);
      } catch (err) {
        console.error('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const startTest = (id) => {
    router.push(`/test/${id}`);
  };

  if (!user || loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500" size={48} />
    </div>
  );

  const completedTestIds = results.map(r => r.testId);
  const availableTests = tests.filter(t => !completedTestIds.includes(t.testId));

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#16213e]/30 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="text-white" size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight">Exam<span className="text-indigo-400">Pro</span> Portal</span>
        </div>

        <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-2 w-80">
          <Search size={18} className="text-slate-400 mr-2" />
          <input type="text" placeholder="Find tests..." className="bg-transparent border-none outline-none text-sm w-full" />
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white">{user.name}</p>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{user.id}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2.5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl transition-all border border-transparent hover:border-red-500/20"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-12 animate-fade-in">
        {/* Welcome Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 p-10">
          <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[150%] bg-indigo-500/10 blur-[100px] rounded-full" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h2 className="text-4xl font-black text-white mb-3">Welcome back, {user.name.split(' ')[0]}! 👋</h2>
              <p className="text-slate-300 max-w-lg leading-relaxed">
                You have <span className="text-white font-bold">{availableTests.length} pending exams</span> to complete. Good luck with your studies!
              </p>
            </div>
            <div className="flex gap-4">
              <div className="glass-sm px-6 py-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Award size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Completed</p>
                  <p className="text-2xl font-bold text-white">{results.length}</p>
                </div>
              </div>
              <div className="glass-sm px-6 py-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Star size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Avg Score</p>
                  <p className="text-2xl font-bold text-white">
                    {results.length > 0 ? (results.reduce((acc, r) => acc + r.score, 0) / results.length).toFixed(1) : '0'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tests Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Available Tests */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <BookOpen className="text-indigo-400" size={24} />
                Available Exams
              </h3>
              <span className="badge badge-blue">{availableTests.length} Total</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableTests.length === 0 ? (
                <div className="col-span-full py-16 glass text-center text-slate-500 border-dashed">
                  <p>Great job! You've completed all available tests.</p>
                </div>
              ) : (
                availableTests.map((test) => (
                  <div key={test.testId} className="glass p-6 group hover:border-indigo-500/40 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="badge badge-blue">{test.testId}</div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock size={14} /> {test.duration}m
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">{test.title}</h4>
                    <p className="text-sm text-slate-400 mb-6">{test.questions.length} Multiple Choice Questions</p>
                    <button 
                      onClick={() => startTest(test.testId)}
                      className="btn-primary w-full py-3 group-hover:glow-purple"
                    >
                      Start Exam <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent History */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <CheckCircle2 className="text-emerald-400" size={24} />
              Recent Scores
            </h3>
            <div className="space-y-4">
              {results.length === 0 ? (
                <div className="py-10 text-center text-slate-600 italic text-sm">
                  No tests submitted yet
                </div>
              ) : (
                results.slice().reverse().map((result, i) => (
                  <div key={i} className="glass-sm p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div>
                      <p className="font-bold text-white text-sm">{result.testTitle}</p>
                      <p className="text-xs text-slate-500">{new Date(result.submittedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-black text-xl ${result.percentage >= 70 ? 'text-emerald-400' : result.percentage >= 40 ? 'text-yellow-400' : 'text-rose-400'}`}>
                        {result.score}/{result.total}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{result.percentage}%</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 rounded-2xl bg-indigo-600/5 border border-indigo-500/10">
              <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">Exam Policy</h5>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-xs text-slate-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 shrink-0" />
                  Full-screen mode is mandatory for all exams.
                </li>
                <li className="flex items-start gap-2 text-xs text-slate-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 shrink-0" />
                  Tab switching will trigger automatic submission.
                </li>
                <li className="flex items-start gap-2 text-xs text-slate-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 shrink-0" />
                  Ensure stable internet before starting.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
