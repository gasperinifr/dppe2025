import { useState, useMemo } from "react";
import { DatasetRow } from "@/types/dataset";
import { ColumnAnalysis, getDisplayColumns } from "@/lib/csvAnalyzer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Eye,
} from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SmartDataTableProps {
  columns: ColumnAnalysis[];
  rows: DatasetRow[];
  onEdit?: (row: DatasetRow) => void;
  onDelete?: (id: string) => void;
}

interface FilterState {
  search: string;
}

export function SmartDataTable({
  columns,
  rows,
  onEdit,
  onDelete,
}: SmartDataTableProps) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
  });
  const pageSize = 10;

  const displayColumns = useMemo(() => getDisplayColumns(columns, 6), [columns]);

  const filteredRows = useMemo(() => {
    if (!filters.search) return rows;
    
    const searchLower = filters.search.toLowerCase();
    return rows.filter((row) =>
      Object.values(row.row_data).some((value) =>
        String(value || "").toLowerCase().includes(searchLower)
      )
    );
  }, [rows, filters.search]);

  const totalPages = Math.ceil(filteredRows.length / pageSize);
  const paginatedRows = filteredRows.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const renderCellValue = (value: unknown, column: ColumnAnalysis) => {
    const strValue = String(value ?? "");
    
    if (!strValue || strValue === "null" || strValue === "undefined") {
      return <span className="text-muted-foreground italic">-</span>;
    }

    if (column.type === 'email') {
      return (
        <a 
          href={`mailto:${strValue}`} 
          className="text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {strValue}
        </a>
      );
    }

    if (column.type === 'url') {
      return (
        <a 
          href={strValue} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {strValue.length > 30 ? strValue.slice(0, 30) + "..." : strValue}
        </a>
      );
    }

    if (column.type === 'category' || column.isCategorical) {
      return (
        <Badge variant="secondary" className="font-normal">
          {strValue.length > 25 ? strValue.slice(0, 25) + "..." : strValue}
        </Badge>
      );
    }

    if (strValue.length > 40) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">{strValue.slice(0, 40)}...</span>
            </TooltipTrigger>
            <TooltipContent 
              className="max-w-sm whitespace-pre-wrap"
              side="top"
            >
              {strValue}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return strValue;
  };

  const RowExpander = ({ row }: { row: DatasetRow }) => {
    const hiddenColumns = columns.filter(
      c => !displayColumns.find(dc => dc.name === c.name)
    );

    if (hiddenColumns.length === 0) return null;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Eye className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 max-h-96 overflow-auto" align="end">
          <div className="space-y-3">
            <p className="font-semibold text-sm border-b pb-2">Todos os campos</p>
            {columns.map((col) => {
              const value = row.row_data[col.name];
              const strValue = String(value ?? "-");
              return (
                <div key={col.name} className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {col.displayName}
                  </p>
                  <p className="text-sm break-words">
                    {strValue || <span className="italic text-muted-foreground">-</span>}
                  </p>
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Search Bar */}
      <div className="p-4 border-b border-border">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar em todos os campos..."
              value={filters.search}
              onChange={(e) => {
                setFilters({ search: e.target.value });
                setPage(1);
              }}
              className="pl-10"
            />
          </div>

          {filters.search && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setFilters({ search: "" });
                setPage(1);
              }}
            >
              Limpar
            </Button>
          )}
          
          <Badge variant="outline" className="whitespace-nowrap">
            {filteredRows.length} registros
          </Badge>
        </div>
      </div>

      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {displayColumns.map((col) => (
                <TableHead
                  key={col.name}
                  className="whitespace-nowrap font-semibold"
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="cursor-help">
                        {col.displayName}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Campo: {col.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Tipo: {col.type} • {col.uniqueValues} valores únicos
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              ))}
              <TableHead className="w-[120px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={displayColumns.length + 1}
                  className="text-center py-8 text-muted-foreground"
                >
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  {displayColumns.map((col) => (
                    <TableCell key={col.name} className="max-w-[250px]">
                      {renderCellValue(row.row_data[col.name], col)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <RowExpander row={row} />
                      {onEdit && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onEdit(row)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar registro</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {onDelete && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => onDelete(row.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Excluir registro</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Próximo
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}