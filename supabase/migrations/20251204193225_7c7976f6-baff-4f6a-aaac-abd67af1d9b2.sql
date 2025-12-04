-- Create datasets table for storing multiple CSV imports
CREATE TABLE public.datasets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dataset_rows table for storing the actual data
CREATE TABLE public.dataset_rows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  row_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_dataset_rows_dataset_id ON public.dataset_rows(dataset_id);

-- Enable RLS
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_rows ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Datasets são públicos para visualização" 
ON public.datasets FOR SELECT USING (true);

CREATE POLICY "Dataset rows são públicos para visualização" 
ON public.dataset_rows FOR SELECT USING (true);

-- Public write access (can be restricted later with auth)
CREATE POLICY "Permitir inserção datasets" 
ON public.datasets FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização datasets" 
ON public.datasets FOR UPDATE USING (true);

CREATE POLICY "Permitir deleção datasets" 
ON public.datasets FOR DELETE USING (true);

CREATE POLICY "Permitir inserção dataset_rows" 
ON public.dataset_rows FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização dataset_rows" 
ON public.dataset_rows FOR UPDATE USING (true);

CREATE POLICY "Permitir deleção dataset_rows" 
ON public.dataset_rows FOR DELETE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_datasets_updated_at
BEFORE UPDATE ON public.datasets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();