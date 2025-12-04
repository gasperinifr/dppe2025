import { useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { DatasetSelector } from "@/components/dashboard/DatasetSelector";
import { GenericStats } from "@/components/dashboard/GenericStats";
import { GenericCharts } from "@/components/dashboard/GenericCharts";
import { GenericDataTable } from "@/components/dashboard/GenericDataTable";
import { ImportDatasetDialog } from "@/components/dashboard/ImportDatasetDialog";
import { EditRowDialog } from "@/components/dashboard/EditRowDialog";
import { DeleteConfirmDialog } from "@/components/dashboard/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, FileSpreadsheet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDatasets,
  useDatasetRows,
  useCreateDataset,
  useDeleteDataset,
  useBulkInsertDatasetRows,
  useUpdateDatasetRow,
  useDeleteDatasetRow,
} from "@/hooks/useDatasets";
import { DatasetRow } from "@/types/dataset";

export default function Index() {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<DatasetRow | null>(null);
  const [deleteRowId, setDeleteRowId] = useState<string | null>(null);

  const { data: datasets = [], isLoading: loadingDatasets, refetch: refetchDatasets } = useDatasets();
  const { data: rows = [], isLoading: loadingRows, refetch: refetchRows } = useDatasetRows(selectedDatasetId);

  const createDatasetMutation = useCreateDataset();
  const deleteDatasetMutation = useDeleteDataset();
  const bulkInsertRowsMutation = useBulkInsertDatasetRows();
  const updateRowMutation = useUpdateDatasetRow();
  const deleteRowMutation = useDeleteDatasetRow();

  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId);

  // Auto-select first dataset
  if (!selectedDatasetId && datasets.length > 0 && !loadingDatasets) {
    setSelectedDatasetId(datasets[0].id);
  }

  const handleImport = async (name: string, columns: string[], rowsData: Record<string, unknown>[]) => {
    createDatasetMutation.mutate(
      { name, columns },
      {
        onSuccess: (newDataset) => {
          bulkInsertRowsMutation.mutate(
            { datasetId: newDataset.id, rows: rowsData },
            {
              onSuccess: () => {
                setSelectedDatasetId(newDataset.id);
                setImportOpen(false);
              },
            }
          );
        },
      }
    );
  };

  const handleDeleteDataset = (id: string) => {
    deleteDatasetMutation.mutate(id, {
      onSuccess: () => {
        if (selectedDatasetId === id) {
          setSelectedDatasetId(datasets.find((d) => d.id !== id)?.id || null);
        }
      },
    });
  };

  const handleEditRow = (row: DatasetRow) => {
    setEditingRow(row);
  };

  const handleSaveRow = (id: string, rowData: Record<string, unknown>) => {
    updateRowMutation.mutate(
      { id, row_data: rowData },
      {
        onSuccess: () => {
          setEditingRow(null);
        },
      }
    );
  };

  const handleDeleteRow = (id: string) => {
    setDeleteRowId(id);
  };

  const handleConfirmDeleteRow = () => {
    if (deleteRowId) {
      deleteRowMutation.mutate(deleteRowId, {
        onSuccess: () => {
          setDeleteRowId(null);
        },
      });
    }
  };

  const isLoading = loadingDatasets || loadingRows;
  const isImporting = createDatasetMutation.isPending || bulkInsertRowsMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid lg:grid-cols-[300px_1fr] gap-8">
          {/* Sidebar - Dataset Selector */}
          <aside>
            <DatasetSelector
              datasets={datasets}
              selectedId={selectedDatasetId}
              onSelect={setSelectedDatasetId}
              onDelete={handleDeleteDataset}
              onNew={() => setImportOpen(true)}
            />
          </aside>

          {/* Main Content */}
          <div className="space-y-8">
            {!selectedDataset ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FileSpreadsheet className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Nenhum Dataset Selecionado
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Importe um arquivo CSV para começar a visualizar e gerenciar seus dados.
                </p>
                <Button onClick={() => setImportOpen(true)}>
                  Importar CSV
                </Button>
              </div>
            ) : (
              <>
                {/* Title + Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-display font-semibold text-foreground">
                      {selectedDataset.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {rows.length} registros • {selectedDataset.columns.length} colunas
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      refetchDatasets();
                      refetchRows();
                    }}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                    Atualizar
                  </Button>
                </div>

                {/* Stats */}
                {isLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-[80px] rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <GenericStats rows={rows} columns={selectedDataset.columns} />
                )}

                {/* Charts */}
                {!isLoading && rows.length > 0 && (
                  <GenericCharts rows={rows} columns={selectedDataset.columns} />
                )}

                {/* Table */}
                {isLoading ? (
                  <Skeleton className="h-[400px] rounded-xl" />
                ) : (
                  <GenericDataTable
                    columns={selectedDataset.columns}
                    rows={rows}
                    onEdit={handleEditRow}
                    onDelete={handleDeleteRow}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Import Dialog */}
      <ImportDatasetDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
        isLoading={isImporting}
      />

      {/* Edit Row Dialog */}
      {selectedDataset && (
        <EditRowDialog
          open={!!editingRow}
          onClose={() => setEditingRow(null)}
          row={editingRow}
          columns={selectedDataset.columns}
          onSave={handleSaveRow}
          isLoading={updateRowMutation.isPending}
        />
      )}

      {/* Delete Row Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteRowId}
        onClose={() => setDeleteRowId(null)}
        onConfirm={handleConfirmDeleteRow}
        title="este registro"
      />
    </div>
  );
}
