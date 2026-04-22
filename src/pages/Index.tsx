import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DatasetSelector } from "@/components/dashboard/DatasetSelector";
import { SmartStats } from "@/components/dashboard/SmartStats";
import { SmartCharts } from "@/components/dashboard/SmartCharts";
import { SmartDataTable } from "@/components/dashboard/SmartDataTable";
import { EditRowDialog } from "@/components/dashboard/EditRowDialog";
import { EditDatasetDialog } from "@/components/dashboard/EditDatasetDialog";
import { DeleteConfirmDialog } from "@/components/dashboard/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useSidebarActions } from "@/contexts/SidebarActionsContext";
import {
  useDatasets,
  useDatasetRows,
  useDeleteDataset,
  useUpdateDataset,
  useUpdateDatasetRow,
  useDeleteDatasetRow,
} from "@/hooks/useDatasets";
import { Dataset, DatasetRow, ChartConfig, StatsConfig } from "@/types/dataset";
import { ColumnAnalysis, ChartSuggestion } from "@/lib/csvAnalyzer";

export default function Index() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { openImport } = useSidebarActions();
  
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<DatasetRow | null>(null);
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
  const [deleteRowId, setDeleteRowId] = useState<string | null>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const { data: datasets = [], isLoading: loadingDatasets } = useDatasets();
  const { data: rows = [], isLoading: loadingRows } = useDatasetRows(selectedDatasetId);

  const deleteDatasetMutation = useDeleteDataset();
  const updateDatasetMutation = useUpdateDataset();
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

  const handleSaveDataset = (updates: { 
    name: string; 
    description: string | null; 
    columns: ColumnAnalysis[];
    chartConfigs?: ChartConfig[];
    statsConfigs?: StatsConfig[];
  }) => {
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

  const handleExportCSV = (dataset: Dataset) => {
    const datasetRows = rows.filter(r => r.dataset_id === dataset.id);
    if (datasetRows.length === 0 && dataset.id !== selectedDatasetId) {
      toast.error("Selecione o dataset antes de exportar");
      return;
    }
    
    const exportRows = dataset.id === selectedDatasetId ? rows : datasetRows;
    const columnNames = dataset.columns.map(c => c.name);
    
    // Create CSV content
    const header = columnNames.join(",");
    const csvRows = exportRows.map(row => 
      columnNames.map(col => {
        const val = row.row_data[col];
        const strVal = val === null || val === undefined ? "" : String(val);
        // Escape quotes and wrap in quotes if contains comma
        if (strVal.includes(",") || strVal.includes('"') || strVal.includes("\n")) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(",")
    );
    
    const csvContent = [header, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${dataset.name.replace(/[^a-z0-9]/gi, "_")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado com sucesso!");
  };

  const handleUpdateStats = (configs: StatsConfig[]) => {
    if (!selectedDataset) return;
    updateDatasetMutation.mutate({
      id: selectedDataset.id,
      updates: { statsConfigs: configs },
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

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, don't render (redirect will happen via useEffect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full max-w-[1600px] mx-auto px-4 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Dataset Selector */}
          <aside className="lg:w-[280px] lg:shrink-0">
            <DatasetSelector
              datasets={datasets}
              selectedId={selectedDatasetId}
              onSelect={setSelectedDatasetId}
              onNew={openImport}
              onEdit={handleEditDataset}
              onExport={handleExportCSV}
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-8">
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
                <Button onClick={openImport}>
                  Importar CSV
                </Button>
              </div>
            ) : (
              <>
                {/* Title + Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-display font-semibold text-foreground truncate" title={selectedDataset.name}>
                      {selectedDataset.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {rows.length} registros • {selectedDataset.columns.length} campos
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0"
                    onClick={() => handleEditDataset(selectedDataset)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configurar
                  </Button>
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
                    statsConfigs={selectedDataset.statsConfigs}
                    onUpdateStats={handleUpdateStats}
                  />
                )}

                {/* Charts */}
                {!isLoading && rows.length > 0 && (chartSuggestions.length > 0 || selectedDataset.chartConfigs?.length) && (
                  <SmartCharts 
                    rows={rows} 
                    columns={selectedDataset.columns}
                    chartSuggestions={chartSuggestions}
                    chartConfigs={selectedDataset.chartConfigs}
                    chartValueOverrides={selectedDataset.chartValueOverrides}
                    onUpdateChartValues={(columnName, values) => {
                      const newOverrides = {
                        ...(selectedDataset.chartValueOverrides || {}),
                        [columnName]: values,
                      };
                      updateDatasetMutation.mutate({
                        id: selectedDataset.id,
                        updates: { chartValueOverrides: newOverrides },
                      });
                    }}
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

      {/* Edit Dataset Dialog */}
      <EditDatasetDialog
        open={!!editingDataset}
        onClose={() => setEditingDataset(null)}
        dataset={editingDataset}
        columns={editingDataset?.columns || []}
        onSave={handleSaveDataset}
        onDelete={handleDeleteDataset}
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
