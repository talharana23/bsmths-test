'use client';
import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Search, GraduationCap, X, Loader2, FileCode, Upload, Edit3, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [newStudent, setNewStudent] = useState({ id: '', name: '', password: '' });
  const [bulkJson, setBulkJson] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const res = await fetch('/api/students');
    const data = await res.json();
    setStudents(data);
    setLoading(false);
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStudent),
    });
    
    if (res.ok) {
      setNewStudent({ id: '', name: '', password: '' });
      setShowAddModal(false);
      fetchStudents();
    } else {
      const data = await res.json();
      alert(data.error);
    }
    setSaving(false);
  };

  const handleEditStudent = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/students', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingStudent),
    });
    
    if (res.ok) {
      setShowEditModal(false);
      fetchStudents();
    } else {
      const data = await res.json();
      alert(data.error);
    }
    setSaving(false);
  };

  const handleBulkUpload = async () => {
    if (!bulkJson.trim()) return;
    setSaving(true);
    try {
      const data = JSON.parse(bulkJson);
      const res = await fetch('/api/bulk-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (res.ok) {
        setBulkJson('');
        setShowBulkModal(false);
        fetchStudents();
      } else {
        const error = await res.json();
        alert(error.error);
      }
    } catch (e) {
      alert('Invalid JSON format');
    }
    setSaving(false);
  };

  const handleBulkDelete = async () => {
    if (!confirm('⚠️ WARNING: This will permanently delete ALL students in the system. Are you absolutely sure?')) return;
    if (!confirm('Final Confirmation: You are about to clear the entire student database.')) return;
    
    setSaving(true);
    // We'll use the existing DELETE api but without an ID to signal "Delete All"
    // Or create a specific bulk-delete api. Let's just loop or send a special param.
    try {
      const res = await fetch('/api/students?bulk=true', { method: 'DELETE' });
      if (res.ok) {
        fetchStudents();
      }
    } catch (e) {
      alert('Failed to delete students');
    }
    setSaving(false);
  };

  const handleToggleAccess = async (student) => {
    const updated = { ...student, disabled: !student.disabled };
    const res = await fetch('/api/students', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (res.ok) fetchStudents();
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    await fetch(`/api/students?id=${id}`, { method: 'DELETE' });
    fetchStudents();
  };

  const filteredStudents = students.filter(s => 
    (s.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
    (s.id?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Student Management</h1>
          <p className="text-slate-400">View and manage all registered students in the system.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleBulkDelete}
            className="btn-secondary border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
          >
            <Trash2 size={18} /> Bulk Delete
          </button>
          <button 
            onClick={() => setShowBulkModal(true)}
            className="btn-secondary"
          >
            <Upload size={18} /> Bulk Upload
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            <UserPlus size={18} /> Add Student
          </button>
        </div>
      </div>

      <div className="glass overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 w-full max-w-md shadow-inner">
            <Search size={18} className="text-slate-400 mr-2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name or CNIC..." 
              className="bg-transparent border-none outline-none text-sm w-full text-slate-200 placeholder:text-slate-500"
            />
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-lg border border-white/5">
            Total Students: <span className="text-indigo-400">{filteredStudents.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p>Loading database...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500">
              <GraduationCap size={48} className="mb-4 opacity-10" />
              <p>No students found.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>CNIC (ID)</th>
                  <th>Roll No (Password)</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className={student.disabled ? 'opacity-40 grayscale-[0.5]' : ''}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${student.disabled ? 'bg-slate-500/10 text-slate-500' : 'bg-indigo-500/10 text-indigo-400'} flex items-center justify-center font-bold text-xs border ${student.disabled ? 'border-slate-500/20' : 'border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]'}`}>
                          {student.name?.charAt(0) || 'S'}
                        </div>
                        <span className="font-semibold text-white truncate max-w-[200px]">{student.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-indigo-400 bg-indigo-500/5 px-2 py-1 rounded border border-indigo-500/10 text-xs">
                        {student.id}
                      </span>
                    </td>
                    <td>
                      <span className="text-slate-400 font-mono text-xs">{student.password}</span>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleToggleAccess(student)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${student.disabled ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}
                      >
                        {student.disabled ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                        {student.disabled ? 'Blocked' : 'Active'}
                      </button>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => { setEditingStudent(student); setShowEditModal(true); }}
                          className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                          title="Edit Student"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete Student"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex sm:items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
          <div className="glass w-full max-w-lg relative z-10 animate-slide-up my-auto shadow-2xl shadow-black/50">
            <div className="h-1.5 bg-indigo-500 w-full" />
            <div className="p-6 md:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold">Add Student</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddStudent} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2 ml-1">Full Name</label>
                  <input type="text" required value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})} className="input-field" placeholder="e.g. Ali Khan" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2 ml-1">CNIC (ID)</label>
                    <input type="text" required value={newStudent.id} onChange={(e) => setNewStudent({...newStudent, id: e.target.value})} className="input-field" placeholder="e.g. 42101-..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2 ml-1">Roll No (Password)</label>
                    <input type="text" required value={newStudent.password} onChange={(e) => setNewStudent({...newStudent, password: e.target.value})} className="input-field" placeholder="e.g. 2024-001" />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" disabled={saving} className="btn-primary w-full h-12">
                    {saving ? <Loader2 className="animate-spin" size={20} /> : 'Save Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 z-[100] flex sm:items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowEditModal(false)} />
          <div className="glass w-full max-w-lg relative z-10 animate-slide-up my-auto shadow-2xl shadow-black/50">
            <div className="h-1.5 bg-amber-500 w-full" />
            <div className="p-6 md:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-amber-400">Edit Credentials</h3>
                  <p className="text-xs text-slate-500 mt-1">Updating student access data.</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleEditStudent} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">Full Name</label>
                  <input type="text" required value={editingStudent.name} onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})} className="input-field" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">CNIC (ID)</label>
                    <input type="text" disabled value={editingStudent.id} className="input-field opacity-40 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Roll No (Password)</label>
                    <input type="text" required value={editingStudent.password} onChange={(e) => setEditingStudent({...editingStudent, password: e.target.value})} className="input-field" />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" disabled={saving} className="btn-primary bg-amber-600 border-none w-full h-12">
                    {saving ? <Loader2 className="animate-spin" size={20} /> : 'Update Student Details'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-[100] flex sm:items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowBulkModal(false)} />
          <div className="glass w-full max-w-2xl relative z-10 animate-slide-up my-auto shadow-2xl shadow-black/50">
            <div className="h-1.5 bg-indigo-500 w-full" />
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                    <FileCode size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Bulk Import Students</h3>
                    <p className="text-xs text-slate-500">Import large datasets from JSON format.</p>
                  </div>
                </div>
                <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-5">
                     <AlertTriangle size={80} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Required Format (Matching data.json):</p>
                  <pre className="text-[11px] font-mono text-slate-400 leading-relaxed overflow-x-auto bg-black/20 p-3 rounded-lg border border-white/5">
                    {`[
  { 
    "name": "Muhammad Talha Rana",
    "roll_no": "BSMTH-2026-001",
    "cnic": "4250170961185"
  },
  ...
]`}
                  </pre>
                </div>

                <textarea 
                  value={bulkJson}
                  onChange={(e) => setBulkJson(e.target.value)}
                  className="textarea-field h-64 font-mono text-[11px] leading-relaxed"
                  placeholder="Paste your student list JSON here..."
                />

                <div className="flex gap-4 pt-4">
                  <button onClick={handleBulkUpload} disabled={saving || !bulkJson.trim()} className="btn-primary w-full h-12">
                    {saving ? <Loader2 className="animate-spin" size={20} /> : 'Sync Database with JSON'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
