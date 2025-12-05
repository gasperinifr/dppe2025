import { useState, useEffect } from "react";
import { DatasetRow } from "@/types/dataset";
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
import { Loader2, Save } from "lucide-react";

interface EditRowDialogProps {
  open: boolean;
  onClose: () => void;
  row: DatasetRow | null;
  columns: string[];
  onSave: (id: string, rowData: Record<string, unknown>) => void;
  isLoading?: boolean;
}

export function EditRowDialog({
  open,
  onClose,
  row,
  columns,
  onSave,
  isLoading,
}: EditRowDialogProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (row) {
      const data: Record<string, string> = {};
      columns.forEach((col) => {
        data[col] = String(row.row_data[col] ?? "");
      });
      setFormData(data);
    }
  }, [row, columns]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!row) return;
    onSave(row.id, formData);
  };

  const isLongValue = (value: string) => value.length > 100;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="truncate">Editar Registro</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <ScrollArea className="flex-1 min-h-0 max-h-[50vh] pr-4">
            <div className="space-y-4 py-2">
              {columns.map((col) => (
                <div key={col} className="space-y-2 min-w-0">
                  <Label htmlFor={col} className="truncate block" title={col}>{col}</Label>
                  {isLongValue(formData[col] || "") ? (
                    <Textarea
                      id={col}
                      value={formData[col] || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [col]: e.target.value }))
                      }
                      rows={3}
                    />
                  ) : (
                    <Input
                      id={col}
                      value={formData[col] || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [col]: e.target.value }))
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4 flex-shrink-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
