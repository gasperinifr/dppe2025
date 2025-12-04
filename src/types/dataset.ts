import { ColumnAnalysis, ChartSuggestion } from "@/lib/csvAnalyzer";

export interface ChartConfig {
  column: string;
  type: 'pie' | 'bar' | 'horizontal-bar' | 'area' | 'line' | 'auto';
  enabled: boolean;
  title: string;
}

export interface Dataset {
  id: string;
  name: string;
  description: string | null;
  columns: ColumnAnalysis[];
  chartConfigs?: ChartConfig[];
  chartValueOverrides?: Record<string, Record<string, number>>;
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
  chartConfigs?: ChartConfig[];
}

export interface DatasetUpdate {
  name?: string;
  description?: string | null;
  columns?: ColumnAnalysis[];
  chartConfigs?: ChartConfig[];
  chartValueOverrides?: Record<string, Record<string, number>>;
}

export interface DatasetRowInsert {
  dataset_id: string;
  row_data: Record<string, unknown>;
}
