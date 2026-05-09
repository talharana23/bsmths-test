import { NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/storage';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const tests = getData('tests');

  if (id) {
    const test = tests.find(t => t.testId === id);
    return test
      ? NextResponse.json(test)
      : NextResponse.json({ error: 'Test not found' }, { status: 404 });
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

export async function PUT(request) {
  const updatedTest = await request.json();
  const tests = getData('tests');

  const index = tests.findIndex(t => t.testId === updatedTest.testId);
  if (index === -1) {
    return NextResponse.json({ error: 'Test not found' }, { status: 404 });
  }

  tests[index] = updatedTest;
  saveData('tests', tests);
  return NextResponse.json({ success: true, test: updatedTest });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
  }

  const tests = getData('tests');
  const index = tests.findIndex(t => t.testId === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Test not found' }, { status: 404 });
  }

  tests.splice(index, 1);
  saveData('tests', tests);

  return NextResponse.json({ success: true });
}