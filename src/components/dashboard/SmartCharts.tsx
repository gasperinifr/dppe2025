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
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  Treemap,
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
  "hsl(180, 60%, 45%)",
  "hsl(15, 85%, 50%)",
];

interface ChartData {
  name: string;
  value: number;
  fullName: string;
  fill?: string;
}

export function SmartCharts({ rows, columns, chartSuggestions }: SmartChartsProps) {
  // Generate more chart types based on data
  const enhancedSuggestions = useMemo(() => {
    const suggestions = [...chartSuggestions];
    
    // Find columns suitable for additional chart types
    const categoricalCols = columns.filter(c => c.isCategorical && c.uniqueValues >= 2);
    
    // Add area chart for time-like data or sequential categories
    if (categoricalCols.length > 0 && suggestions.length < 4) {
      const bestCol = categoricalCols.find(c => c.uniqueValues >= 4 && c.uniqueValues <= 15);
      if (bestCol && !suggestions.find(s => s.column === bestCol.name && s.type === 'area')) {
        suggestions.push({
          type: 'area',
          column: bestCol.name,
          title: `Tendência - ${bestCol.displayName}`,
          priority: bestCol.priority - 10,
          description: `Visualização em área para ${bestCol.displayName}`,
        });
      }
    }
    
    // Add radial bar for small categorical data
    if (categoricalCols.length > 0 && suggestions.length < 5) {
      const smallCatCol = categoricalCols.find(c => c.uniqueValues >= 2 && c.uniqueValues <= 6);
      if (smallCatCol && !suggestions.find(s => s.column === smallCatCol.name && s.type === 'radial')) {
        suggestions.push({
          type: 'radial',
          column: smallCatCol.name,
          title: `Comparativo - ${smallCatCol.displayName}`,
          priority: smallCatCol.priority - 15,
          description: `Gráfico radial comparando ${smallCatCol.displayName}`,
        });
      }
    }
    
    // Add treemap for hierarchical view
    if (categoricalCols.length > 0 && suggestions.length < 6) {
      const treemapCol = categoricalCols.find(c => c.uniqueValues >= 3 && c.uniqueValues <= 12);
      if (treemapCol && !suggestions.find(s => s.column === treemapCol.name && s.type === 'treemap')) {
        suggestions.push({
          type: 'treemap',
          column: treemapCol.name,
          title: `Proporções - ${treemapCol.displayName}`,
          priority: treemapCol.priority - 20,
          description: `Mapa de proporções para ${treemapCol.displayName}`,
        });
      }
    }
    
    return suggestions.slice(0, 6);
  }, [chartSuggestions, columns]);

  const chartsData = useMemo(() => {
    return enhancedSuggestions.map((suggestion) => {
      const counts: Record<string, number> = {};
      
      rows.forEach((row) => {
        const value = row.row_data[suggestion.column];
        const strValue = value ? String(value).trim() : "N/A";
        if (strValue) {
          counts[strValue] = (counts[strValue] || 0) + 1;
        }
      });
      
      const maxItems = suggestion.type === 'pie' ? 8 : 
                       suggestion.type === 'radial' ? 6 : 
                       suggestion.type === 'treemap' ? 12 : 10;
      
      const data: ChartData[] = Object.entries(counts)
        .map(([name, value], idx) => ({
          name: name.length > 20 ? name.slice(0, 20) + "..." : name,
          fullName: name,
          value,
          fill: COLORS[idx % COLORS.length],
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, maxItems);
      
      return {
        suggestion,
        data,
      };
    });
  }, [rows, enhancedSuggestions]);

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
          <p className="font-medium text-sm">{data.fullName || data.name}</p>
          <p className="text-primary font-bold">{data.value} registros</p>
          <p className="text-xs text-muted-foreground">
            {((data.value / rows.length) * 100).toFixed(1)}% do total
          </p>
        </div>
      );
    }
    return null;
  };

  const renderChart = (suggestion: ChartSuggestion, data: ChartData[]) => {
    switch (suggestion.type) {
      case 'pie':
        return (
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
        );
      
      case 'horizontal-bar':
        return (
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
        );
      
      case 'area':
        return (
          <AreaChart data={data} margin={{ left: -10, right: 10 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
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
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(142, 76%, 36%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        );
      
      case 'radial':
        const radialData = data.map((d, i) => ({
          ...d,
          fill: COLORS[i % COLORS.length],
        }));
        return (
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="20%"
            outerRadius="90%"
            data={radialData}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={5}
              background={{ fill: 'hsl(var(--muted))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconSize={10}
              layout="horizontal"
              verticalAlign="bottom"
              formatter={(value) => (
                <span className="text-xs text-foreground">{value}</span>
              )}
            />
          </RadialBarChart>
        );
      
      case 'treemap':
        return (
          <Treemap
            data={data}
            dataKey="value"
            aspectRatio={4 / 3}
            stroke="hsl(var(--background))"
            fill="hsl(142, 76%, 36%)"
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        );
      
      default: // bar chart
        return (
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
        );
    }
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
              {renderChart(suggestion, data)}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
