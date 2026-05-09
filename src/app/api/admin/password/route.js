import { NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/storage';

export async function POST(request) {
  const { currentPassword, newPassword } = await request.json();
  const admin = await getData('admin');
  
  if (currentPassword !== admin.password) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
  }
  
  await saveData('admin', { ...admin, password: newPassword });
  return NextResponse.json({ success: true });
}