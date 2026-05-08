'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileCode, CheckCircle2, AlertCircle, Trash2, Eye, Loader2 } from 'lucide-react';

export default function UploadTestPage() {
  const router = useRouter();
  const [jsonContent, setJsonContent] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonContent(event.target.result);
      validateAndPreview(event.target.result);
    };
    reader.readAsText(file);
  };

  const validateAndPreview = (content) => {
    try {
      const data = JSON.parse(content);
      // Basic check
      if (!data.testId || !data.title || !data.questions) {
        throw new Error('Missing required fields: testId, title, or questions');
      }
      setPreview(data);
      setError('');
    } catch (err) {
      setError('Invalid JSON: ' + err.message);
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!preview) return;
    setUploading(true);

    try {
      const res = await fetch('/api/upload-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preview),
      });

      const data = await res.json();
      if (data.success) {
        alert('Test uploaded successfully!');
        router.push('/admin/tests');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to upload test');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">JSON Import</h1>
        <p className="text-slate-400">Import a complete examination paper using a JSON file.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <div className="glass p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <FileCode className="text-indigo-400" size={20} />
              JSON Data
            </h3>
            
            <div className="mb-6">
              <label className="block w-full border-2 border-dashed border-white/10 hover:border-indigo-500/50 rounded-2xl p-10 transition-all cursor-pointer group bg-slate-900/20 text-center">
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="text-indigo-400" size={28} />
                </div>
                <p className="font-bold text-white mb-1">Click to browse file</p>
                <p className="text-xs text-slate-500">Only .json files are supported</p>
              </label>
            </div>

            <div className="relative">
              <textarea
                value={jsonContent}
                onChange={(e) => {
                  setJsonContent(e.target.value);
                  validateAndPreview(e.target.value);
                }}
                className="textarea-field min-h-[300px] pt-12 font-mono text-[11px] leading-relaxed"
                placeholder='Manual Paste Here... { "testId": "...", "title": "...", ... }'
              />
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
                <AlertCircle size={18} />
                {error}
              </div>
            )}
          </div>

          <div className="glass p-6">
            <h4 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">Expected Format Example</h4>
            <pre className="bg-black/40 p-4 rounded-xl text-[10px] text-indigo-300 font-mono overflow-auto border border-white/5">
{`{
  "testId": "SCI01",
  "title": "Science Basics",
  "duration": 20,
  "questions": [
    {
      "question": "Water formula?",
      "options": ["H2O", "CO2", "O2", "NaCl"],
      "answer": "H2O"
    }
  ]
}`}
            </pre>
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          <div className="glass p-8 lg:sticky lg:top-24">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Eye className="text-emerald-400" size={20} />
                Preview
              </h3>
              {preview && (
                <button 
                  onClick={() => {setPreview(null); setJsonContent('');}}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>

            {!preview ? (
              <div className="py-20 text-center text-slate-500">
                <FileCode size={48} className="mx-auto mb-4 opacity-10" />
                <p>Upload or paste JSON to see preview</p>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle2 className="text-emerald-500" size={20} />
                    <span className="font-bold text-emerald-400">Valid Format Detected</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs">Test ID</p>
                      <p className="font-bold text-white">{preview.testId}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Title</p>
                      <p className="font-bold text-white">{preview.title}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Questions</p>
                      <p className="font-bold text-white">{preview.questions.length}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Duration</p>
                      <p className="font-bold text-white">{preview.duration}m</p>
                    </div>
                  </div>
                </div>

                <div className="max-h-[300px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {preview.questions.map((q, i) => (
                    <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Q{i+1}: {q.question}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className={`text-[10px] p-2 rounded ${opt === q.answer ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-white/5 text-slate-400'}`}>
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={handleUpload}
                  disabled={uploading}
                  className="btn-primary w-full h-14 text-base glow-purple"
                >
                  {uploading ? <Loader2 className="animate-spin" size={24} /> : 'Save and Publish Test'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
