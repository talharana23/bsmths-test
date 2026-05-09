import { NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/storage';

export async function POST(request) {
  try {
    const testData = await request.json();

    // ── Top-level field validation ──────────────────────────────────────────
    const missing = [];
    if (!testData.testId)    missing.push('"testId"');
    if (!testData.title)     missing.push('"title"');
    if (!testData.questions) missing.push('"questions"');

    if (missing.length) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}. Also required: "duration" (number), "questions" (array).` },
        { status: 400 }
      );
    }

    if (!Array.isArray(testData.questions) || testData.questions.length === 0) {
      return NextResponse.json(
        { error: '"questions" must be a non-empty array.' },
        { status: 400 }
      );
    }

    if (!testData.duration || isNaN(Number(testData.duration))) {
      return NextResponse.json(
        { error: '"duration" is required and must be a number (minutes).' },
        { status: 400 }
      );
    }

    // ── Per-question validation ─────────────────────────────────────────────
    for (let i = 0; i < testData.questions.length; i++) {
      const q = testData.questions[i];
      const qLabel = `Question ${i + 1}`;

      if (!q.question || typeof q.question !== 'string' || !q.question.trim()) {
        return NextResponse.json(
          { error: `${qLabel}: "question" field is missing or empty.` },
          { status: 400 }
        );
      }

      if (!Array.isArray(q.options) || q.options.length < 2) {
        return NextResponse.json(
          { error: `${qLabel}: "options" must be an array with at least 2 items.` },
          { status: 400 }
        );
      }

      // answer must be present (not undefined/null) and must match one of the options
      if (q.answer === undefined || q.answer === null || String(q.answer).trim() === '') {
        return NextResponse.json(
          { error: `${qLabel}: "answer" is missing. It must be the exact text of the correct option.` },
          { status: 400 }
        );
      }

      const answerStr = String(q.answer).trim();
      const optionStrings = q.options.map(o => String(o).trim());

      if (!optionStrings.includes(answerStr)) {
        return NextResponse.json(
          { error: `${qLabel}: "answer" value "${answerStr}" does not match any option. The answer must be the exact text of one of the options (not an index number).` },
          { status: 400 }
        );
      }

      // Normalise: ensure answer and options are stored as strings
      testData.questions[i] = {
        ...q,
        question: q.question.trim(),
        options: q.options.map(o => String(o).trim()),
        answer:  answerStr,
      };
    }

    // Normalise top-level
    testData.duration = Number(testData.duration);
    testData.testId   = String(testData.testId).trim();
    testData.title    = String(testData.title).trim();

 // Replace the final lines:
  const tests = await getData('tests');
  const index = tests.findIndex(t => t.testId === testData.testId);
  if (index !== -1) tests[index] = testData;
  else tests.push(testData);
  await saveData('tests', tests);
  return NextResponse.json({ success: true, test: testData });

  } catch (error) {
    console.error('Upload Test Error:', error);
    return NextResponse.json(
      { error: 'Failed to process JSON. Make sure the file contains valid JSON.' },
      { status: 500 }
    );
  }
}