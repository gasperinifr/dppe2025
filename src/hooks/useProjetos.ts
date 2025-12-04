import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Projeto, ProjetoInsert } from "@/types/projeto";
import { toast } from "sonner";

export function useProjetos() {
  return useQuery({
    queryKey: ["projetos"],
    queryFn: async (): Promise<Projeto[]> => {
      const { data, error } = await supabase
        .from("projetos_pesquisa")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data as Projeto[];
    },
  });
}

export function useCreateProjeto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projeto: ProjetoInsert) => {
      const { data, error } = await supabase
        .from("projetos_pesquisa")
        .insert(projeto)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projetos"] });
      toast.success("Projeto criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar projeto: " + error.message);
    },
  });
}

export function useUpdateProjeto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...projeto }: Partial<Projeto> & { id: string }) => {
      const { data, error } = await supabase
        .from("projetos_pesquisa")
        .update(projeto)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projetos"] });
      toast.success("Projeto atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar projeto: " + error.message);
    },
  });
}

export function useDeleteProjeto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("projetos_pesquisa")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projetos"] });
      toast.success("Projeto excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir projeto: " + error.message);
    },
  });
}

export function useBulkInsertProjetos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projetos: ProjetoInsert[]) => {
      const { data, error } = await supabase
        .from("projetos_pesquisa")
        .insert(projetos)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projetos"] });
      toast.success(`${data.length} projetos importados com sucesso!`);
    },
    onError: (error) => {
      toast.error("Erro ao importar projetos: " + error.message);
    },
  });
}
