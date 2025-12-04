export interface Projeto {
  id: string;
  codigo: string | null;
  campus: string;
  edital: string;
  titulo_projeto: string;
  areas_conhecimento: string | null;
  departamento: string | null;
  tipo: string | null;
  situacao: string;
  data_cadastro: string | null;
  coordenador: string;
  email: string | null;
  data_inicio: string | null;
  data_termino: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjetoInsert {
  codigo?: string | null;
  campus: string;
  edital: string;
  titulo_projeto: string;
  areas_conhecimento?: string | null;
  departamento?: string | null;
  tipo?: string | null;
  situacao?: string;
  data_cadastro?: string | null;
  coordenador: string;
  email?: string | null;
  data_inicio?: string | null;
  data_termino?: string | null;
}

export type SituacaoType = 
  | 'APROVADO' 
  | 'EM EXECUÇÃO' 
  | 'CADASTRO EM ANDAMENTO' 
  | 'REPROVADO' 
  | 'DESATIVADO';

export const SITUACAO_OPTIONS: SituacaoType[] = [
  'APROVADO',
  'EM EXECUÇÃO',
  'CADASTRO EM ANDAMENTO',
  'REPROVADO',
  'DESATIVADO'
];

export const SITUACAO_COLORS: Record<string, string> = {
  'APROVADO': 'bg-status-approved text-white',
  'EM EXECUÇÃO': 'bg-status-executing text-white',
  'CADASTRO EM ANDAMENTO': 'bg-status-pending text-warning-foreground',
  'REPROVADO': 'bg-status-rejected text-white',
  'DESATIVADO': 'bg-status-disabled text-white',
};
