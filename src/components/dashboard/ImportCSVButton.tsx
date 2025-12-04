import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { ProjetoInsert } from "@/types/projeto";
import { toast } from "sonner";

interface ImportCSVButtonProps {
  onImport: (projetos: ProjetoInsert[]) => void;
  isLoading?: boolean;
}

export function ImportCSVButton({ onImport, isLoading }: ImportCSVButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);

  const parseCSV = (content: string): ProjetoInsert[] => {
    const lines = content.split("\n");
    const projetos: ProjetoInsert[] = [];
    
    let currentRecord: Partial<ProjetoInsert> = {};
    let buffer = "";
    let isFirstLine = true;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      buffer += (buffer ? "\n" : "") + line;

      // Count quotes to check if we're in a complete record
      const quoteCount = (buffer.match(/"/g) || []).length;
      
      if (quoteCount % 2 !== 0) {
        // Incomplete record, continue buffering
        continue;
      }

      // Skip header
      if (isFirstLine) {
        isFirstLine = false;
        buffer = "";
        continue;
      }

      // Parse the buffered record
      const record = parseCSVLine(buffer);
      buffer = "";

      if (record.length >= 10) {
        const projeto: ProjetoInsert = {
          codigo: cleanValue(record[0]) || null,
          campus: cleanValue(record[1]) || "CAMPUS FLORIANOPOLIS - FLN",
          edital: cleanValue(record[2]) || "",
          titulo_projeto: cleanValue(record[3]) || "",
          areas_conhecimento: cleanValue(record[4]) || null,
          departamento: cleanValue(record[5]) || null,
          tipo: cleanValue(record[6]) || "INTERNO",
          situacao: cleanValue(record[7]) || "CADASTRO EM ANDAMENTO",
          data_cadastro: parseDate(cleanValue(record[8])),
          coordenador: cleanValue(record[9]) || "",
          email: cleanEmail(cleanValue(record[10])),
          data_inicio: parseDate(cleanValue(record[11])),
          data_termino: parseDate(cleanValue(record[12])),
        };

        if (projeto.titulo_projeto && projeto.coordenador && projeto.edital) {
          projetos.push(projeto);
        }
      }
    }

    return projetos;
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

  const cleanEmail = (value: string): string | null => {
    const email = value.trim().replace(/\n/g, "").replace(/\s/g, "");
    return email && email.includes("@") ? email : null;
  };

  const parseDate = (value: string): string | null => {
    if (!value) return null;
    
    // Try DD/MM/YYYY format
    const parts = value.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    
    return null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);

    try {
      const content = await file.text();
      const projetos = parseCSV(content);

      if (projetos.length === 0) {
        toast.error("Nenhum projeto válido encontrado no arquivo");
        return;
      }

      onImport(projetos);
    } catch (error) {
      toast.error("Erro ao processar arquivo CSV");
      console.error(error);
    } finally {
      setParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        className="hidden"
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading || parsing}
      >
        {(isLoading || parsing) ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Upload className="w-4 h-4 mr-2" />
        )}
        Importar CSV
      </Button>
    </>
  );
}
