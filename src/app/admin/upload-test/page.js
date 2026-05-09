'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileCode, CheckCircle2, AlertCircle, Trash2, Eye, Loader2, FileUp } from 'lucide-react';

// ── KaTeX math renderer hook ─────────────────────────────────────────────────
// Renders inline $...$ and block $$...$$ LaTeX in a DOM node
// ── KaTeX math renderer hook ─────────────────────────────────────────────────
// Renders inline $...$ and block $$...$$ LaTeX in a DOM node
function useMathRenderer() {
  useEffect(() => {
    if (typeof window === 'undefined') return; // ✅ Fixed: Check for server-side
    
    if (window.__katexLoaded) { 
      renderMath(); 
      return; 
    }

    const loadKaTeX = async () => {
      try {
        // Load CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
        document.head.appendChild(link);

        // Load KaTeX core
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
        document.head.appendChild(script);

        await new Promise((resolve) => {
          script.onload = resolve;
        });

        // Load auto-render extension
        const autoRender = document.createElement('script');
        autoRender.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js';
        document.head.appendChild(autoRender);

        await new Promise((resolve) => {
          autoRender.onload = () => { 
            window.__katexLoaded = true; 
            renderMath();
            resolve(); 
          };
        });
      } catch (error) {
        console.warn('KaTeX failed to load:', error);
      }
    };

    loadKaTeX();
  }, []);
}

function renderMath() {
  if (!window.renderMathInElement) return;
  document.querySelectorAll('.math-render').forEach(el => {
    try {
      window.renderMathInElement(el, {
        delimiters: [
          { left: '$$', right: '$$', display: true  },
          { left: '$',  right: '$',  display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true  },
        ],
        throwOnError: false,
      });
    } catch { /* ignore individual render errors */ }
  });
}

// Renders text that may contain LaTeX
function MathText({ children, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && window.__katexLoaded && window.renderMathInElement) {
      ref.current.innerHTML = children || '';
      try {
        window.renderMathInElement(ref.current, {
          delimiters: [
            { left: '$$', right: '$$', display: true  },
            { left: '$',  right: '$',  display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true  },
          ],
          throwOnError: false,
        });
      } catch { /* ignore */ }
    } else if (ref.current) {
      ref.current.textContent = children || '';
    }
  }, [children]);
  return <span ref={ref} className={className} />;
}

// ── Validate JSON client-side with detailed errors ───────────────────────────
function validateTestJson(data) {
  if (typeof data !== 'object' || Array.isArray(data) || data === null) {
    return 'JSON must be an object (starts with {).';
  }
  if (!data.testId)    return 'Missing field: "testId" (e.g. "MATH001")';
  if (!data.title)     return 'Missing field: "title" (e.g. "Math Final Exam")';
  if (!data.duration)  return 'Missing field: "duration" (number of minutes, e.g. 30)';
  if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
    return 'Missing or empty "questions" array.';
  }
  for (let i = 0; i < data.questions.length; i++) {
    const q = data.questions[i];
    const label = `Question ${i + 1}`;
    if (!q.question?.trim()) return `${label}: "question" text is missing.`;
    if (!Array.isArray(q.options) || q.options.length < 2) {
      return `${label}: "options" must be an array with at least 2 items.`;
    }
    if (q.answer === undefined || q.answer === null || String(q.answer).trim() === '') {
      return `${label}: "answer" is missing. Use the exact text of the correct option (not an index number).`;
    }
    const opts = q.options.map(o => String(o).trim());
    if (!opts.includes(String(q.answer).trim())) {
      return `${label}: "answer" value "${q.answer}" must exactly match one of the options.\n\nOptions are: ${opts.join(', ')}\n\nNote: Use the option text, not an index number.`;
    }
  }
  return null; // valid
}

export default function UploadTestPage() {
  const router = useRouter();
  const [jsonContent, setJsonContent] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);
  const parseTimerRef = useRef(null);

  useMathRenderer();

  // Debounced parse — only validate after user stops typing for 600ms
  const handleJsonChange = (value) => {
    setJsonContent(value);
    setError('');
    setPreview(null);

    clearTimeout(parseTimerRef.current);
    if (!value.trim()) return;

    parseTimerRef.current = setTimeout(() => {
      try {
        const data = JSON.parse(value);
        const err  = validateTestJson(data);
        if (err) { setError(err); setPreview(null); }
        else      { setPreview(data); setError(''); }
      } catch (e) {
        setError('Invalid JSON syntax: ' + e.message);
        setPreview(null);
      }
    }, 600);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      setError('Only .json files are supported.');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setJsonContent(text);
      // Parse immediately for file uploads (user didn't type it, it's complete)
      try {
        const data = JSON.parse(text);
        const err  = validateTestJson(data);
        if (err) { setError(err); setPreview(null); }
        else      { setPreview(data); setError(''); }
      } catch (e) {
        setError('Invalid JSON syntax in file: ' + e.message);
        setPreview(null);
      }
    };
    reader.readAsText(file);
    // Reset so same file can be re-uploaded
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (!preview) return;
    setUploading(true);
    setError('');
    try {
      const res  = await fetch('/api/upload-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preview),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/admin/tests');
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch {
      setError('Network error — could not reach the server.');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setJsonContent('');
    setError('');
    setFileName('');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">JSON Import</h1>
        <p className="text-slate-400">Import a complete examination paper from a JSON file. Math formulas (LaTeX) are fully supported.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Left: Input ── */}
        <div className="space-y-6">
          <div className="glass p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <FileCode className="text-indigo-400" size={20} />
              JSON Input
            </h3>

            {/* File drop zone */}
            <div className="mb-6">
              <label className="block w-full border-2 border-dashed border-white/10 hover:border-indigo-500/50 rounded-2xl p-8 transition-all cursor-pointer group bg-slate-900/20 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-14 h-14 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <FileUp className="text-indigo-400" size={26} />
                </div>
                {fileName ? (
                  <p className="font-bold text-indigo-400 text-sm">{fileName}</p>
                ) : (
                  <>
                    <p className="font-bold text-white mb-1">Click to browse or drag & drop</p>
                    <p className="text-xs text-slate-500">Only .json files are accepted</p>
                  </>
                )}
              </label>
            </div>

            <div className="flex items-center gap-3 my-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">or paste JSON</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Textarea — fixed pt-12 → p-4 */}
            <textarea
              value={jsonContent}
              onChange={(e) => handleJsonChange(e.target.value)}
              className="textarea-field min-h-[280px] p-4 font-mono text-[11px] leading-relaxed"
              placeholder='Paste JSON here...'
              spellCheck={false}
            />

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-3 animate-fade-in">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <pre className="whitespace-pre-wrap font-sans">{error}</pre>
              </div>
            )}
          </div>

          {/* Format reference */}
          <div className="glass p-6">
            <h4 className="text-sm font-bold text-slate-400 mb-1 uppercase tracking-widest">Required JSON Format</h4>
            <p className="text-xs text-slate-500 mb-4">
              <span className="text-indigo-400 font-semibold">answer</span> must be the exact <span className="text-white">text</span> of the correct option — not an index number.
              Math formulas use <span className="text-indigo-400">$...$</span> (inline) or <span className="text-indigo-400">$$...$$</span> (block).
            </p>
            <pre className="bg-black/40 p-4 rounded-xl text-[10px] text-indigo-300 font-mono overflow-auto border border-white/5 leading-relaxed">
{`{
  "testId": "CALC01",
  "title": "Calculus Basics",
  "duration": 30,
  "questions": [
    {
      "question": "What is $\\\\frac{d}{dx}(x^2)$?",
      "options": ["$x$", "$2x$", "$x^2$", "$2$"],
      "answer": "$2x$"
    },
    {
      "question": "Solve: $\\\\int_0^1 x\\\\,dx$",
      "options": ["0", "1", "0.5", "2"],
      "answer": "0.5"
    }
  ]
}`}
            </pre>
          </div>
        </div>

        {/* ── Right: Preview ── */}
        <div className="space-y-6">
          <div className="glass p-8 lg:sticky lg:top-24">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Eye className="text-emerald-400" size={20} />
                Preview
              </h3>
              {preview && (
                <button onClick={handleClear} className="text-slate-500 hover:text-red-400 transition-colors" title="Clear">
                  <Trash2 size={20} />
                </button>
              )}
            </div>

            {!preview ? (
              <div className="py-20 text-center text-slate-500">
                <FileCode size={48} className="mx-auto mb-4 opacity-10" />
                <p>Upload or paste valid JSON to see a preview</p>
                {jsonContent && !error && (
                  <div className="mt-4 flex justify-center">
                    <Loader2 className="animate-spin text-indigo-400" size={20} />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in math-render">
                {/* Summary card */}
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                    <span className="font-bold text-emerald-400">Valid — Ready to Upload</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-slate-500 text-xs">Test ID</p><p className="font-bold text-white">{preview.testId}</p></div>
                    <div><p className="text-slate-500 text-xs">Title</p><p className="font-bold text-white">{preview.title}</p></div>
                    <div><p className="text-slate-500 text-xs">Questions</p><p className="font-bold text-white">{preview.questions.length}</p></div>
                    <div><p className="text-slate-500 text-xs">Duration</p><p className="font-bold text-white">{preview.duration} min</p></div>
                  </div>
                </div>

                {/* Question previews with math rendering */}
                <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {preview.questions.map((q, i) => (
                    <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Q{i + 1}</p>
                      <p className="text-sm text-white mb-3 math-render">
                        <MathText>{q.question}</MathText>
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, oi) => (
                          <div
                            key={oi}
                            className={`text-[11px] p-2 rounded-lg math-render ${
                              String(opt).trim() === String(q.answer).trim()
                                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                                : 'bg-white/5 text-slate-400'
                            }`}
                          >
                            <span className="font-bold mr-1 opacity-60">{String.fromCharCode(65 + oi)}.</span>
                            <MathText>{String(opt)}</MathText>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-emerald-400 mt-2 font-bold">
                        ✓ Answer: <MathText>{String(q.answer)}</MathText>
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="btn-primary w-full h-14 text-base glow-purple"
                >
                  {uploading
                    ? <><Loader2 className="animate-spin" size={20} /> Uploading...</>
                    : <><Upload size={20} /> Save & Publish Test</>
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}