import { useState, useRef } from "react";
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
import { Upload, Loader2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

interface ImportDatasetDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (name: string, columns: string[], rows: Record<string, unknown>[]) => void;
  isLoading?: boolean;
}

export function ImportDatasetDialog({
  open,
  onClose,
  onImport,
  isLoading,
}: ImportDatasetDialogProps) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ columns: string[]; rowCount: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (content: string): { columns: string[]; rows: Record<string, unknown>[] } => {
    const lines = content.split("\n");
    const rows: Record<string, unknown>[] = [];
    let columns: string[] = [];
    let buffer = "";
    let isFirstLine = true;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      buffer += (buffer ? "\n" : "") + line;

      const quoteCount = (buffer.match(/"/g) || []).length;
      if (quoteCount % 2 !== 0) continue;

      const parsedLine = parseCSVLine(buffer);
      buffer = "";

      if (isFirstLine) {
        columns = parsedLine.map((col) => col.trim());
        isFirstLine = false;
        continue;
      }

      if (parsedLine.length >= columns.length) {
        const row: Record<string, unknown> = {};
        columns.forEach((col, idx) => {
          row[col] = cleanValue(parsedLine[idx]);
        });
        rows.push(row);
      }
    }

    return { columns, rows };
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const cleanValue = (value: string | undefined): string => {
    if (!value) return "";
    return value.trim().replace(/^"|"$/g, "").replace(/\n/g, " ").trim();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    try {
      const content = await selectedFile.text();
      const { columns, rows } = parseCSV(content);
      
      setPreview({ columns, rowCount: rows.length });
      
      // Auto-generate name from filename
      const baseName = selectedFile.name.replace(/\.csv$/i, "").replace(/_/g, " ");
      setName(baseName);
    } catch (error) {
      toast.error("Erro ao ler arquivo CSV");
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    if (!file || !name) return;

    try {
      const content = await file.text();
      const { columns, rows } = parseCSV(content);

      if (rows.length === 0) {
        toast.error("Nenhum dado válido encontrado no arquivo");
        return;
      }

      onImport(name, columns, rows);
    } catch (error) {
      toast.error("Erro ao processar arquivo");
      console.error(error);
    }
  };

  const handleClose = () => {
    setName("");
    setFile(null);
    setPreview(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar Dataset CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Dataset</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Projetos de Extensão 2025"
            />
          </div>

          <div className="space-y-2">
            <Label>Arquivo CSV</Label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full h-24 border-dashed"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {file ? file.name : "Clique para selecionar um arquivo CSV"}
                </span>
              </div>
            </Button>
          </div>

          {preview && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm font-medium">Pré-visualização:</p>
              <p className="text-sm text-muted-foreground">
                <strong>{preview.rowCount}</strong> registros encontrados
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>{preview.columns.length}</strong> colunas: {preview.columns.slice(0, 5).join(", ")}
                {preview.columns.length > 5 && "..."}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!file || !name || isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
