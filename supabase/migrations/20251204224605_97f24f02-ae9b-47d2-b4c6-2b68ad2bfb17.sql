-- Update RLS policies for projetos_pesquisa to require authentication
DROP POLICY IF EXISTS "Projetos são públicos para visualização" ON public.projetos_pesquisa;
DROP POLICY IF EXISTS "Permitir inserção" ON public.projetos_pesquisa;
DROP POLICY IF EXISTS "Permitir atualização" ON public.projetos_pesquisa;
DROP POLICY IF EXISTS "Permitir deleção" ON public.projetos_pesquisa;

CREATE POLICY "Authenticated users can view projects"
ON public.projetos_pesquisa FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert projects"
ON public.projetos_pesquisa FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects"
ON public.projetos_pesquisa FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete projects"
ON public.projetos_pesquisa FOR DELETE
TO authenticated
USING (true);

-- Update RLS policies for datasets to require authentication
DROP POLICY IF EXISTS "Datasets são públicos para visualização" ON public.datasets;
DROP POLICY IF EXISTS "Permitir inserção datasets" ON public.datasets;
DROP POLICY IF EXISTS "Permitir atualização datasets" ON public.datasets;
DROP POLICY IF EXISTS "Permitir deleção datasets" ON public.datasets;

CREATE POLICY "Authenticated users can view datasets"
ON public.datasets FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert datasets"
ON public.datasets FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update datasets"
ON public.datasets FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete datasets"
ON public.datasets FOR DELETE
TO authenticated
USING (true);

-- Update RLS policies for dataset_rows to require authentication
DROP POLICY IF EXISTS "Dataset rows são públicos para visualização" ON public.dataset_rows;
DROP POLICY IF EXISTS "Permitir inserção dataset_rows" ON public.dataset_rows;
DROP POLICY IF EXISTS "Permitir atualização dataset_rows" ON public.dataset_rows;
DROP POLICY IF EXISTS "Permitir deleção dataset_rows" ON public.dataset_rows;

CREATE POLICY "Authenticated users can view dataset_rows"
ON public.dataset_rows FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert dataset_rows"
ON public.dataset_rows FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update dataset_rows"
ON public.dataset_rows FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete dataset_rows"
ON public.dataset_rows FOR DELETE
TO authenticated
USING (true);