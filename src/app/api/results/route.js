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