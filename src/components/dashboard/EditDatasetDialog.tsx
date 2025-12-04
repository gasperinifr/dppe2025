import { useState, useEffect } from "react";
import { Dataset } from "@/types/dataset";
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
import { Settings, Save, Loader2 } from "lucide-react";

interface EditDatasetDialogProps {
  open: boolean;
  onClose: () => void;
  dataset: Dataset | null;
  columns: ColumnAnalysis[];
  onSave: (updates: {
    name: string;
    description: string | null;
    columns: ColumnAnalysis[];
  }) => void;
  isLoading?: boolean;
}

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

  // Reset state when dialog opens or dataset changes
  useEffect(() => {
    if (open && dataset) {
      setName(dataset.name);
      setDescription(dataset.description || "");
      setEditedColumns(columns.length > 0 ? [...columns] : []);
    }
  }, [open, dataset, columns]);

  const handleColumnDisplayNameChange = (index: number, newDisplayName: string) => {
    setEditedColumns(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], displayName: newDisplayName };
      return updated;
    });
  };

  const handleSave = () => {
    onSave({
      name,
      description: description || null,
      columns: editedColumns,
    });
  };

  if (!dataset) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações do Dataset
          </DialogTitle>
        </DialogHeader>

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

          {/* Column Names */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Nomes de Exibição dos Campos
            </Label>
            <p className="text-sm text-muted-foreground">
              Personalize como os campos são exibidos na interface
            </p>

            <ScrollArea className="h-[250px] pr-4">
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
            </ScrollArea>
          </div>
        </div>

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
