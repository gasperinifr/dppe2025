import { useState, useMemo } from "react";
import { DatasetRow, ChartConfig } from "@/types/dataset";
import { ColumnAnalysis, ChartSuggestion } from "@/lib/csvAnalyzer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  LineChart,
  Line,
} from "recharts";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, Edit2, Save, X } from "lucide-react";

interface SmartChartsProps {
  rows: DatasetRow[];
  columns: ColumnAnalysis[];
  chartSuggestions: ChartSuggestion[];
  chartConfigs?: ChartConfig[];
  onUpdateRow?: (id: string, rowData: Record<string, unknown>) => void;
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
  rowIds: string[];
}

interface EditModalState {
  open: boolean;
  chartIndex: number;
  columnName: string;
}

interface CategoryEdit {
  name: string;
  value: number;
  originalValue: number;
  rowIds: string[];
}

export function SmartCharts({ 
  rows, 
  columns, 
  chartSuggestions,
  chartConfigs,
  onUpdateRow 
}: SmartChartsProps) {
  const [editModal, setEditModal] = useState<EditModalState>({
    open: false,
    chartIndex: -1,
    columnName: "",
  });
  const [categoryEdits, setCategoryEdits] = useState<CategoryEdit[]>([]);

  // Merge chartConfigs with suggestions
  const enhancedSuggestions = useMemo(() => {
    if (chartConfigs && chartConfigs.length > 0) {
      // Use saved configs, filtered by enabled
      return chartConfigs
        .filter(config => config.enabled)
        .map(config => {
          const col = columns.find(c => c.name === config.column);
          return {
            type: config.type === 'auto' ? 'bar' : config.type,
            column: config.column,
            title: config.title,
            priority: 100,
            description: col ? `${col.uniqueValues} valores únicos` : 'Gráfico personalizado',
          } as ChartSuggestion;
        });
    }
    
    // Fallback to auto-generated suggestions
    return chartSuggestions.slice(0, 5);
  }, [chartSuggestions, chartConfigs, columns]);

  const chartsData = useMemo(() => {
    return enhancedSuggestions.map((suggestion) => {
      const counts: Record<string, { count: number; rowIds: string[] }> = {};
      
      rows.forEach((row) => {
        const value = row.row_data[suggestion.column];
        const strValue = value ? String(value).trim() : "N/A";
        if (strValue) {
          if (!counts[strValue]) {
            counts[strValue] = { count: 0, rowIds: [] };
          }
          counts[strValue].count++;
          counts[strValue].rowIds.push(row.id);
        }
      });
      
      const maxItems = suggestion.type === 'pie' ? 8 : 10;
      
      const data: ChartData[] = Object.entries(counts)
        .map(([name, { count, rowIds }], idx) => ({
          name: name.length > 20 ? name.slice(0, 20) + "..." : name,
          fullName: name,
          value: count,
          fill: COLORS[idx % COLORS.length],
          rowIds,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, maxItems);
      
      return {
        suggestion,
        data,
      };
    });
  }, [rows, enhancedSuggestions]);

  const handleOpenEditModal = (chartIndex: number) => {
    const chartData = chartsData[chartIndex];
    const columnName = chartData.suggestion.column;
    
    // Initialize category edits with current data
    const edits: CategoryEdit[] = chartData.data.map(item => ({
      name: item.fullName,
      value: item.value,
      originalValue: item.value,
      rowIds: item.rowIds,
    }));
    
    setCategoryEdits(edits);
    setEditModal({
      open: true,
      chartIndex,
      columnName,
    });
  };

  const handleCategoryValueChange = (index: number, newValue: number) => {
    setCategoryEdits(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value: Math.max(0, newValue) };
      return updated;
    });
  };

  const handleSaveEdits = () => {
    if (!onUpdateRow) return;
    
    const columnName = editModal.columnName;
    
    // For each category that changed, update rows
    categoryEdits.forEach(category => {
      const diff = category.value - category.originalValue;
      
      if (diff > 0) {
        // Need to add more rows with this category - can't add rows, just notify
        console.log(`Increase not supported: would need to add ${diff} rows`);
      } else if (diff < 0) {
        // Need to remove some rows from this category - change them to "N/A" or remove the value
        const rowsToModify = category.rowIds.slice(0, Math.abs(diff));
        rowsToModify.forEach(rowId => {
          const row = rows.find(r => r.id === rowId);
          if (row) {
            const newRowData = { ...row.row_data, [columnName]: "" };
            onUpdateRow(rowId, newRowData);
          }
        });
      }
    });
    
    setEditModal({ open: false, chartIndex: -1, columnName: "" });
    setCategoryEdits([]);
  };

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

  const renderChart = (suggestion: ChartSuggestion, data: ChartData[], chartIndex: number) => {
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
          <AreaChart 
            data={data} 
            margin={{ left: -10, right: 10 }}
          >
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

      case 'line':
        return (
          <LineChart 
            data={data} 
            margin={{ left: -10, right: 10 }}
          >
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
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(142, 76%, 36%)"
              strokeWidth={2}
              dot={{ fill: "hsl(142, 76%, 36%)", strokeWidth: 2 }}
            />
          </LineChart>
        );
      
      default: // bar chart
        return (
          <BarChart 
            data={data} 
            margin={{ left: -10, right: 10 }}
          >
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
    <>
      <div className="grid md:grid-cols-2 gap-6">
        {chartsData.map(({ suggestion, data }, index) => (
          <Card key={index} className="border-border overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{suggestion.title}</span>
                <div className="flex items-center gap-2">
                  {onUpdateRow && (
                    <TooltipProvider>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleOpenEditModal(index)}
                          >
                            <Edit2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar valores do gráfico</TooltipContent>
                      </UITooltip>
                    </TooltipProvider>
                  )}
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
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                {renderChart(suggestion, data, index)}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Modal - Numeric values per category */}
      <Dialog 
        open={editModal.open} 
        onOpenChange={(open) => !open && setEditModal({ open: false, chartIndex: -1, columnName: "" })}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5" />
              Editar valores do gráfico
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Altere os valores numéricos de cada categoria. Diminuir o valor irá remover registros dessa categoria.
            </p>
            
            <ScrollArea className="h-[300px] border rounded-md p-3">
              <div className="space-y-3">
                {categoryEdits.map((category, idx) => (
                  <div key={category.name} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" title={category.name}>
                        {category.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Original: {category.originalValue} registros
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="h-9 w-24 text-center"
                        value={category.value}
                        onChange={(e) => handleCategoryValueChange(idx, parseInt(e.target.value) || 0)}
                        min={0}
                        max={category.originalValue}
                      />
                      <span className="text-xs text-muted-foreground w-8">
                        {category.value !== category.originalValue && (
                          <span className={category.value < category.originalValue ? "text-destructive" : "text-primary"}>
                            {category.value - category.originalValue > 0 ? "+" : ""}{category.value - category.originalValue}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <p className="text-xs text-muted-foreground mt-3">
              Nota: Apenas a redução de valores é suportada (remove registros da categoria).
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setEditModal({ open: false, chartIndex: -1, columnName: "" })}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveEdits}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}