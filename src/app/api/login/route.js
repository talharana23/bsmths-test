import { NextResponse } from 'next/server';
import { getData } from '@/lib/storage';

export async function POST(request) {
  const { id, password, role } = await request.json();

  if (role === 'admin') {
    const admin = getData('admin');
    if (id === admin.id && password === admin.password) {
      return NextResponse.json({ success: true, user: { id: admin.id, name: admin.name, role: 'admin' } });
    }
  } else {
    const students = getData('students');
    const student = students.find(s => s.id === id && s.password === password);
    
    if (student) {
      // Check if student has access
      if (student.disabled) {
        return NextResponse.json({ error: 'Account disabled' }, { status: 403 });
      }
      return NextResponse.json({ success: true, user: { ...student, role: 'student' } });
    }
  }

  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}
