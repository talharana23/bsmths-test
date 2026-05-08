import { NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/storage';

export async function POST(req) {
  try {
    const studentsList = await req.json();
    
    if (!Array.isArray(studentsList)) {
      return NextResponse.json({ error: 'Data must be an array of students' }, { status: 400 });
    }

    const currentStudents = getData('students');
    
    // Map the incoming data based on the provided format (data.json)
    const newStudents = studentsList.map(s => ({
      id: s.cnic?.toString() || s.id?.toString(),
      name: s.name || `Student ${s.cnic || s.id}`,
      password: s.roll_no?.toString() || s['Roll No']?.toString() || s.password?.toString() || '123456',
      disabled: false
    })).filter(s => s.id); // Ensure ID (CNIC) exists

    const mergedStudents = [...currentStudents];
    newStudents.forEach(newS => {
      const index = mergedStudents.findIndex(s => s.id === newS.id);
      if (index !== -1) {
        // Update existing student with new data but keep status if not specified
        mergedStudents[index] = { ...mergedStudents[index], ...newS };
      } else {
        mergedStudents.push(newS);
      }
    });

    saveData('students', mergedStudents);
    
    return NextResponse.json({ success: true, count: newStudents.length });
  } catch (error) {
    console.error('Bulk Upload Error:', error);
    return NextResponse.json({ error: 'Failed to process bulk upload' }, { status: 500 });
  }
}
