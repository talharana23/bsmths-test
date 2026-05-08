'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Upload
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    students: 0,
    tests: 0,
    attempts: 0,
    alerts: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, testsRes, resultsRes] = await Promise.all([
          fetch('/api/students'),
          fetch('/api/tests'),
          fetch('/api/results')
        ]);
        
        const students = await studentsRes.json();
        const tests = await testsRes.json();
        const results = await resultsRes.json();
        
        const cheatingAlerts = results.filter(r => r.cheatingDetected).length;

        setStats({
          students: students.length,
          tests: tests.length,
          attempts: results.length,
          alerts: cheatingAlerts
        });
      } catch (err) {
        console.error('Failed to fetch stats');
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Students', value: stats.students, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Active Tests', value: stats.tests, icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Total Attempts', value: stats.attempts, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Cheating Alerts', value: stats.alerts, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Platform Overview</h1>
        <p className="text-slate-400">Monitor system performance and student activity in real-time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="stat-card group relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon size={24} />
              </div>
              <TrendingUp size={16} className="text-slate-500" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-white tracking-tight">{stat.value}</h3>
            </div>
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="glass p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <Clock className="text-indigo-400" size={20} />
              Recent Activity
            </h3>
            <button className="text-indigo-400 text-sm font-semibold hover:underline">View All</button>
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-white/5">
                  <User size={18} className="text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-200">
                    <span className="font-bold text-white">Student Ali</span> submitted <span className="font-bold text-indigo-400">Math Final Test</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">2 minutes ago • Score: 85%</p>
                </div>
                <div className="badge badge-green">Passed</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass p-8">
          <h3 className="text-xl font-bold mb-8">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => router.push('/admin/students')}
              className="p-6 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 transition-all text-left group"
            >
              <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                <Users className="text-white" size={24} />
              </div>
              <p className="font-bold text-white">Manage Students</p>
              <p className="text-xs text-slate-400 mt-1">Add or remove test takers</p>
            </button>
            
            <div className="relative">
              <input 
                type="file" 
                id="json-upload" 
                className="hidden" 
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  
                  const reader = new FileReader();
                  reader.onload = async (event) => {
                    try {
                      const json = JSON.parse(event.target.result);
                      const res = await fetch('/api/upload-test', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(json)
                      });
                      const data = await res.json();
                      if (data.success) {
                        alert('Test uploaded successfully!');
                        window.location.reload();
                      } else {
                        alert(`Upload failed: ${data.error}`);
                      }
                    } catch (err) {
                      alert('Invalid JSON file');
                    }
                  };
                  reader.readAsText(file);
                }}
              />
              <button 
                onClick={() => document.getElementById('json-upload').click()}
                className="w-full p-6 rounded-2xl bg-purple-600/10 border border-purple-500/20 hover:bg-purple-600/20 transition-all text-left group"
              >
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                  <Upload className="text-white" size={24} />
                </div>
                <p className="font-bold text-white">Upload Test</p>
                <p className="text-xs text-slate-400 mt-1">Import from JSON file</p>
              </button>
            </div>

            <button 
              onClick={() => router.push('/admin/tests')}
              className="p-6 rounded-2xl bg-pink-600/10 border border-pink-500/20 hover:bg-pink-600/20 transition-all text-left group"
            >
              <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-pink-500/20 group-hover:scale-110 transition-transform">
                <BookOpen className="text-white" size={24} />
              </div>
              <p className="font-bold text-white">Create Test</p>
              <p className="text-xs text-slate-400 mt-1">Manual MCQ creation</p>
            </button>

            <button 
              onClick={() => router.push('/admin/results')}
              className="p-6 rounded-2xl bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 transition-all text-left group"
            >
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <TrendingUp className="text-white" size={24} />
              </div>
              <p className="font-bold text-white">View Results</p>
              <p className="text-xs text-slate-400 mt-1">Analytics and scores</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const User = ({ size, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
