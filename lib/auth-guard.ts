import { redirect } from 'next/navigation';
import { createServerClient } from './supabase/server';

export type Role = 'employee' | 'manager' | 'admin';

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  manager_id: string | null;
  department: string | null;
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
  return data as AppUser | null;
}

export async function requireRole(roles: Role[]): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!roles.includes(user.role)) {
    if (user.role === 'admin') redirect('/admin/cycles');
    if (user.role === 'manager') redirect('/manager/approvals');
    redirect('/employee/goals');
  }
  return user;
}
