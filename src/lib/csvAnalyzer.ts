/**
 * Intelligent CSV Analyzer
 * Automatically detects column types, cleans data, and suggests best visualizations
 */

export interface ColumnAnalysis {
  name: string;
  displayName: string;
  type: 'text' | 'number' | 'date' | 'category' | 'email' | 'url' | 'boolean';
  uniqueValues: number;
  nullCount: number;
  sampleValues: string[];
  isIdentifier: boolean;
  isCategorical: boolean;
  isNumeric: boolean;
  isDate: boolean;
  chartSuggestion: 'pie' | 'bar' | 'line' | 'none';
  priority: number; // Higher = more important for display
}

export interface CSVAnalysisResult {
  columns: ColumnAnalysis[];
  rows: Record<string, unknown>[];
  totalRows: number;
  cleanedRows: number;
  suggestedCharts: ChartSuggestion[];
  primaryColumn: string | null;
  titleColumn: string | null;
}

export interface ChartSuggestion {
  type: 'pie' | 'bar' | 'horizontal-bar' | 'line' | 'area';
  column: string;
  title: string;
  priority: number;
  description: string;
}

// Common delimiters to try
const DELIMITERS = [',', ';', '\t', '|'];

// Patterns for type detection
const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/[^\s]+$/,
  date: /^(\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}|\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})$/,
  dateISO: /^\d{4}-\d{2}-\d{2}/,
  number: /^-?\d+([.,]\d+)?$/,
  boolean: /^(true|false|sim|não|yes|no|s|n|1|0)$/i,
  identifier: /^(id|código|codigo|cod|key|uuid|matricula|matrícula|cpf|cnpj|registro)$/i,
  category: /^(status|situação|situacao|tipo|type|categoria|category|estado|fase|etapa|modalidade|nivel|nível|unidade|campus|departamento|área|area|setor)$/i,
  title: /^(titulo|título|title|nome|name|projeto|descrição|descricao|description|assunto|subject)$/i,
};

/**
 * Detect the best delimiter for a CSV content
 */
function detectDelimiter(content: string): string {
  const firstLines = content.split('\n').slice(0, 5).join('\n');
  
  let bestDelimiter = ',';
  let maxCount = 0;
  
  for (const delimiter of DELIMITERS) {
    const count = (firstLines.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delimiter;
    }
  }
  
  return bestDelimiter;
}

/**
 * Parse a CSV line handling quotes and escaped characters
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Clean a value, removing quotes and extra whitespace
 */
function cleanValue(value: string | undefined): string {
  if (!value) return '';
  return value
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detect the type of a column based on sample values
 */
function detectColumnType(values: string[]): ColumnAnalysis['type'] {
  const nonEmpty = values.filter(v => v && v.trim());
  if (nonEmpty.length === 0) return 'text';
  
  const sample = nonEmpty.slice(0, 100);
  
  // Check patterns
  let emailCount = 0;
  let urlCount = 0;
  let dateCount = 0;
  let numberCount = 0;
  let booleanCount = 0;
  
  for (const val of sample) {
    if (PATTERNS.email.test(val)) emailCount++;
    else if (PATTERNS.url.test(val)) urlCount++;
    else if (PATTERNS.date.test(val) || PATTERNS.dateISO.test(val)) dateCount++;
    else if (PATTERNS.number.test(val.replace(/\s/g, ''))) numberCount++;
    else if (PATTERNS.boolean.test(val)) booleanCount++;
  }
  
  const threshold = sample.length * 0.6;
  
  if (emailCount > threshold) return 'email';
  if (urlCount > threshold) return 'url';
  if (dateCount > threshold) return 'date';
  if (numberCount > threshold) return 'number';
  if (booleanCount > threshold) return 'boolean';
  
  // Check if categorical (limited unique values)
  const uniqueValues = new Set(sample);
  if (uniqueValues.size <= Math.min(20, sample.length * 0.3)) {
    return 'category';
  }
  
  return 'text';
}

/**
 * Determine chart suggestion based on column analysis
 */
function suggestChart(column: ColumnAnalysis, totalRows: number): 'pie' | 'bar' | 'line' | 'none' {
  if (column.isIdentifier || column.type === 'email' || column.type === 'url') {
    return 'none';
  }
  
  if (column.isCategorical && column.uniqueValues <= 8) {
    return 'pie';
  }
  
  if (column.isCategorical && column.uniqueValues <= 20) {
    return 'bar';
  }
  
  if (column.type === 'date' || (column.type === 'number' && column.uniqueValues > 10)) {
    return 'line';
  }
  
  return 'none';
}

/**
 * Calculate priority for display (higher = more important)
 */
function calculatePriority(columnName: string, type: ColumnAnalysis['type'], uniqueValues: number): number {
  const lowerName = columnName.toLowerCase();
  let priority = 50;
  
  // Title/Name columns are very important
  if (PATTERNS.title.test(lowerName)) priority += 40;
  
  // Category columns are good for grouping
  if (PATTERNS.category.test(lowerName)) priority += 30;
  
  // Dates are useful
  if (type === 'date' || lowerName.includes('data') || lowerName.includes('date')) priority += 20;
  
  // Identifiers are less important for display
  if (PATTERNS.identifier.test(lowerName)) priority -= 30;
  
  // Emails/URLs are less important
  if (type === 'email' || type === 'url') priority -= 20;
  
  // Columns with moderate unique values are more interesting
  if (uniqueValues > 2 && uniqueValues <= 15) priority += 15;
  
  return priority;
}

/**
 * Create a display-friendly name from a column name
 */
function createDisplayName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Main CSV analysis function
 */
export function analyzeCSV(content: string): CSVAnalysisResult {
  const delimiter = detectDelimiter(content);
  const lines = content.split(/\r?\n/);
  
  // Find header row (skip empty lines at start)
  let headerIndex = 0;
  while (headerIndex < lines.length && !lines[headerIndex].trim()) {
    headerIndex++;
  }
  
  if (headerIndex >= lines.length) {
    throw new Error('Arquivo CSV vazio ou inválido');
  }
  
  // Parse header
  const headerLine = lines[headerIndex];
  const rawColumns = parseCSVLine(headerLine, delimiter).map(cleanValue);
  
  // Filter out empty column names and create unique names
  const columnNames: string[] = [];
  const columnMap = new Map<string, number>();
  
  for (const col of rawColumns) {
    if (!col) continue;
    
    let name = col;
    const count = columnMap.get(col) || 0;
    if (count > 0) {
      name = `${col}_${count}`;
    }
    columnMap.set(col, count + 1);
    columnNames.push(name);
  }
  
  // Parse data rows
  const rows: Record<string, unknown>[] = [];
  const columnValues: Map<string, string[]> = new Map();
  
  for (const colName of columnNames) {
    columnValues.set(colName, []);
  }
  
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line, delimiter);
    
    // Skip rows that are completely empty or have significantly fewer values
    const nonEmptyValues = values.filter(v => v && v.trim()).length;
    if (nonEmptyValues === 0) continue;
    if (nonEmptyValues < columnNames.length * 0.3) continue;
    
    const row: Record<string, unknown> = {};
    let hasValidData = false;
    
    for (let j = 0; j < columnNames.length; j++) {
      const colName = columnNames[j];
      const value = cleanValue(values[j]);
      
      row[colName] = value || null;
      
      if (value) {
        hasValidData = true;
        columnValues.get(colName)?.push(value);
      }
    }
    
    if (hasValidData) {
      rows.push(row);
    }
  }
  
  // Analyze each column
  const columnAnalyses: ColumnAnalysis[] = [];
  
  for (const colName of columnNames) {
    const values = columnValues.get(colName) || [];
    const type = detectColumnType(values);
    const uniqueValues = new Set(values).size;
    const nullCount = rows.length - values.length;
    
    const lowerName = colName.toLowerCase();
    const isIdentifier = PATTERNS.identifier.test(lowerName);
    const isCategorical = PATTERNS.category.test(lowerName) || type === 'category' || (uniqueValues > 1 && uniqueValues <= 30);
    const isNumeric = type === 'number';
    const isDate = type === 'date' || lowerName.includes('data') || lowerName.includes('date');
    
    const analysis: ColumnAnalysis = {
      name: colName,
      displayName: createDisplayName(colName),
      type,
      uniqueValues,
      nullCount,
      sampleValues: [...new Set(values)].slice(0, 10),
      isIdentifier,
      isCategorical,
      isNumeric,
      isDate,
      chartSuggestion: 'none',
      priority: calculatePriority(colName, type, uniqueValues),
    };
    
    analysis.chartSuggestion = suggestChart(analysis, rows.length);
    columnAnalyses.push(analysis);
  }
  
  // Sort by priority
  columnAnalyses.sort((a, b) => b.priority - a.priority);
  
  // Generate chart suggestions
  const suggestedCharts: ChartSuggestion[] = [];
  
  // Find best columns for each chart type
  const pieColumns = columnAnalyses
    .filter(c => c.chartSuggestion === 'pie' && c.uniqueValues >= 2)
    .slice(0, 2);
  
  const barColumns = columnAnalyses
    .filter(c => (c.chartSuggestion === 'bar' || (c.isCategorical && c.uniqueValues > 3)) && c.uniqueValues >= 2)
    .slice(0, 2);
  
  for (const col of pieColumns) {
    suggestedCharts.push({
      type: 'pie',
      column: col.name,
      title: `Distribuição por ${col.displayName}`,
      priority: col.priority,
      description: `${col.uniqueValues} categorias únicas`,
    });
  }
  
  for (const col of barColumns) {
    suggestedCharts.push({
      type: col.uniqueValues > 10 ? 'horizontal-bar' : 'bar',
      column: col.name,
      title: `Top ${Math.min(col.uniqueValues, 10)} - ${col.displayName}`,
      priority: col.priority - 5,
      description: `${col.uniqueValues} valores únicos`,
    });
  }
  
  // Sort chart suggestions by priority
  suggestedCharts.sort((a, b) => b.priority - a.priority);
  
  // Find primary (identifier) and title columns
  const primaryColumn = columnAnalyses.find(c => c.isIdentifier)?.name || null;
  const titleColumn = columnAnalyses.find(c => PATTERNS.title.test(c.name.toLowerCase()))?.name || 
    columnAnalyses.find(c => c.type === 'text' && !c.isIdentifier && c.uniqueValues > rows.length * 0.5)?.name || 
    null;
  
  return {
    columns: columnAnalyses,
    rows,
    totalRows: lines.length - headerIndex - 1,
    cleanedRows: rows.length,
    suggestedCharts: suggestedCharts.slice(0, 4),
    primaryColumn,
    titleColumn,
  };
}

/**
 * Get display columns sorted by priority
 */
export function getDisplayColumns(columns: ColumnAnalysis[], maxColumns: number = 6): ColumnAnalysis[] {
  return columns
    .filter(c => !c.isIdentifier || columns.length <= maxColumns)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxColumns);
}
