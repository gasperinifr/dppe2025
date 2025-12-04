import { useState, useEffect } from "react";
import { Dataset, ChartConfig } from "@/types/dataset";
import { ColumnAnalysis } from "@/lib/csvAnalyzer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Save, Loader2, BarChart3, PieChart, TrendingUp, LineChart, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EditDatasetDialogProps {
  open: boolean;
  onClose: () => void;
  dataset: Dataset | null;
  columns: ColumnAnalysis[];
  onSave: (updates: {
    name: string;
    description: string | null;
    columns: ColumnAnalysis[];
    chartConfigs?: ChartConfig[];
  }) => void;
  isLoading?: boolean;
}

const CHART_TYPES = [
  { value: 'auto', label: 'Automático', icon: Settings },
  { value: 'pie', label: 'Pizza', icon: PieChart },
  { value: 'bar', label: 'Barras Vertical', icon: BarChart3 },
  { value: 'horizontal-bar', label: 'Barras Horizontal', icon: BarChart3 },
  { value: 'area', label: 'Área', icon: TrendingUp },
  { value: 'line', label: 'Linha', icon: LineChart },
];

export function EditDatasetDialog({
  open,
  onClose,
  dataset,
  columns,
  onSave,
  isLoading,
}: EditDatasetDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editedColumns, setEditedColumns] = useState<ColumnAnalysis[]>([]);
  const [chartConfigs, setChartConfigs] = useState<ChartConfig[]>([]);

  // Get categorical columns for charts
  const categoricalColumns = columns.filter(c => c.isCategorical && c.uniqueValues >= 2);

  // Reset state when dialog opens or dataset changes
  useEffect(() => {
    if (open && dataset) {
      setName(dataset.name);
      setDescription(dataset.description || "");
      setEditedColumns(columns.length > 0 ? [...columns] : []);
      
      // Use saved chartConfigs or initialize from columns
      if (dataset.chartConfigs && dataset.chartConfigs.length > 0) {
        setChartConfigs([...dataset.chartConfigs]);
      } else {
        // Initialize with first 2 charts enabled by default
        const initialConfigs: ChartConfig[] = categoricalColumns.map((col, idx) => ({
          column: col.name,
          type: 'auto' as const,
          enabled: idx < 2, // Only first 2 enabled by default
          title: `Distribuição por ${col.displayName}`,
        }));
        setChartConfigs(initialConfigs);
      }
    }
  }, [open, dataset, columns]);

  const handleColumnDisplayNameChange = (index: number, newDisplayName: string) => {
    setEditedColumns(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], displayName: newDisplayName };
      return updated;
    });
  };

  const handleChartConfigChange = (
    columnName: string, 
    field: keyof ChartConfig, 
    value: string | boolean
  ) => {
    setChartConfigs(prev => {
      const existingIndex = prev.findIndex(c => c.column === columnName);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], [field]: value };
        return updated;
      }
      return prev;
    });
  };

  const handleAddChart = (columnName: string) => {
    const col = categoricalColumns.find(c => c.name === columnName);
    if (!col) return;
    
    setChartConfigs(prev => {
      const existing = prev.find(c => c.column === columnName);
      if (existing) {
        // Enable existing
        return prev.map(c => c.column === columnName ? { ...c, enabled: true } : c);
      }
      // Add new
      return [...prev, {
        column: columnName,
        type: 'auto' as const,
        enabled: true,
        title: `Distribuição por ${col.displayName}`,
      }];
    });
  };

  const handleSave = () => {
    onSave({
      name,
      description: description || null,
      columns: editedColumns,
      chartConfigs,
    });
  };

  if (!dataset) return null;

  // Get columns not yet added as charts
  const availableColumnsForChart = categoricalColumns.filter(
    col => !chartConfigs.find(c => c.column === col.name && c.enabled)
  );

  const enabledChartCount = chartConfigs.filter(c => c.enabled).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações do Dataset
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6 py-4">
            {/* Dataset Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dataset-name">Nome do Dataset</Label>
                <Input
                  id="dataset-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do dataset"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataset-description">Descrição (opcional)</Label>
                <Textarea
                  id="dataset-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o conteúdo deste dataset..."
                  rows={2}
                />
              </div>
            </div>

            <Separator />

            {/* Chart Configuration */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Configuração de Gráficos
                </Label>
                <Badge variant="secondary">
                  {enabledChartCount} ativos
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Ative ou desative gráficos e escolha o tipo de visualização.
              </p>

              <div className="space-y-3">
                {categoricalColumns.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nenhuma coluna categórica encontrada para gráficos.
                  </p>
                ) : (
                  <>
                    {/* Configured charts */}
                    {chartConfigs.map((config) => {
                      const col = categoricalColumns.find(c => c.name === config.column);
                      if (!col) return null;
                      
                      return (
                        <div
                          key={config.column}
                          className={`p-4 rounded-lg border transition-colors ${
                            config.enabled 
                              ? 'bg-card border-primary/30' 
                              : 'bg-muted/30 border-border'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={config.enabled}
                                onCheckedChange={(checked) =>
                                  handleChartConfigChange(config.column, 'enabled', checked)
                                }
                              />
                              <span className="font-medium text-sm">
                                {col.displayName}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {col.uniqueValues} valores
                              </Badge>
                            </div>
                          </div>
                          
                          {config.enabled && (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  Tipo de Gráfico
                                </Label>
                                <Select
                                  value={config.type}
                                  onValueChange={(value) =>
                                    handleChartConfigChange(config.column, 'type', value)
                                  }
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {CHART_TYPES.map((type) => (
                                      <SelectItem key={type.value} value={type.value}>
                                        <div className="flex items-center gap-2">
                                          <type.icon className="w-4 h-4" />
                                          {type.label}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  Título
                                </Label>
                                <Input
                                  value={config.title}
                                  onChange={(e) =>
                                    handleChartConfigChange(config.column, 'title', e.target.value)
                                  }
                                  className="h-9"
                                  placeholder="Título do gráfico"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add more charts section */}
                    {availableColumnsForChart.length > 0 && (
                      <div className="pt-2">
                        <Label className="text-sm text-muted-foreground mb-2 block">
                          Adicionar mais gráficos
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {availableColumnsForChart.map(col => (
                            <Button
                              key={col.name}
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddChart(col.name)}
                              className="text-xs"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              {col.displayName}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Column Names */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Nomes de Exibição dos Campos
              </Label>
              <p className="text-sm text-muted-foreground">
                Personalize como os campos são exibidos na interface
              </p>

              <div className="space-y-3">
                {editedColumns.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nenhum campo encontrado neste dataset.
                  </p>
                ) : (
                  editedColumns.map((col, index) => (
                    <div
                      key={col.name}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 font-mono">
                          {col.name}
                        </p>
                        <Input
                          value={col.displayName}
                          onChange={(e) =>
                            handleColumnDisplayNameChange(index, e.target.value)
                          }
                          className="h-8"
                          placeholder="Nome de exibição"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground w-16 text-right">
                        {col.type}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name || isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}