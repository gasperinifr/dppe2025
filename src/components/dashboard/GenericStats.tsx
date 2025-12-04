import { useMemo } from "react";
import { DatasetRow } from "@/types/dataset";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, ListChecks, Hash, Calendar } from "lucide-react";

interface GenericStatsProps {
  rows: DatasetRow[];
  columns: string[];
}

export function GenericStats({ rows, columns }: GenericStatsProps) {
  const stats = useMemo(() => {
    // Find a "Situação" or "Status" column for status distribution
    const statusColumn = columns.find((col) =>
      col.toLowerCase().includes("situação") ||
      col.toLowerCase().includes("situacao") ||
      col.toLowerCase().includes("status")
    );

    const statusCounts: Record<string, number> = {};
    if (statusColumn) {
      rows.forEach((row) => {
        const status = String(row.row_data[statusColumn] || "N/A");
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
    }

    // Get top statuses
    const topStatuses = Object.entries(statusCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    // Count unique values in first column (usually identifier)
    const uniqueFirst = new Set(rows.map((r) => r.row_data[columns[0]])).size;

    return {
      total: rows.length,
      uniqueFirst,
      statusColumn,
      topStatuses,
      columnsCount: columns.length,
    };
  }, [rows, columns]);

  const cards = [
    {
      title: "Total de Registros",
      value: stats.total,
      icon: BarChart3,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Colunas",
      value: stats.columnsCount,
      icon: Hash,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
    },
    {
      title: `Valores Únicos (${columns[0]?.slice(0, 15) || "ID"})`,
      value: stats.uniqueFirst,
      icon: ListChecks,
      color: "text-chart-3",
      bg: "bg-chart-3/10",
    },
    ...(stats.topStatuses.length > 0
      ? stats.topStatuses.map(([status, count], i) => ({
          title: status.slice(0, 25),
          value: count,
          icon: Calendar,
          color: i === 0 ? "text-chart-4" : i === 1 ? "text-chart-5" : "text-muted-foreground",
          bg: i === 0 ? "bg-chart-4/10" : i === 1 ? "bg-chart-5/10" : "bg-muted",
        }))
      : []),
  ].slice(0, 6);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-bold text-foreground">
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {card.title}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
