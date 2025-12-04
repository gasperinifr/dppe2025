import { Dataset } from "@/types/dataset";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Database, Settings, FileSpreadsheet } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DatasetSelectorProps {
  datasets: Dataset[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onEdit?: (dataset: Dataset) => void;
}

export function DatasetSelector({
  datasets,
  selectedId,
  onSelect,
  onDelete,
  onNew,
  onEdit,
}: DatasetSelectorProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Database className="w-4 h-4" />
          Datasets
        </h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" onClick={onNew} variant="default">
                <Plus className="w-4 h-4 mr-1" />
                Importar
              </Button>
            </TooltipTrigger>
            <TooltipContent>Importar novo arquivo CSV</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <ScrollArea className="h-[250px]">
        <div className="space-y-2">
          {datasets.length === 0 ? (
            <div className="text-center py-8">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum dataset importado.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Clique em "Importar" para adicionar um CSV.
              </p>
            </div>
          ) : (
            datasets.map((dataset) => (
              <div
                key={dataset.id}
                className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                  selectedId === dataset.id
                    ? "bg-primary/10 border-2 border-primary/40 shadow-sm"
                    : "bg-muted/50 hover:bg-muted border-2 border-transparent"
                }`}
                onClick={() => onSelect(dataset.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {dataset.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {dataset.columns.length} campos
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(dataset.created_at)}
                      </span>
                    </div>
                    {dataset.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {dataset.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(dataset);
                              }}
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Configurações</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    <AlertDialog>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>Excluir dataset</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Dataset</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir "{dataset.name}"? 
                            Esta ação não pode ser desfeita e todos os dados 
                            serão permanentemente removidos.
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
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
