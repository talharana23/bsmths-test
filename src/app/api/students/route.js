import { NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/storage';

export async function GET() {
  return NextResponse.json(await getData('students'));
}

export async function POST(request) {
  const student = await request.json();
  const students = await getData('students');
  if (students.find(s => s.id === student.id)) {
    return NextResponse.json({ error: 'Student ID already exists' }, { status: 400 });
  }
  students.push({ ...student, disabled: false });
  await saveData('students', students);
  return NextResponse.json({ success: true, student });
}

export async function PUT(request) {
  const updatedStudent = await request.json();
  const students = await getData('students');
  const index = students.findIndex(s => s.id === updatedStudent.id);
  if (index !== -1) {
    students[index] = { ...students[index], ...updatedStudent };
    await saveData('students', students);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Student not found' }, { status: 404 });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const ids = searchParams.get('ids');
  const isBulk = searchParams.get('bulk') === 'true';

  if (isBulk) { await saveData('students', []); return NextResponse.json({ success: true }); }

  let students = await getData('students');
  if (ids) students = students.filter(s => !ids.split(',').includes(s.id));
  else if (id) students = students.filter(s => s.id !== id);
  await saveData('students', students);
  return NextResponse.json({ success: true });
}