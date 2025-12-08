-- Add NOT NULL constraints to user_id columns
ALTER TABLE datasets ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE dataset_rows ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE projetos_pesquisa ALTER COLUMN user_id SET NOT NULL;