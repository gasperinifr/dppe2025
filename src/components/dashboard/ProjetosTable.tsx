import { useState } from "react";
import { Projeto } from "@/types/projeto";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit2, Trash2, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { SITUACAO_OPTIONS } from "@/types/projeto";

interface ProjetosTableProps {
  projetos: Projeto[];
  onEdit: (projeto: Projeto) => void;
  onDelete: (id: string) => void;
}

export function ProjetosTable({ projetos, onEdit, onDelete }: ProjetosTableProps) {
  const [search, setSearch] = useState("");
  const [situacaoFilter, setSituacaoFilter] = useState<string>("all");
  const [departamentoFilter, setDepartamentoFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const departamentos = Array.from(
    new Set(projetos.map((p) => p.departamento).filter(Boolean))
  ).sort() as string[];

  const filtered = projetos.filter((projeto) => {
    const matchesSearch =
      projeto.titulo_projeto.toLowerCase().includes(search.toLowerCase()) ||
      projeto.coordenador.toLowerCase().includes(search.toLowerCase()) ||
      projeto.codigo?.toLowerCase().includes(search.toLowerCase()) ||
      projeto.email?.toLowerCase().includes(search.toLowerCase());

    const matchesSituacao =
      situacaoFilter === "all" || projeto.situacao === situacaoFilter;

    const matchesDepartamento =
      departamentoFilter === "all" || projeto.departamento === departamentoFilter;

    return matchesSearch && matchesSituacao && matchesDepartamento;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedProjetos = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <div className="bg-card rounded-xl shadow-card border border-border/50 animate-fade-in">
      <div className="p-4 border-b border-border/50">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, coordenador, código ou e-mail..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={situacaoFilter}
              onValueChange={(value) => {
                setSituacaoFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Situação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Situações</SelectItem>
                {SITUACAO_OPTIONS.map((situacao) => (
                  <SelectItem key={situacao} value={situacao}>
                    {situacao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={departamentoFilter}
              onValueChange={(value) => {
                setDepartamentoFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Departamentos</SelectItem>
                {departamentos.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          Mostrando {paginatedProjetos.length} de {filtered.length} projetos
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Código</TableHead>
              <TableHead className="min-w-[300px]">Título</TableHead>
              <TableHead>Coordenador</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Início</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProjetos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum projeto encontrado
                </TableCell>
              </TableRow>
            ) : (
              paginatedProjetos.map((projeto) => (
                <TableRow key={projeto.id} className="group hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">
                    {projeto.codigo || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[400px]">
                      <p className="font-medium text-foreground line-clamp-2">
                        {projeto.titulo_projeto}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {projeto.edital}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{projeto.coordenador}</p>
                      <p className="text-xs text-muted-foreground">{projeto.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{projeto.departamento || "-"}</TableCell>
                  <TableCell>
                    <StatusBadge situacao={projeto.situacao} />
                  </TableCell>
                  <TableCell>{formatDate(projeto.data_inicio)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(projeto)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(projeto.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
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
