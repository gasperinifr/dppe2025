import { useState, useEffect } from "react";
import { Dataset } from "@/types/dataset";
import { ColumnAnalysis, ChartSuggestion } from "@/lib/csvAnalyzer";
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
import { Settings, Save, Loader2, BarChart3, PieChart, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ChartConfig {
  column: string;
  type: 'pie' | 'bar' | 'horizontal-bar' | 'area' | 'auto';
  enabled: boolean;
  title: string;
}

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

  // Reset state when dialog opens or dataset changes
  useEffect(() => {
    if (open && dataset) {
      setName(dataset.name);
      setDescription(dataset.description || "");
      setEditedColumns(columns.length > 0 ? [...columns] : []);
      
      // Initialize chart configs from categorical columns
      const categoricalCols = columns.filter(c => c.isCategorical && c.uniqueValues >= 2);
      const initialConfigs: ChartConfig[] = categoricalCols.slice(0, 6).map(col => ({
        column: col.name,
        type: 'auto',
        enabled: true,
        title: `Distribuição por ${col.displayName}`,
      }));
      setChartConfigs(initialConfigs);
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
    index: number, 
    field: keyof ChartConfig, 
    value: string | boolean
  ) => {
    setChartConfigs(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
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

  const categoricalColumns = columns.filter(c => c.isCategorical && c.uniqueValues >= 2);

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
                  {chartConfigs.filter(c => c.enabled).length} ativos
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Escolha quais gráficos exibir e o tipo de visualização. 
                "Automático" seleciona o melhor tipo para cada coluna.
              </p>

              <div className="space-y-3">
                {categoricalColumns.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nenhuma coluna categórica encontrada para gráficos.
                  </p>
                ) : (
                  categoricalColumns.slice(0, 6).map((col, index) => {
                    const config = chartConfigs[index] || {
                      column: col.name,
                      type: 'auto',
                      enabled: true,
                      title: `Distribuição por ${col.displayName}`,
                    };
                    
                    return (
                      <div
                        key={col.name}
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
                                handleChartConfigChange(index, 'enabled', checked)
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
                                  handleChartConfigChange(index, 'type', value)
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
                                  handleChartConfigChange(index, 'title', e.target.value)
                                }
                                className="h-9"
                                placeholder="Título do gráfico"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
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