import { Projeto } from "@/types/projeto";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

interface ChartsByDepartmentProps {
  projetos: Projeto[];
}

export function ChartsByDepartment({ projetos }: ChartsByDepartmentProps) {
  const deptCounts = projetos.reduce((acc, projeto) => {
    const dept = projeto.departamento?.trim() || "Não informado";
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(deptCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  if (data.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
        <h3 className="font-display font-semibold mb-4">Top 10 Departamentos</h3>
        <p className="text-muted-foreground text-center py-8">
          Nenhum dado disponível
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 shadow-card border border-border/50 animate-fade-in">
      <h3 className="font-display font-semibold mb-4">Top 10 Departamentos</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
          <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={80}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [value, 'Projetos']}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`hsl(152, ${65 - index * 4}%, ${35 + index * 3}%)`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
