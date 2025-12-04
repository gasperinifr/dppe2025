import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dataset, DatasetRow, DatasetInsert, DatasetUpdate, ChartConfig } from "@/types/dataset";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";
import { ColumnAnalysis } from "@/lib/csvAnalyzer";

// Helper to convert DB columns to ColumnAnalysis with chartConfigs
function parseColumnsData(columns: Json): { columns: ColumnAnalysis[]; chartConfigs?: ChartConfig[] } {
  if (Array.isArray(columns)) {
    // Check if it's the new format with chartConfigs
    const firstItem = columns[0];
    if (firstItem && typeof firstItem === 'object' && firstItem !== null) {
      const obj = firstItem as Record<string, unknown>;
      if ('columns' in obj) {
        return {
          columns: (obj.columns as ColumnAnalysis[]) || [],
          chartConfigs: obj.chartConfigs as ChartConfig[] | undefined,
        };
      }
    }
    // Legacy format - just columns array
    return { columns: columns as unknown as ColumnAnalysis[] };
  }
  return { columns: [] };
}

// Helper to convert DB data to Dataset
function toDataset(data: Record<string, unknown>): Dataset {
  const { columns, chartConfigs } = parseColumnsData(data.columns as Json);
  return {
    id: data.id as string,
    name: data.name as string,
    description: data.description as string | null,
    columns,
    chartConfigs,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

export function useDatasets() {
  return useQuery({
    queryKey: ["datasets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("datasets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(toDataset);
    },
  });
}

export function useDatasetRows(datasetId: string | null) {
  return useQuery({
    queryKey: ["dataset_rows", datasetId],
    queryFn: async () => {
      if (!datasetId) return [];
      
      const { data, error } = await supabase
        .from("dataset_rows")
        .select("*")
        .eq("dataset_id", datasetId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as DatasetRow[];
    },
    enabled: !!datasetId,
  });
}

export function useCreateDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dataset: DatasetInsert) => {
      // Store columns and chartConfigs together
      const columnsData = [{
        columns: dataset.columns,
        chartConfigs: dataset.chartConfigs,
      }];
      
      const { data, error } = await supabase
        .from("datasets")
        .insert({ 
          name: dataset.name, 
          description: dataset.description,
          columns: columnsData as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;
      return toDataset(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      toast.success("Dataset criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar dataset: " + error.message);
    },
  });
}

export function useUpdateDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: DatasetUpdate }) => {
      const updateData: Record<string, unknown> = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      
      // Store columns and chartConfigs together
      if (updates.columns !== undefined || updates.chartConfigs !== undefined) {
        const columnsData = [{
          columns: updates.columns,
          chartConfigs: updates.chartConfigs,
        }];
        updateData.columns = columnsData as unknown as Json;
      }

      const { error } = await supabase
        .from("datasets")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      toast.success("Dataset atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar dataset: " + error.message);
    },
  });
}

export function useDeleteDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("datasets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      toast.success("Dataset excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir dataset: " + error.message);
    },
  });
}

export function useBulkInsertDatasetRows() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ datasetId, rows }: { datasetId: string; rows: Record<string, unknown>[] }) => {
      const rowsToInsert = rows.map((row_data) => ({
        dataset_id: datasetId,
        row_data: row_data as Json,
      }));

      // Insert in batches of 500
      const batchSize = 500;
      for (let i = 0; i < rowsToInsert.length; i += batchSize) {
        const batch = rowsToInsert.slice(i, i + batchSize);
        const { error } = await supabase.from("dataset_rows").insert(batch);
        if (error) throw error;
      }

      return rowsToInsert.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["dataset_rows"] });
      toast.success(`${count} registros importados com sucesso!`);
    },
    onError: (error) => {
      toast.error("Erro ao importar dados: " + error.message);
    },
  });
}

export function useUpdateDatasetRow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, row_data }: { id: string; row_data: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("dataset_rows")
        .update({ row_data: row_data as Json })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataset_rows"] });
      toast.success("Registro atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });
}

export function useDeleteDatasetRow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dataset_rows").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataset_rows"] });
      toast.success("Registro excluído!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });
}
