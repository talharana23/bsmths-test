import { NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/storage';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const results = await getData('results');
  if (studentId) return NextResponse.json(results.filter(r => r.studentId === studentId));
  return NextResponse.json(results);
}

export async function POST(request) {
  const result = await request.json();
  const results = await getData('results');
  const finalResult = { ...result, submittedAt: new Date().toISOString() };
  results.push(finalResult);
  await saveData('results', results);
  return NextResponse.json({ success: true, result: finalResult });
}

// Grant re-attempt — deletes the specific submission
export async function DELETE(request) {
  try {
    const { studentId, testId } = await request.json();
    if (!studentId || !testId) {
      return NextResponse.json({ error: 'studentId and testId are required' }, { status: 400 });
    }
    const results = await getData('results');
    // Remove only the most recent matching submission
    const idx = [...results].reverse().findIndex(r => r.studentId === studentId && r.testId === testId);
    if (idx === -1) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }
    const actualIdx = results.length - 1 - idx;
    results.splice(actualIdx, 1);
    await saveData('results', results);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to process re-attempt request' }, { status: 500 });
  }
}