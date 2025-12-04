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
  Filter,
  X,
  Calendar,
  Tag,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface SmartDataTableProps {
  columns: ColumnAnalysis[];
  rows: DatasetRow[];
  onEdit?: (row: DatasetRow) => void;
  onDelete?: (id: string) => void;
}

interface FilterState {
  search: string;
  dateColumn: string | null;
  dateFrom: string;
  dateTo: string;
  categoryColumn: string | null;
  selectedCategories: string[];
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
    dateColumn: null,
    dateFrom: "",
    dateTo: "",
    categoryColumn: null,
    selectedCategories: [],
  });
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 10;

  const displayColumns = useMemo(() => getDisplayColumns(columns, 6), [columns]);
  
  // Get date columns and category columns for filters
  const dateColumns = useMemo(() => 
    columns.filter(c => c.isDate || c.type === 'date'), [columns]);
  
  const categoryColumns = useMemo(() => 
    columns.filter(c => c.isCategorical && c.uniqueValues >= 2 && c.uniqueValues <= 50), 
    [columns]
  );

  // Get unique values for selected category column
  const categoryValues = useMemo(() => {
    if (!filters.categoryColumn) return [];
    const values = new Set<string>();
    rows.forEach(row => {
      const val = row.row_data[filters.categoryColumn!];
      if (val) values.add(String(val));
    });
    return Array.from(values).sort();
  }, [rows, filters.categoryColumn]);

  const filteredRows = useMemo(() => {
    let result = rows;

    // Text search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter((row) =>
        Object.values(row.row_data).some((value) =>
          String(value || "").toLowerCase().includes(searchLower)
        )
      );
    }

    // Date filter
    if (filters.dateColumn && (filters.dateFrom || filters.dateTo)) {
      result = result.filter((row) => {
        const dateValue = row.row_data[filters.dateColumn!];
        if (!dateValue) return false;
        
        const dateStr = String(dateValue);
        // Parse date - handle various formats
        let date: Date | null = null;
        
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            // DD/MM/YYYY or MM/DD/YYYY
            const [a, b, c] = parts.map(p => parseInt(p));
            if (a > 12) {
              date = new Date(c, b - 1, a); // DD/MM/YYYY
            } else {
              date = new Date(c, a - 1, b); // MM/DD/YYYY
            }
          }
        } else if (dateStr.includes('-')) {
          date = new Date(dateStr);
        }
        
        if (!date || isNaN(date.getTime())) return true; // Can't parse, include it
        
        if (filters.dateFrom) {
          const from = new Date(filters.dateFrom);
          if (date < from) return false;
        }
        
        if (filters.dateTo) {
          const to = new Date(filters.dateTo);
          to.setHours(23, 59, 59, 999);
          if (date > to) return false;
        }
        
        return true;
      });
    }

    // Category filter
    if (filters.categoryColumn && filters.selectedCategories.length > 0) {
      result = result.filter((row) => {
        const value = String(row.row_data[filters.categoryColumn!] || "");
        return filters.selectedCategories.includes(value);
      });
    }

    return result;
  }, [rows, filters]);

  const totalPages = Math.ceil(filteredRows.length / pageSize);
  const paginatedRows = filteredRows.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.dateColumn && (filters.dateFrom || filters.dateTo)) count++;
    if (filters.categoryColumn && filters.selectedCategories.length > 0) count++;
    return count;
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      search: "",
      dateColumn: null,
      dateFrom: "",
      dateTo: "",
      categoryColumn: null,
      selectedCategories: [],
    });
    setPage(1);
  };

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
      {/* Search and Filter Bar */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar em todos os campos..."
              value={filters.search}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, search: e.target.value }));
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          )}
          
          <Badge variant="outline" className="whitespace-nowrap">
            {filteredRows.length} registros
          </Badge>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            {/* Date Filter */}
            {dateColumns.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="w-4 h-4" />
                  Filtro por Data
                </div>
                <Select
                  value={filters.dateColumn || ""}
                  onValueChange={(value) => {
                    setFilters(prev => ({ 
                      ...prev, 
                      dateColumn: value || null,
                      dateFrom: "",
                      dateTo: ""
                    }));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione a coluna de data" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {dateColumns.map(col => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {filters.dateColumn && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">De</Label>
                      <Input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => {
                          setFilters(prev => ({ ...prev, dateFrom: e.target.value }));
                          setPage(1);
                        }}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Até</Label>
                      <Input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => {
                          setFilters(prev => ({ ...prev, dateTo: e.target.value }));
                          setPage(1);
                        }}
                        className="h-9"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Category Filter */}
            {categoryColumns.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Tag className="w-4 h-4" />
                  Filtro por Categoria
                </div>
                <Select
                  value={filters.categoryColumn || ""}
                  onValueChange={(value) => {
                    setFilters(prev => ({ 
                      ...prev, 
                      categoryColumn: value || null,
                      selectedCategories: []
                    }));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione a coluna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {categoryColumns.map(col => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.displayName} ({col.uniqueValues} valores)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {filters.categoryColumn && categoryValues.length > 0 && (
                  <ScrollArea className="h-[120px] border rounded-md p-2">
                    <div className="space-y-2">
                      {categoryValues.map(value => (
                        <div key={value} className="flex items-center gap-2">
                          <Checkbox
                            id={`cat-${value}`}
                            checked={filters.selectedCategories.includes(value)}
                            onCheckedChange={(checked) => {
                              setFilters(prev => ({
                                ...prev,
                                selectedCategories: checked
                                  ? [...prev.selectedCategories, value]
                                  : prev.selectedCategories.filter(v => v !== value)
                              }));
                              setPage(1);
                            }}
                          />
                          <Label 
                            htmlFor={`cat-${value}`} 
                            className="text-sm cursor-pointer flex-1"
                          >
                            {value}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}
          </div>
        )}
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