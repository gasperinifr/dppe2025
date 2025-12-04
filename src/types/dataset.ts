import { ColumnAnalysis, ChartSuggestion } from "@/lib/csvAnalyzer";

export interface Dataset {
  id: string;
  name: string;
  description: string | null;
  columns: ColumnAnalysis[];
  created_at: string;
  updated_at: string;
}

export interface DatasetRow {
  id: string;
  dataset_id: string;
  row_data: Record<string, unknown>;
  created_at: string;
}

export interface DatasetInsert {
  name: string;
  description?: string | null;
  columns: ColumnAnalysis[];
}

export interface DatasetUpdate {
  name?: string;
  description?: string | null;
  columns?: ColumnAnalysis[];
}

export interface DatasetRowInsert {
  dataset_id: string;
  row_data: Record<string, unknown>;
}
