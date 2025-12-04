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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Loader2, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { analyzeCSV, CSVAnalysisResult, ColumnAnalysis } from "@/lib/csvAnalyzer";

interface ImportDatasetDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (
    name: string,
    columns: ColumnAnalysis[],
    rows: Record<string, unknown>[],
    chartSuggestions: CSVAnalysisResult['suggestedCharts']
  ) => void;
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
  const [analysis, setAnalysis] = useState<CSVAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setAnalysis(null);

    try {
      const content = await selectedFile.text();
      const result = analyzeCSV(content);
      
      if (result.rows.length === 0) {
        setError("Nenhum dado válido encontrado no arquivo");
        return;
      }

      setAnalysis(result);
      
      // Auto-generate name from filename
      const baseName = selectedFile.name
        .replace(/\.csv$/i, "")
        .replace(/_/g, " ")
        .replace(/-/g, " ");
      setName(baseName);
      
      toast.success(`Arquivo analisado: ${result.cleanedRows} registros válidos`);
    } catch (err) {
      setError("Erro ao analisar arquivo CSV. Verifique o formato.");
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (!analysis || !name) return;

    onImport(name, analysis.columns, analysis.rows, analysis.suggestedCharts);
  };

  const handleClose = () => {
    setName("");
    setFile(null);
    setAnalysis(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
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

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {analysis && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Análise Completa</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Registros válidos</p>
                  <p className="font-semibold text-lg">{analysis.cleanedRows}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Campos detectados</p>
                  <p className="font-semibold text-lg">{analysis.columns.length}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Campos encontrados:</p>
                <ScrollArea className="h-[120px]">
                  <div className="flex flex-wrap gap-2">
                    {analysis.columns.map((col) => (
                      <Badge
                        key={col.name}
                        variant={col.isCategorical ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {col.displayName}
                        <span className="ml-1 opacity-60">({col.type})</span>
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {analysis.suggestedCharts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Gráficos sugeridos:</p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.suggestedCharts.map((chart, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {chart.type === 'pie' && '📊'}
                        {chart.type === 'bar' && '📈'}
                        {chart.type === 'horizontal-bar' && '📊'}
                        {' '}{chart.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {analysis.totalRows !== analysis.cleanedRows && (
                <p className="text-xs text-muted-foreground">
                  * {analysis.totalRows - analysis.cleanedRows} linhas foram ignoradas 
                  (vazias ou com dados inválidos)
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!analysis || !name || isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Importar Dataset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
