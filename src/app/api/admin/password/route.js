import { NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/storage';

export async function POST(req) {
  try {
    const { currentPassword, newPassword } = await req.json();
    const admin = getData('admin');

    if (currentPassword !== admin.password) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 401 });
    }

    const updatedAdmin = { ...admin, password: newPassword };
    saveData('admin', updatedAdmin);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password Update Error:', error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
