import { NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/storage';

export async function POST(request) {
  try {
    const testData = await request.json();
    
    // Basic Validation
    if (!testData.testId || !testData.title || !testData.questions || !Array.isArray(testData.questions)) {
      return NextResponse.json({ error: 'Invalid JSON structure. Required fields: testId, title, duration, questions[]' }, { status: 400 });
    }

    // Validate each question
    for (const q of testData.questions) {
      if (!q.question || !q.options || !q.answer || !Array.isArray(q.options) || q.options.length < 2) {
        return NextResponse.json({ error: 'Invalid question format in JSON' }, { status: 400 });
      }
    }

    const tests = getData('tests');
    
    // Check if ID already exists
    const index = tests.findIndex(t => t.testId === testData.testId);
    if (index !== -1) {
       // Update if exists or reject? Let's update for convenience in this simple version
       tests[index] = testData;
    } else {
      tests.push(testData);
    }

    saveData('tests', tests);
    return NextResponse.json({ success: true, test: testData });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process JSON upload' }, { status: 500 });
  }
}
