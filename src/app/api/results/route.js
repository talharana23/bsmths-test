import { NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/storage';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const results = getData('results');

  if (studentId) {
    const studentResults = results.filter(r => r.studentId === studentId);
    return NextResponse.json(studentResults);
  }

  return NextResponse.json(results);
}

export async function POST(request) {
  const result = await request.json();
  const results = getData('results');
  
  // Add timestamp
  const finalResult = {
    ...result,
    submittedAt: new Date().toISOString()
  };

  results.push(finalResult);
  saveData('results', results);
  return NextResponse.json({ success: true, result: finalResult });
}
