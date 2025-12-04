import { useMemo } from "react";
import { DatasetRow } from "@/types/dataset";
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
} from "recharts";

interface GenericChartsProps {
  rows: DatasetRow[];
  columns: string[];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
];

export function GenericCharts({ rows, columns }: GenericChartsProps) {
  const { pieData, barData, pieColumn, barColumn } = useMemo(() => {
    // Find best column for pie chart (status, situação, tipo, etc.)
    const pieCol = columns.find((col) => {
      const lower = col.toLowerCase();
      return (
        lower.includes("situação") ||
        lower.includes("situacao") ||
        lower.includes("status") ||
        lower.includes("tipo")
      );
    });

    // Find best column for bar chart (departamento, unidade, campus, etc.)
    const barCol = columns.find((col) => {
      const lower = col.toLowerCase();
      return (
        lower.includes("departamento") ||
        lower.includes("unidade") ||
        lower.includes("campus") ||
        lower.includes("área") ||
        lower.includes("area")
      );
    });

    const pieCounts: Record<string, number> = {};
    const barCounts: Record<string, number> = {};

    rows.forEach((row) => {
      if (pieCol) {
        const val = String(row.row_data[pieCol] || "N/A").slice(0, 30);
        pieCounts[val] = (pieCounts[val] || 0) + 1;
      }
      if (barCol) {
        const val = String(row.row_data[barCol] || "N/A").slice(0, 20);
        barCounts[val] = (barCounts[val] || 0) + 1;
      }
    });

    return {
      pieData: Object.entries(pieCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
      barData: Object.entries(barCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
      pieColumn: pieCol,
      barColumn: barCol,
    };
  }, [rows, columns]);

  if (!pieColumn && !barColumn) {
    return null;
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {pieColumn && pieData.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Por {pieColumn}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name.slice(0, 15)}${name.length > 15 ? "..." : ""} (${(percent * 100).toFixed(0)}%)`
                  }
                  labelLine={false}
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {barColumn && barData.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Top 10 - {barColumn}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ left: 10, right: 10 }}
              >
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
