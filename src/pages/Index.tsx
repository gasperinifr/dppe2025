import { useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ProjetosTable } from "@/components/dashboard/ProjetosTable";
import { ProjetoForm } from "@/components/dashboard/ProjetoForm";
import { DeleteConfirmDialog } from "@/components/dashboard/DeleteConfirmDialog";
import { ImportCSVButton } from "@/components/dashboard/ImportCSVButton";
import { ChartsByStatus } from "@/components/dashboard/ChartsByStatus";
import { ChartsByDepartment } from "@/components/dashboard/ChartsByDepartment";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import {
  useProjetos,
  useCreateProjeto,
  useUpdateProjeto,
  useDeleteProjeto,
  useBulkInsertProjetos,
} from "@/hooks/useProjetos";
import { Projeto, ProjetoInsert } from "@/types/projeto";
import { Skeleton } from "@/components/ui/skeleton";

export default function Index() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingProjeto, setEditingProjeto] = useState<Projeto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTitle, setDeleteTitle] = useState<string>("");

  const { data: projetos = [], isLoading, refetch } = useProjetos();
  const createMutation = useCreateProjeto();
  const updateMutation = useUpdateProjeto();
  const deleteMutation = useDeleteProjeto();
  const bulkInsertMutation = useBulkInsertProjetos();

  const handleEdit = (projeto: Projeto) => {
    setEditingProjeto(projeto);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const projeto = projetos.find((p) => p.id === id);
    setDeleteId(id);
    setDeleteTitle(projeto?.titulo_projeto || "");
  };

  const handleFormSubmit = (data: ProjetoInsert) => {
    if (editingProjeto) {
      updateMutation.mutate(
        { id: editingProjeto.id, ...data },
        {
          onSuccess: () => {
            setFormOpen(false);
            setEditingProjeto(null);
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setFormOpen(false);
        },
      });
    }
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => {
          setDeleteId(null);
          setDeleteTitle("");
        },
      });
    }
  };

  const handleImport = (projetosToImport: ProjetoInsert[]) => {
    bulkInsertMutation.mutate(projetosToImport);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[120px] rounded-xl" />
            ))}
          </div>
        ) : (
          <StatsCards projetos={projetos} />
        )}

        {/* Charts */}
        {!isLoading && projetos.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            <ChartsByStatus projetos={projetos} />
            <ChartsByDepartment projetos={projetos} />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-display font-semibold text-foreground">
            Projetos de Pesquisa
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <ImportCSVButton
              onImport={handleImport}
              isLoading={bulkInsertMutation.isPending}
            />
            <Button
              onClick={() => {
                setEditingProjeto(null);
                setFormOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Projeto
            </Button>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <Skeleton className="h-[400px] rounded-xl" />
        ) : (
          <ProjetosTable
            projetos={projetos}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </main>

      {/* Form Dialog */}
      <ProjetoForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingProjeto(null);
        }}
        projeto={editingProjeto}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={!!deleteId}
        onClose={() => {
          setDeleteId(null);
          setDeleteTitle("");
        }}
        onConfirm={handleConfirmDelete}
        title={deleteTitle}
      />
    </div>
  );
}
