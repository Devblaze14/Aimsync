import { requireRole } from '@/lib/auth-guard';
import { createServiceClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default async function UsersPage() {
  await requireRole(['admin']);
  const supabase = createServiceClient();
  const { data: users } = await supabase.from('users').select('*').order('role').order('full_name');
  const map = new Map<string, string>((users ?? []).map((u: any) => [u.id, u.full_name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground text-sm">{users?.length ?? 0} users in this workspace.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Directory</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Manager</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users ?? []).map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'admin' ? 'default' : u.role === 'manager' ? 'accent' : 'success'}>{u.role}</Badge>
                  </TableCell>
                  <TableCell>{u.department ?? '—'}</TableCell>
                  <TableCell>{u.manager_id ? map.get(u.manager_id) ?? '—' : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
