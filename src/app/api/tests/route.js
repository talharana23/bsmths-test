import { NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/storage';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const tests = getData('tests');

  if (id) {
    const test = tests.find(t => t.testId === id);
    return test ? NextResponse.json(test) : NextResponse.json({ error: 'Test not found' }, { status: 404 });
  }

  return NextResponse.json(tests);
}

export async function POST(request) {
  const test = await request.json();
  const tests = getData('tests');
  
  if (tests.find(t => t.testId === test.testId)) {
    return NextResponse.json({ error: 'Test ID already exists' }, { status: 400 });
  }

  tests.push(test);
  saveData('tests', tests);
  return NextResponse.json({ success: true, test });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  let tests = getData('tests');
  tests = tests.filter(t => t.testId !== id);
  saveData('tests', tests);
  
  return NextResponse.json({ success: true });
}
