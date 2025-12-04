import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Projeto, ProjetoInsert, SITUACAO_OPTIONS } from "@/types/projeto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const projetoSchema = z.object({
  codigo: z.string().optional().nullable(),
  campus: z.string().min(1, "Campus é obrigatório"),
  edital: z.string().min(1, "Edital é obrigatório"),
  titulo_projeto: z.string().min(1, "Título é obrigatório"),
  areas_conhecimento: z.string().optional().nullable(),
  departamento: z.string().optional().nullable(),
  tipo: z.string().optional().nullable(),
  situacao: z.string().min(1, "Situação é obrigatória"),
  data_cadastro: z.string().optional().nullable(),
  coordenador: z.string().min(1, "Coordenador é obrigatório"),
  email: z.string().email("E-mail inválido").optional().nullable().or(z.literal("")),
  data_inicio: z.string().optional().nullable(),
  data_termino: z.string().optional().nullable(),
});

type ProjetoFormData = z.infer<typeof projetoSchema>;

interface ProjetoFormProps {
  open: boolean;
  onClose: () => void;
  projeto?: Projeto | null;
  onSubmit: (data: ProjetoInsert) => void;
  isLoading?: boolean;
}

export function ProjetoForm({
  open,
  onClose,
  projeto,
  onSubmit,
  isLoading,
}: ProjetoFormProps) {
  const form = useForm<ProjetoFormData>({
    resolver: zodResolver(projetoSchema),
    defaultValues: projeto
      ? {
          ...projeto,
          email: projeto.email || "",
        }
      : {
          codigo: "",
          campus: "CAMPUS FLORIANOPOLIS - FLN",
          edital: "",
          titulo_projeto: "",
          areas_conhecimento: "",
          departamento: "",
          tipo: "INTERNO",
          situacao: "CADASTRO EM ANDAMENTO",
          data_cadastro: new Date().toISOString().split("T")[0],
          coordenador: "",
          email: "",
          data_inicio: "",
          data_termino: "",
        },
  });

  const handleSubmit = (data: ProjetoFormData) => {
    const projeto: ProjetoInsert = {
      codigo: data.codigo || null,
      campus: data.campus,
      edital: data.edital,
      titulo_projeto: data.titulo_projeto,
      areas_conhecimento: data.areas_conhecimento || null,
      departamento: data.departamento || null,
      tipo: data.tipo || null,
      situacao: data.situacao,
      data_cadastro: data.data_cadastro || null,
      coordenador: data.coordenador,
      email: data.email || null,
      data_inicio: data.data_inicio || null,
      data_termino: data.data_termino || null,
    };
    onSubmit(projeto);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {projeto ? "Editar Projeto" : "Novo Projeto"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: PIFPL4311-2025" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="campus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Câmpus *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="titulo_projeto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Projeto *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Digite o título do projeto..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="edital"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Edital *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Edital nº 02/2025/PROPPI - PIBIC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="areas_conhecimento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Áreas de Conhecimento</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Grande Área: Engenharias&#10;Área: Engenharia Civil"
                      className="resize-none"
                      rows={2}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="departamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: DACC" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "INTERNO"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="INTERNO">INTERNO</SelectItem>
                        <SelectItem value="EXTERNO">EXTERNO</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="situacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Situação *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SITUACAO_OPTIONS.map((situacao) => (
                        <SelectItem key={situacao} value={situacao}>
                          {situacao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="coordenador"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coordenador *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="data_cadastro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Cadastro</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Início</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_termino"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Término</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {projeto ? "Salvar Alterações" : "Criar Projeto"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
