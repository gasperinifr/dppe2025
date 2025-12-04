import { Dataset } from "@/types/dataset";
import { Button } from "@/components/ui/button";
import { Plus, Database, Settings, FileSpreadsheet } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
  onNew: () => void;
  onEdit?: (dataset: Dataset) => void;
}

export function DatasetSelector({
  datasets,
  selectedId,
  onSelect,
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
    <div className="bg-card rounded-xl border border-border p-4 shadow-sm w-full">
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
      
      <ScrollArea className="h-[300px]">
        <div className="space-y-2 pr-2">
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
                className={`p-3 rounded-lg cursor-pointer transition-all ${
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
                  
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(dataset);
                      }}
                      title="Configurações"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
