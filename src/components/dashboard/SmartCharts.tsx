import { useMemo } from "react";
import { DatasetRow } from "@/types/dataset";
import { ColumnAnalysis, ChartSuggestion } from "@/lib/csvAnalyzer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface SmartChartsProps {
  rows: DatasetRow[];
  columns: ColumnAnalysis[];
  chartSuggestions: ChartSuggestion[];
}

const COLORS = [
  "hsl(142, 76%, 36%)", // IFSC Green
  "hsl(142, 76%, 46%)",
  "hsl(142, 60%, 56%)",
  "hsl(200, 80%, 50%)",
  "hsl(45, 90%, 55%)",
  "hsl(340, 70%, 55%)",
  "hsl(270, 60%, 55%)",
  "hsl(30, 80%, 55%)",
];

interface ChartData {
  name: string;
  value: number;
  fullName: string;
}

export function SmartCharts({ rows, columns, chartSuggestions }: SmartChartsProps) {
  const chartsData = useMemo(() => {
    return chartSuggestions.map((suggestion) => {
      const counts: Record<string, number> = {};
      
      rows.forEach((row) => {
        const value = row.row_data[suggestion.column];
        const strValue = value ? String(value).trim() : "N/A";
        if (strValue) {
          counts[strValue] = (counts[strValue] || 0) + 1;
        }
      });
      
      const data: ChartData[] = Object.entries(counts)
        .map(([name, value]) => ({
          name: name.length > 20 ? name.slice(0, 20) + "..." : name,
          fullName: name,
          value,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, suggestion.type === 'pie' ? 8 : 10);
      
      return {
        suggestion,
        data,
      };
    });
  }, [rows, chartSuggestions]);

  if (chartsData.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>Não foi possível gerar gráficos automaticamente para este dataset.</p>
          <p className="text-sm mt-2">Os dados podem não ter colunas categóricas adequadas.</p>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm">{data.fullName}</p>
          <p className="text-primary font-bold">{data.value} registros</p>
          <p className="text-xs text-muted-foreground">
            {((data.value / rows.length) * 100).toFixed(1)}% do total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {chartsData.map(({ suggestion, data }, index) => (
        <Card key={index} className="border-border overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>{suggestion.title}</span>
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{suggestion.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Coluna: {suggestion.column}
                    </p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              {suggestion.type === 'pie' ? (
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.map((_, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={COLORS[idx % COLORS.length]}
                        className="transition-opacity hover:opacity-80"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs text-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              ) : suggestion.type === 'horizontal-bar' ? (
                <BarChart
                  data={data}
                  layout="vertical"
                  margin={{ left: 10, right: 20 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="value"
                    fill="hsl(142, 76%, 36%)"
                    radius={[0, 4, 4, 0]}
                    className="transition-opacity hover:opacity-80"
                  />
                </BarChart>
              ) : (
                <BarChart data={data} margin={{ left: -10, right: 10 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="value"
                    fill="hsl(142, 76%, 36%)"
                    radius={[4, 4, 0, 0]}
                    className="transition-opacity hover:opacity-80"
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
