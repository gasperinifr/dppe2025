/**
 * Intelligent CSV Analyzer - HANDLES MULTI-LINE VALUES
 * Captures ALL rows and columns, handles quoted multi-line fields
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
  priority: number;
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
  type: 'pie' | 'bar' | 'horizontal-bar' | 'line' | 'area' | 'table';
  column: string;
  title: string;
  priority: number;
  description: string;
}

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
 * Detect the best delimiter by analyzing the first line only
 */
function detectDelimiter(firstLine: string): string {
  const delimiters = [',', ';', '\t', '|'];
  
  let bestDelimiter = ',';
  let maxCount = 0;
  
  for (const delim of delimiters) {
    let count = 0;
    let inQuotes = false;
    
    for (let i = 0; i < firstLine.length; i++) {
      if (firstLine[i] === '"') inQuotes = !inQuotes;
      else if (firstLine[i] === delim && !inQuotes) count++;
    }
    
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delim;
    }
  }
  
  return bestDelimiter;
}

/**
 * Parse CSV content handling multi-line quoted values
 * This is the KEY function - it properly handles fields that span multiple lines
 */
function parseCSVContent(content: string, delimiter: string): string[][] {
  const records: string[][] = [];
  let currentRecord: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;
  
  // Normalize line endings
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  while (i < normalized.length) {
    const char = normalized[i];
    const nextChar = normalized[i + 1];
    
    if (char === '"') {
      if (inQuotes) {
        if (nextChar === '"') {
          // Escaped quote - add single quote and skip next
          currentField += '"';
          i += 2;
          continue;
        } else {
          // End of quoted field
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        // Start of quoted field
        inQuotes = true;
        i++;
        continue;
      }
    }
    
    if (char === delimiter && !inQuotes) {
      // End of field
      currentRecord.push(cleanValue(currentField));
      currentField = '';
      i++;
      continue;
    }
    
    if (char === '\n' && !inQuotes) {
      // End of record
      currentRecord.push(cleanValue(currentField));
      currentField = '';
      
      // Only add non-empty records
      if (currentRecord.some(f => f && f.trim())) {
        records.push(currentRecord);
      }
      currentRecord = [];
      i++;
      continue;
    }
    
    // Regular character (including newlines inside quotes)
    currentField += char;
    i++;
  }
  
  // Don't forget the last field and record
  if (currentField || currentRecord.length > 0) {
    currentRecord.push(cleanValue(currentField));
    if (currentRecord.some(f => f && f.trim())) {
      records.push(currentRecord);
    }
  }
  
  return records;
}

/**
 * Clean and normalize a cell value
 */
function cleanValue(value: string): string {
  if (!value) return '';
  
  let cleaned = value.trim();
  
  // Replace internal newlines with space
  cleaned = cleaned.replace(/\n/g, ' ');
  
  // Remove surrounding quotes
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  
  // Normalize escaped quotes and whitespace
  cleaned = cleaned.replace(/""/g, '"').replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Detect the type of a column based on its values
 */
function detectColumnType(values: string[]): ColumnAnalysis['type'] {
  const nonEmpty = values.filter(v => v && v.trim() && v !== '-');
  if (nonEmpty.length === 0) return 'text';
  
  const sample = nonEmpty.slice(0, 100);
  
  let emailCount = 0, urlCount = 0, dateCount = 0, numberCount = 0, booleanCount = 0;
  
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
  
  const uniqueValues = new Set(sample);
  if (uniqueValues.size <= Math.min(30, sample.length * 0.5)) {
    return 'category';
  }
  
  return 'text';
}

/**
 * Suggest chart type for a column
 */
function suggestChart(column: ColumnAnalysis): 'pie' | 'bar' | 'line' | 'none' {
  if (column.isIdentifier || column.type === 'email' || column.type === 'url') {
    return 'none';
  }
  
  if (column.isCategorical && column.uniqueValues <= 8) return 'pie';
  if (column.isCategorical && column.uniqueValues <= 20) return 'bar';
  if (column.type === 'date' || (column.type === 'number' && column.uniqueValues > 10)) {
    return 'line';
  }
  
  return 'none';
}

/**
 * Calculate display priority
 */
function calculatePriority(name: string, type: ColumnAnalysis['type'], uniqueValues: number): number {
  const lowerName = name.toLowerCase();
  let priority = 50;
  
  if (PATTERNS.title.test(lowerName)) priority += 40;
  if (PATTERNS.category.test(lowerName)) priority += 30;
  if (type === 'date' || lowerName.includes('data')) priority += 20;
  if (PATTERNS.identifier.test(lowerName)) priority -= 30;
  if (type === 'email' || type === 'url') priority -= 20;
  if (uniqueValues > 2 && uniqueValues <= 15) priority += 15;
  
  return priority;
}

/**
 * Create display name from column header
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
 * MAIN CSV ANALYSIS - Handles multi-line quoted values properly
 */
export function analyzeCSV(content: string): CSVAnalysisResult {
  if (!content || !content.trim()) {
    throw new Error('Arquivo CSV vazio');
  }
  
  // Get first line to detect delimiter
  const firstNewline = content.indexOf('\n');
  const firstLine = firstNewline > 0 ? content.substring(0, firstNewline) : content;
  const delimiter = detectDelimiter(firstLine);
  
  console.log(`CSV Analyzer: delimiter = '${delimiter}'`);
  
  // Parse entire CSV handling multi-line values
  const records = parseCSVContent(content, delimiter);
  
  if (records.length === 0) {
    throw new Error('Nenhum registro encontrado no CSV');
  }
  
  console.log(`CSV Analyzer: ${records.length} records parsed`);
  
  // First record is header
  const rawHeaders = records[0];
  
  // Create unique column names
  const columnNames: string[] = [];
  const nameCount: Record<string, number> = {};
  
  for (let i = 0; i < rawHeaders.length; i++) {
    let name = rawHeaders[i] || `Coluna_${i + 1}`;
    
    if (nameCount[name]) {
      nameCount[name]++;
      name = `${name}_${nameCount[name]}`;
    } else {
      nameCount[name] = 1;
    }
    
    columnNames.push(name);
  }
  
  console.log(`CSV Analyzer: columns = ${columnNames.join(', ')}`);
  
  // Process data rows
  const rows: Record<string, unknown>[] = [];
  const columnValues: Map<string, string[]> = new Map();
  
  columnNames.forEach(col => columnValues.set(col, []));
  
  for (let i = 1; i < records.length; i++) {
    const record = records[i];
    const row: Record<string, unknown> = {};
    let hasData = false;
    
    // Map values to columns
    for (let j = 0; j < columnNames.length; j++) {
      const colName = columnNames[j];
      const value = j < record.length ? record[j] : '';
      
      row[colName] = value || null;
      
      if (value && value !== '-') {
        hasData = true;
        columnValues.get(colName)?.push(value);
      }
    }
    
    // Handle extra columns
    for (let j = columnNames.length; j < record.length; j++) {
      const value = record[j];
      if (value && value !== '-') {
        const extraCol = `Extra_${j + 1}`;
        row[extraCol] = value;
        hasData = true;
      }
    }
    
    if (hasData) {
      rows.push(row);
    }
  }
  
  console.log(`CSV Analyzer: ${rows.length} data rows with content`);
  
  // Analyze columns
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
    
    analysis.chartSuggestion = suggestChart(analysis);
    columnAnalyses.push(analysis);
  }
  
  // Sort by priority
  columnAnalyses.sort((a, b) => b.priority - a.priority);
  
  // Generate chart suggestions
  const suggestedCharts: ChartSuggestion[] = [];
  
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
      description: `${col.uniqueValues} categorias`,
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
  
  suggestedCharts.sort((a, b) => b.priority - a.priority);
  
  // Find special columns
  const primaryColumn = columnAnalyses.find(c => c.isIdentifier)?.name || null;
  const titleColumn = columnAnalyses.find(c => PATTERNS.title.test(c.name.toLowerCase()))?.name ||
    columnAnalyses.find(c => c.type === 'text' && !c.isIdentifier && c.uniqueValues > rows.length * 0.5)?.name ||
    null;
  
  return {
    columns: columnAnalyses,
    rows,
    totalRows: records.length - 1,
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