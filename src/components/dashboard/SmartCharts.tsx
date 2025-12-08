import { useState, useMemo } from "react";
import { DatasetRow, ChartConfig } from "@/types/dataset";
import { ColumnAnalysis, ChartSuggestion } from "@/lib/csvAnalyzer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, Edit2, Save, X, EyeOff } from "lucide-react";

interface SmartChartsProps {
  rows: DatasetRow[];
  columns: ColumnAnalysis[];
  chartSuggestions: ChartSuggestion[];
  chartConfigs?: ChartConfig[];
  onUpdateChartValues?: (columnName: string, values: Record<string, number>) => void;
  chartValueOverrides?: Record<string, Record<string, number>>;
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

interface EditModalState {
  open: boolean;
  chartIndex: number;
  columnName: string;
}

interface CategoryEdit {
  name: string;
  value: number;
  originalValue: number;
}

export function SmartCharts({ 
  rows, 
  columns, 
  chartSuggestions,
  chartConfigs,
  onUpdateChartValues,
  chartValueOverrides = {}
}: SmartChartsProps) {
  const [editModal, setEditModal] = useState<EditModalState>({
    open: false,
    chartIndex: -1,
    columnName: "",
  });
  const [categoryEdits, setCategoryEdits] = useState<CategoryEdit[]>([]);
  const [hideNumericInTable, setHideNumericInTable] = useState<Record<number, boolean>>({});

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
            hideNumeric: config.hideNumeric,
          } as ChartSuggestion & { hideNumeric?: boolean };
        });
    }
    
    // Fallback to auto-generated suggestions
    return chartSuggestions.slice(0, 5);
  }, [chartSuggestions, chartConfigs, columns]);

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
      
      // Apply overrides if they exist for this column
      const overrides = chartValueOverrides[suggestion.column] || {};
      
      const maxItems = suggestion.type === 'pie' ? 8 : (suggestion.type === 'table' ? 50 : 10);
      
      const data: ChartData[] = Object.entries(counts)
        .map(([name, count], idx) => ({
          name: name.length > 25 ? name.slice(0, 25) + "..." : name,
          fullName: name,
          // Use override value if exists, otherwise use original count
          value: overrides[name] !== undefined ? overrides[name] : count,
          fill: COLORS[idx % COLORS.length],
        }))
        .filter(item => item.value > 0) // Filter out zero values
        .sort((a, b) => b.value - a.value)
        .slice(0, maxItems);
      
      // Also keep track of original counts for editing
      return {
        suggestion,
        data,
        originalCounts: counts,
      };
    });
  }, [rows, enhancedSuggestions, chartValueOverrides]);

  const handleOpenEditModal = (chartIndex: number) => {
    const chartData = chartsData[chartIndex];
    const columnName = chartData.suggestion.column;
    const overrides = chartValueOverrides[columnName] || {};
    
    // Initialize category edits with all categories from original counts
    const edits: CategoryEdit[] = Object.entries(chartData.originalCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, originalCount]) => ({
        name,
        // Use override if exists, otherwise original
        value: overrides[name] !== undefined ? overrides[name] : originalCount,
        originalValue: originalCount,
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
    if (!onUpdateChartValues) return;
    
    const columnName = editModal.columnName;
    
    // Build the values map
    const values: Record<string, number> = {};
    categoryEdits.forEach(category => {
      values[category.name] = category.value;
    });
    
    onUpdateChartValues(columnName, values);
    
    setEditModal({ open: false, chartIndex: -1, columnName: "" });
    setCategoryEdits([]);
  };

  const toggleHideNumeric = (chartIndex: number) => {
    setHideNumericInTable(prev => ({
      ...prev,
      [chartIndex]: !prev[chartIndex],
    }));
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

  const renderTableChart = (data: ChartData[], chartIndex: number) => {
    const hideNumbers = hideNumericInTable[chartIndex] || false;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-end gap-2">
          <Label htmlFor={`hide-numbers-${chartIndex}`} className="text-xs text-muted-foreground">
            Ocultar números
          </Label>
          <Switch
            id={`hide-numbers-${chartIndex}`}
            checked={hideNumbers}
            onCheckedChange={() => toggleHideNumeric(chartIndex)}
          />
        </div>
        <ScrollArea className="h-[250px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                {!hideNumbers && <TableHead className="text-right w-24">Frequência</TableHead>}
                {!hideNumbers && <TableHead className="text-right w-20">%</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium" title={item.fullName}>
                    {item.fullName}
                  </TableCell>
                  {!hideNumbers && (
                    <TableCell className="text-right">{item.value}</TableCell>
                  )}
                  {!hideNumbers && (
                    <TableCell className="text-right text-muted-foreground">
                      {((item.value / rows.length) * 100).toFixed(1)}%
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    );
  };

  const renderChart = (suggestion: ChartSuggestion, data: ChartData[], chartIndex: number) => {
    if (suggestion.type === 'table') {
      return renderTableChart(data, chartIndex);
    }
    
    switch (suggestion.type) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={280}>
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
          </ResponsiveContainer>
        );
      
      case 'horizontal-bar':
        return (
          <ResponsiveContainer width="100%" height={280}>
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
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={280}>
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
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={280}>
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
          </ResponsiveContainer>
        );
      
      default: // bar chart
        return (
          <ResponsiveContainer width="100%" height={280}>
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
          </ResponsiveContainer>
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
                  {onUpdateChartValues && (
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
              {renderChart(suggestion, data, index)}
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
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Altere os valores numéricos de cada categoria. Diminuir o valor irá remover registros dessa categoria.
            </p>
            
            <ScrollArea className="h-[350px] border rounded-md">
              <div className="space-y-3 p-3">
                {categoryEdits.map((category, idx) => (
                  <div key={category.name} className="p-3 bg-muted/30 rounded-lg space-y-2">
                    <p className="text-sm font-medium break-words">
                      {category.name}
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">
                        Dados originais: {category.originalValue}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Input
                          type="number"
                          className="h-9 w-20 text-center"
                          value={category.value}
                          onChange={(e) => handleCategoryValueChange(idx, parseInt(e.target.value) || 0)}
                          min={0}
                        />
                        <span className="text-xs w-8 text-right">
                          {category.value !== category.originalValue && (
                            <span className={category.value < category.originalValue ? "text-destructive" : "text-primary"}>
                              {category.value - category.originalValue > 0 ? "+" : ""}{category.value - category.originalValue}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <p className="text-xs text-muted-foreground">
              Os valores alterados serão exibidos no gráfico. Valores originais permanecem nos dados.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
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
