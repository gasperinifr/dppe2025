import { useState, useMemo } from "react";
import { Header } from "@/components/dashboard/Header";
import { DatasetSelector } from "@/components/dashboard/DatasetSelector";
import { SmartStats } from "@/components/dashboard/SmartStats";
import { SmartCharts } from "@/components/dashboard/SmartCharts";
import { SmartDataTable } from "@/components/dashboard/SmartDataTable";
import { ImportDatasetDialog } from "@/components/dashboard/ImportDatasetDialog";
import { EditRowDialog } from "@/components/dashboard/EditRowDialog";
import { EditDatasetDialog } from "@/components/dashboard/EditDatasetDialog";
import { DeleteConfirmDialog } from "@/components/dashboard/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, FileSpreadsheet, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDatasets,
  useDatasetRows,
  useCreateDataset,
  useDeleteDataset,
  useUpdateDataset,
  useBulkInsertDatasetRows,
  useUpdateDatasetRow,
  useDeleteDatasetRow,
} from "@/hooks/useDatasets";
import { Dataset, DatasetRow } from "@/types/dataset";
import { ColumnAnalysis, ChartSuggestion } from "@/lib/csvAnalyzer";

export default function Index() {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<DatasetRow | null>(null);
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
  const [deleteRowId, setDeleteRowId] = useState<string | null>(null);

  const { data: datasets = [], isLoading: loadingDatasets, refetch: refetchDatasets } = useDatasets();
  const { data: rows = [], isLoading: loadingRows, refetch: refetchRows } = useDatasetRows(selectedDatasetId);

  const createDatasetMutation = useCreateDataset();
  const deleteDatasetMutation = useDeleteDataset();
  const updateDatasetMutation = useUpdateDataset();
  const bulkInsertRowsMutation = useBulkInsertDatasetRows();
  const updateRowMutation = useUpdateDatasetRow();
  const deleteRowMutation = useDeleteDatasetRow();

  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId);

  // Auto-select first dataset
  if (!selectedDatasetId && datasets.length > 0 && !loadingDatasets) {
    setSelectedDatasetId(datasets[0].id);
  }

  // Generate chart suggestions from column analysis
  const chartSuggestions = useMemo((): ChartSuggestion[] => {
    if (!selectedDataset?.columns) return [];
    
    const suggestions: ChartSuggestion[] = [];
    const columns = selectedDataset.columns;
    
    // Find best columns for charts
    const categoricalColumns = columns.filter(c => c.isCategorical && c.uniqueValues >= 2);
    
    for (const col of categoricalColumns.slice(0, 2)) {
      if (col.uniqueValues <= 8) {
        suggestions.push({
          type: 'pie',
          column: col.name,
          title: `Distribuição por ${col.displayName}`,
          priority: col.priority,
          description: `${col.uniqueValues} categorias`,
        });
      } else {
        suggestions.push({
          type: col.uniqueValues > 10 ? 'horizontal-bar' : 'bar',
          column: col.name,
          title: `Top ${Math.min(col.uniqueValues, 10)} - ${col.displayName}`,
          priority: col.priority - 5,
          description: `${col.uniqueValues} valores únicos`,
        });
      }
    }
    
    return suggestions.slice(0, 4);
  }, [selectedDataset]);

  const handleImport = async (
    name: string,
    columns: ColumnAnalysis[],
    rowsData: Record<string, unknown>[],
    chartSuggestions: ChartSuggestion[]
  ) => {
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

  const handleEditDataset = (dataset: Dataset) => {
    setEditingDataset(dataset);
  };

  const handleSaveDataset = (updates: { name: string; description: string | null; columns: ColumnAnalysis[] }) => {
    if (!editingDataset) return;
    
    updateDatasetMutation.mutate(
      { id: editingDataset.id, updates },
      {
        onSuccess: () => {
          setEditingDataset(null);
        },
      }
    );
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
              onEdit={handleEditDataset}
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
                  O sistema analisa automaticamente a estrutura e gera dashboards personalizados.
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
                      {rows.length} registros • {selectedDataset.columns.length} campos
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditDataset(selectedDataset)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configurar
                    </Button>
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
                </div>

                {/* Stats */}
                {isLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-[100px] rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <SmartStats 
                    rows={rows} 
                    columns={selectedDataset.columns} 
                    datasetName={selectedDataset.name}
                  />
                )}

                {/* Charts */}
                {!isLoading && rows.length > 0 && chartSuggestions.length > 0 && (
                  <SmartCharts 
                    rows={rows} 
                    columns={selectedDataset.columns}
                    chartSuggestions={chartSuggestions}
                  />
                )}

                {/* Table */}
                {isLoading ? (
                  <Skeleton className="h-[400px] rounded-xl" />
                ) : (
                  <SmartDataTable
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

      {/* Edit Dataset Dialog */}
      <EditDatasetDialog
        open={!!editingDataset}
        onClose={() => setEditingDataset(null)}
        dataset={editingDataset}
        columns={editingDataset?.columns || []}
        onSave={handleSaveDataset}
        isLoading={updateDatasetMutation.isPending}
      />

      {/* Edit Row Dialog */}
      {selectedDataset && (
        <EditRowDialog
          open={!!editingRow}
          onClose={() => setEditingRow(null)}
          row={editingRow}
          columns={selectedDataset.columns.map(c => c.name)}
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
