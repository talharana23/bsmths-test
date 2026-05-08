'use client';
import { useState } from 'react';
import { Shield, Lock, CheckCircle2, AlertCircle, Loader2, Save } from 'lucide-react';

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'success', message: 'Password updated successfully! Next time you login, use your new password.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setStatus({ type: 'error', message: data.error || 'Failed to update password' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">System Settings</h1>
        <p className="text-slate-400">Manage your administrative credentials and security preferences.</p>
      </div>

      <div className="glass overflow-hidden animate-slide-up">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 w-full" />
        <div className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Admin Authentication</h3>
              <p className="text-xs text-slate-500">Update your primary login password.</p>
            </div>
          </div>

          {status.message && (
            <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 animate-fade-in border ${
              status.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="text-sm font-medium">{status.message}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">
                Current Admin Password
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field pl-12 h-12"
                  placeholder="Enter current password"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">
                  New Password
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password" 
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field pl-12 h-12"
                    placeholder="New password"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">
                  Confirm New Password
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password" 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field pl-12 h-12"
                    placeholder="Confirm password"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary w-full h-12 gap-2 shadow-lg shadow-indigo-500/20"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {loading ? 'Updating Credentials...' : 'Save New Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="glass p-8 border-l-4 border-amber-500/50">
        <div className="flex gap-4">
           <AlertCircle className="text-amber-500 shrink-0" size={24} />
           <div>
              <h4 className="font-bold text-white mb-1">Security Recommendation</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Changing your admin password regularly helps maintain system security. Avoid using easily guessable passwords like "admin123" or "password".
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
