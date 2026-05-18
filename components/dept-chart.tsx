'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function DeptChart({ data }: { data: { department: string; completion: number }[] }) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground">No data yet.</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="department" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Bar dataKey="completion" fill="#2563EB" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
