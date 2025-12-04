-- Tabela de projetos de pesquisa DPPE 2025
CREATE TABLE public.projetos_pesquisa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT,
  campus TEXT NOT NULL,
  edital TEXT NOT NULL,
  titulo_projeto TEXT NOT NULL,
  areas_conhecimento TEXT,
  departamento TEXT,
  tipo TEXT DEFAULT 'INTERNO',
  situacao TEXT NOT NULL DEFAULT 'CADASTRO EM ANDAMENTO',
  data_cadastro DATE,
  coordenador TEXT NOT NULL,
  email TEXT,
  data_inicio DATE,
  data_termino DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (público para leitura, qualquer pessoa pode ver)
ALTER TABLE public.projetos_pesquisa ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública
CREATE POLICY "Projetos são públicos para visualização" 
ON public.projetos_pesquisa 
FOR SELECT 
USING (true);

-- Política para inserção pública (para facilitar importação)
CREATE POLICY "Permitir inserção" 
ON public.projetos_pesquisa 
FOR INSERT 
WITH CHECK (true);

-- Política para atualização pública
CREATE POLICY "Permitir atualização" 
ON public.projetos_pesquisa 
FOR UPDATE 
USING (true);

-- Política para deleção pública
CREATE POLICY "Permitir deleção" 
ON public.projetos_pesquisa 
FOR DELETE 
USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_projetos_pesquisa_updated_at
BEFORE UPDATE ON public.projetos_pesquisa
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();