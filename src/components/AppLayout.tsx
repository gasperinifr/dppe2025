import { useState, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarActionsProvider } from "@/contexts/SidebarActionsContext";
import { ImportDatasetDialog } from "@/components/dashboard/ImportDatasetDialog";
import { useAuth } from "@/hooks/useAuth";
import {
  useCreateDataset,
  useBulkInsertDatasetRows,
} from "@/hooks/useDatasets";
import { ColumnAnalysis, ChartSuggestion } from "@/lib/csvAnalyzer";

export function AppLayout() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [importOpen, setImportOpen] = useState(false);

  const createDatasetMutation = useCreateDataset();
  const bulkInsertRowsMutation = useBulkInsertDatasetRows();

  const openImport = useCallback(() => setImportOpen(true), []);

  const logout = useCallback(async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Erro ao sair");
    } else {
      navigate("/auth");
    }
  }, [signOut, navigate]);

  const handleImport = (
    name: string,
    columns: ColumnAnalysis[],
    rowsData: Record<string, unknown>[],
    _chartSuggestions: ChartSuggestion[]
  ) => {
    createDatasetMutation.mutate(
      { name, columns },
      {
        onSuccess: (newDataset) => {
          bulkInsertRowsMutation.mutate(
            { datasetId: newDataset.id, rows: rowsData },
            {
              onSuccess: () => {
                setImportOpen(false);
              },
            }
          );
        },
      }
    );
  };

  const isImporting =
    createDatasetMutation.isPending || bulkInsertRowsMutation.isPending;

  return (
    <SidebarActionsProvider value={{ openImport, logout }}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />

          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-12 flex items-center border-b border-border bg-background sticky top-0 z-30">
              <SidebarTrigger className="ml-2" />
            </header>

            <main className="flex-1 min-w-0">
              <Outlet />
            </main>
          </div>
        </div>

        <ImportDatasetDialog
          open={importOpen}
          onClose={() => setImportOpen(false)}
          onImport={handleImport}
          isLoading={isImporting}
        />
      </SidebarProvider>
    </SidebarActionsProvider>
  );
}
