'use client';
import { useEffect, useRef } from 'react';

// Loads KaTeX once globally and exposes a renderMath() helper
function loadKaTeX(callback) {
  if (typeof window === 'undefined') return;
  if (window.__katexLoaded) { callback(); return; }
  if (window.__katexLoading) { window.__katexCallbacks = window.__katexCallbacks || []; window.__katexCallbacks.push(callback); return; }

  window.__katexLoading = true;

  const link = document.createElement('link');
  link.rel  = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);

  const katexScript = document.createElement('script');
  katexScript.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
  katexScript.crossOrigin = 'anonymous';
  katexScript.defer = true;

  katexScript.onload = () => {
    const arScript = document.createElement('script');
    arScript.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js';
    arScript.crossOrigin = 'anonymous';
    arScript.defer = true;
    arScript.onload = () => {
      window.__katexLoaded = true;
      window.__katexLoading = false;
      callback();
      (window.__katexCallbacks || []).forEach(cb => cb());
      window.__katexCallbacks = [];
    };
    document.head.appendChild(arScript);
  };
  document.head.appendChild(katexScript);
}

const DELIMITERS = [
  { left: '$$', right: '$$', display: true  },
  { left: '$',  right: '$',  display: false },
  { left: '\\(', right: '\\)', display: false },
  { left: '\\[', right: '\\]', display: true  },
];

function renderEl(el) {
  if (!el || !window.renderMathInElement) return;
  try {
    window.renderMathInElement(el, { delimiters: DELIMITERS, throwOnError: false });
  } catch { /* ignore */ }
}

/**
 * MathText — renders a string that may contain LaTeX math.
 * Usage: <MathText>{"What is $x^2 + y^2$?"}</MathText>
 */
export function MathText({ children, className = '', as: Tag = 'span' }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    const raw = children || '';

    // Quick check: if there's no math delimiter, just set text and skip KaTeX
    if (!raw.includes('$') && !raw.includes('\\(') && !raw.includes('\\[')) {
      ref.current.textContent = raw;
      return;
    }

    // Set raw text first (visible while KaTeX loads)
    ref.current.textContent = raw;

    loadKaTeX(() => {
      if (!ref.current) return;
      ref.current.textContent = raw;
      renderEl(ref.current);
    });
  }, [children]);

  return <Tag ref={ref} className={className} />;
}

/**
 * MathBlock — wraps a section that may contain multiple math elements,
 * useful when rendering a whole question card's content at once.
 */
export function MathBlock({ children, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    loadKaTeX(() => { renderEl(ref.current); });
  });

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export default MathText;