import { NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/storage';

export async function GET() {
  const students = getData('students');
  return NextResponse.json(students);
}

export async function POST(request) {
  const student = await request.json();
  const students = getData('students');
  
  if (students.find(s => s.id === student.id)) {
    return NextResponse.json({ error: 'Student ID already exists' }, { status: 400 });
  }

  students.push({ ...student, disabled: false });
  saveData('students', students);
  return NextResponse.json({ success: true, student });
}

export async function PUT(request) {
  const updatedStudent = await request.json();
  const students = getData('students');
  
  const index = students.findIndex(s => s.id === updatedStudent.id);
  if (index !== -1) {
    students[index] = { ...students[index], ...updatedStudent };
    saveData('students', students);
    return NextResponse.json({ success: true });
  }
  
  return NextResponse.json({ error: 'Student not found' }, { status: 404 });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const isBulk = searchParams.get('bulk') === 'true';
  
  if (isBulk) {
    saveData('students', []);
    return NextResponse.json({ success: true, message: 'All students deleted' });
  }

  let students = getData('students');
  students = students.filter(s => s.id !== id);
  saveData('students', students);
  
  return NextResponse.json({ success: true });
}
