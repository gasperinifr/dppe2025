import { useState, useMemo } from "react";
import { DatasetRow } from "@/types/dataset";
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
  category: string;
  rowIds: string[];
}

export function SmartCharts({ 
  rows, 
  columns, 
  chartSuggestions,
  onUpdateRow 
}: SmartChartsProps) {
  const [editModal, setEditModal] = useState<EditModalState>({
    open: false,
    chartIndex: -1,
    category: "",
    rowIds: [],
  });
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  // Generate chart types based on data (excluding radial/treemap)
  const enhancedSuggestions = useMemo(() => {
    const suggestions = [...chartSuggestions];
    
    // Find columns suitable for additional chart types
    const categoricalCols = columns.filter(c => c.isCategorical && c.uniqueValues >= 2);
    
    // Add area chart for sequential categories
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
    
    return suggestions.slice(0, 5);
  }, [chartSuggestions, columns]);

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

  const handleEditCategory = (chartIndex: number, category: string, rowIds: string[]) => {
    // Get the column name for this chart
    const columnName = chartsData[chartIndex].suggestion.column;
    
    // Initialize edit values with current category for all rows
    const initialValues: Record<string, string> = {};
    rowIds.forEach(id => {
      initialValues[id] = category;
    });
    
    setEditValues(initialValues);
    setEditModal({
      open: true,
      chartIndex,
      category,
      rowIds,
    });
  };

  const handleSaveEdits = () => {
    if (!onUpdateRow) return;
    
    const columnName = chartsData[editModal.chartIndex].suggestion.column;
    
    // Update each row with its new value
    editModal.rowIds.forEach(rowId => {
      const row = rows.find(r => r.id === rowId);
      if (row && editValues[rowId] !== undefined) {
        const newRowData = { ...row.row_data, [columnName]: editValues[rowId] };
        onUpdateRow(rowId, newRowData);
      }
    });
    
    setEditModal({ open: false, chartIndex: -1, category: "", rowIds: [] });
    setEditValues({});
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
          {onUpdateRow && (
            <p className="text-xs text-primary mt-1">Clique para editar</p>
          )}
        </div>
      );
    }
    return null;
  };

  const handleChartClick = (chartIndex: number, data: ChartData) => {
    if (onUpdateRow && data.rowIds.length > 0) {
      handleEditCategory(chartIndex, data.fullName, data.rowIds);
    }
  };

  const renderChart = (suggestion: ChartSuggestion, data: ChartData[], chartIndex: number) => {
    const chartClickHandler = onUpdateRow 
      ? (chartData: any) => {
          if (chartData?.activePayload?.[0]?.payload) {
            handleChartClick(chartIndex, chartData.activePayload[0].payload);
          }
        }
      : undefined;

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
              onClick={(_, index) => onUpdateRow && handleChartClick(chartIndex, data[index])}
              style={{ cursor: onUpdateRow ? 'pointer' : 'default' }}
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
            onClick={chartClickHandler}
            style={{ cursor: onUpdateRow ? 'pointer' : 'default' }}
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
            onClick={chartClickHandler}
            style={{ cursor: onUpdateRow ? 'pointer' : 'default' }}
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
      
      default: // bar chart
        return (
          <BarChart 
            data={data} 
            margin={{ left: -10, right: 10 }}
            onClick={chartClickHandler}
            style={{ cursor: onUpdateRow ? 'pointer' : 'default' }}
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
                            onClick={() => {
                              // Open edit for the largest category
                              if (data.length > 0) {
                                handleEditCategory(index, data[0].fullName, data[0].rowIds);
                              }
                            }}
                          >
                            <Edit2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar dados do gráfico</TooltipContent>
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
                        {onUpdateRow && (
                          <p className="text-xs text-primary mt-1">
                            Clique nas barras/fatias para editar
                          </p>
                        )}
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

      {/* Edit Modal */}
      <Dialog 
        open={editModal.open} 
        onOpenChange={(open) => !open && setEditModal({ open: false, chartIndex: -1, category: "", rowIds: [] })}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5" />
              Editar Categoria: {editModal.category}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Edite o valor da categoria para os {editModal.rowIds.length} registros selecionados.
              Você pode alterar individualmente ou aplicar o mesmo valor para todos.
            </p>
            
            <div className="space-y-3 mb-4">
              <Label>Aplicar a todos</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Novo valor para todos"
                  onChange={(e) => {
                    const newValues: Record<string, string> = {};
                    editModal.rowIds.forEach(id => {
                      newValues[id] = e.target.value;
                    });
                    setEditValues(newValues);
                  }}
                />
              </div>
            </div>
            
            <ScrollArea className="h-[200px] border rounded-md p-3">
              <div className="space-y-2">
                {editModal.rowIds.slice(0, 20).map((rowId, idx) => {
                  const row = rows.find(r => r.id === rowId);
                  const columnName = editModal.chartIndex >= 0 
                    ? chartsData[editModal.chartIndex]?.suggestion?.column 
                    : "";
                  const identifier = row 
                    ? (row.row_data[columns[0]?.name] || `Registro ${idx + 1}`)
                    : `Registro ${idx + 1}`;
                  
                  return (
                    <div key={rowId} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-24 truncate">
                        {String(identifier).slice(0, 15)}
                      </span>
                      <Input
                        className="h-8 flex-1"
                        value={editValues[rowId] || ""}
                        onChange={(e) => setEditValues(prev => ({
                          ...prev,
                          [rowId]: e.target.value
                        }))}
                      />
                    </div>
                  );
                })}
                {editModal.rowIds.length > 20 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    ... e mais {editModal.rowIds.length - 20} registros
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setEditModal({ open: false, chartIndex: -1, category: "", rowIds: [] })}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveEdits}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}