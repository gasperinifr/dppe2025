import { Projeto } from "@/types/projeto";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface ChartsByStatusProps {
  projetos: Projeto[];
}

const COLORS = {
  'APROVADO': 'hsl(152, 65%, 45%)',
  'EM EXECUÇÃO': 'hsl(210, 100%, 50%)',
  'CADASTRO EM ANDAMENTO': 'hsl(38, 92%, 50%)',
  'REPROVADO': 'hsl(0, 72%, 51%)',
  'DESATIVADO': 'hsl(220, 10%, 50%)',
};

export function ChartsByStatus({ projetos }: ChartsByStatusProps) {
  const statusCounts = projetos.reduce((acc, projeto) => {
    acc[projeto.situacao] = (acc[projeto.situacao] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }));

  if (data.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
        <h3 className="font-display font-semibold mb-4">Projetos por Situação</h3>
        <p className="text-muted-foreground text-center py-8">
          Nenhum dado disponível
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 shadow-card border border-border/50 animate-fade-in">
      <h3 className="font-display font-semibold mb-4">Projetos por Situação</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            label={({ name, percent }) => 
              `${(percent * 100).toFixed(0)}%`
            }
            labelLine={false}
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={COLORS[entry.name as keyof typeof COLORS] || '#888'}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value) => (
              <span className="text-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
