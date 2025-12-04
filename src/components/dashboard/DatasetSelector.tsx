import { Dataset } from "@/types/dataset";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Database } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DatasetSelectorProps {
  datasets: Dataset[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export function DatasetSelector({
  datasets,
  selectedId,
  onSelect,
  onDelete,
  onNew,
}: DatasetSelectorProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Database className="w-4 h-4" />
          Datasets
        </h3>
        <Button size="sm" onClick={onNew} variant="outline">
          <Plus className="w-4 h-4 mr-1" />
          Novo
        </Button>
      </div>
      
      <ScrollArea className="h-[200px]">
        <div className="space-y-2">
          {datasets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum dataset importado.<br />
              Clique em "Novo" para importar um CSV.
            </p>
          ) : (
            datasets.map((dataset) => (
              <div
                key={dataset.id}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedId === dataset.id
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-muted/50 hover:bg-muted border border-transparent"
                }`}
                onClick={() => onSelect(dataset.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {dataset.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dataset.columns.length} colunas
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Dataset</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir "{dataset.name}"? 
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(dataset.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
