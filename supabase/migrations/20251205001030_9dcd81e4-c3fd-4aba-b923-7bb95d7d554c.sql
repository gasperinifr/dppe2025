-- Add user_id columns to all tables for data ownership
ALTER TABLE public.datasets 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.dataset_rows 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.projetos_pesquisa 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing records to have a default user_id (will be NULL for existing data)
-- New records will require user_id

-- Drop existing permissive policies on datasets
DROP POLICY IF EXISTS "Authenticated users can view datasets" ON public.datasets;
DROP POLICY IF EXISTS "Authenticated users can insert datasets" ON public.datasets;
DROP POLICY IF EXISTS "Authenticated users can update datasets" ON public.datasets;
DROP POLICY IF EXISTS "Authenticated users can delete datasets" ON public.datasets;

-- Create new RLS policies for datasets based on ownership
CREATE POLICY "Users can view their own datasets" 
ON public.datasets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own datasets" 
ON public.datasets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own datasets" 
ON public.datasets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own datasets" 
ON public.datasets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Drop existing permissive policies on dataset_rows
DROP POLICY IF EXISTS "Authenticated users can view dataset_rows" ON public.dataset_rows;
DROP POLICY IF EXISTS "Authenticated users can insert dataset_rows" ON public.dataset_rows;
DROP POLICY IF EXISTS "Authenticated users can update dataset_rows" ON public.dataset_rows;
DROP POLICY IF EXISTS "Authenticated users can delete dataset_rows" ON public.dataset_rows;

-- Create new RLS policies for dataset_rows based on ownership
CREATE POLICY "Users can view their own dataset_rows" 
ON public.dataset_rows 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dataset_rows" 
ON public.dataset_rows 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dataset_rows" 
ON public.dataset_rows 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dataset_rows" 
ON public.dataset_rows 
FOR DELETE 
USING (auth.uid() = user_id);

-- Drop existing permissive policies on projetos_pesquisa
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projetos_pesquisa;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON public.projetos_pesquisa;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON public.projetos_pesquisa;
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON public.projetos_pesquisa;

-- Create new RLS policies for projetos_pesquisa based on ownership
CREATE POLICY "Users can view their own projects" 
ON public.projetos_pesquisa 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" 
ON public.projetos_pesquisa 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON public.projetos_pesquisa 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON public.projetos_pesquisa 
FOR DELETE 
USING (auth.uid() = user_id);