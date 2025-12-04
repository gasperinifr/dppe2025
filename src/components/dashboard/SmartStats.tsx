import { useMemo } from "react";
import { DatasetRow } from "@/types/dataset";
import { ColumnAnalysis } from "@/lib/csvAnalyzer";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Database,
  FileSpreadsheet,
  Hash,
  Calendar,
  Tag,
  TrendingUp,
  Info,
} from "lucide-react";

interface SmartStatsProps {
  rows: DatasetRow[];
  columns: ColumnAnalysis[];
  datasetName: string;
}

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  highlight?: boolean;
}

export function SmartStats({ rows, columns, datasetName }: SmartStatsProps) {
  const stats = useMemo(() => {
    const cards: StatCard[] = [];

    // Total records
    cards.push({
      label: "Total de Registros",
      value: rows.length.toLocaleString("pt-BR"),
      icon: <Database className="w-5 h-5" />,
      description: "Número total de linhas no dataset",
    });

    // Total columns
    cards.push({
      label: "Campos",
      value: columns.length,
      icon: <FileSpreadsheet className="w-5 h-5" />,
      description: `Colunas: ${columns.map(c => c.displayName).slice(0, 5).join(", ")}${columns.length > 5 ? "..." : ""}`,
    });

    // Find most interesting categorical column
    const categoryColumn = columns.find(c => c.isCategorical && c.uniqueValues > 1 && c.uniqueValues <= 20);
    if (categoryColumn) {
      const counts: Record<string, number> = {};
      rows.forEach(row => {
        const val = String(row.row_data[categoryColumn.name] || "");
        if (val) counts[val] = (counts[val] || 0) + 1;
      });
      
      const mostCommon = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])[0];
      
      if (mostCommon) {
        cards.push({
          label: `Principal ${categoryColumn.displayName}`,
          value: mostCommon[0].length > 20 ? mostCommon[0].slice(0, 20) + "..." : mostCommon[0],
          icon: <Tag className="w-5 h-5" />,
          description: `${mostCommon[1]} registros (${((mostCommon[1] / rows.length) * 100).toFixed(1)}%)`,
          highlight: true,
        });
      }
    }

    // Find date range if there's a date column
    const dateColumn = columns.find(c => c.isDate);
    if (dateColumn) {
      const dates = rows
        .map(r => r.row_data[dateColumn.name])
        .filter(d => d)
        .map(d => String(d))
        .sort();
      
      if (dates.length > 0) {
        cards.push({
          label: "Período",
          value: dates.length > 1 ? `${dates[0]} - ${dates[dates.length - 1]}` : dates[0],
          icon: <Calendar className="w-5 h-5" />,
          description: `Baseado na coluna: ${dateColumn.displayName}`,
        });
      }
    }

    // Find numeric column for stats
    const numericColumn = columns.find(c => c.isNumeric && c.uniqueValues > 1);
    if (numericColumn) {
      const numbers = rows
        .map(r => {
          const val = r.row_data[numericColumn.name];
          return typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
        })
        .filter(n => !isNaN(n));
      
      if (numbers.length > 0) {
        const sum = numbers.reduce((a, b) => a + b, 0);
        const avg = sum / numbers.length;
        
        cards.push({
          label: `Média de ${numericColumn.displayName}`,
          value: avg.toLocaleString("pt-BR", { maximumFractionDigits: 2 }),
          icon: <TrendingUp className="w-5 h-5" />,
          description: `Total: ${sum.toLocaleString("pt-BR")} • ${numbers.length} valores`,
        });
      }
    }

    // Unique values count for an important column
    const uniqueColumn = columns.find(c => 
      !c.isIdentifier && 
      c.uniqueValues > 5 && 
      c.uniqueValues < rows.length * 0.8
    );
    if (uniqueColumn && cards.length < 5) {
      cards.push({
        label: `${uniqueColumn.displayName} Únicos`,
        value: uniqueColumn.uniqueValues.toLocaleString("pt-BR"),
        icon: <Hash className="w-5 h-5" />,
        description: `Valores distintos na coluna ${uniqueColumn.name}`,
      });
    }

    return cards.slice(0, 5);
  }, [rows, columns]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <TooltipProvider key={index}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card 
                className={`border-border cursor-help transition-all hover:shadow-md hover:border-primary/30 ${
                  stat.highlight ? 'ring-2 ring-primary/20' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {stat.icon}
                    </div>
                    <Info className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-foreground truncate">
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {stat.label}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="font-medium">{stat.label}</p>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}
