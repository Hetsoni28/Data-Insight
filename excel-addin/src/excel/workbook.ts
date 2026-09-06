/* global Excel */

export async function getDatasetId(): Promise<string | null> {
  if (typeof Excel === 'undefined') {
    return null; // No hardcoded dataset — user must pick their own via DatasetPicker
  }

  return Excel.run(async (context) => {
    const customProperties = context.workbook.properties.custom;
    const datasetIdProp = customProperties.getItemOrNullObject('data_insight_dataset_id');
    customProperties.load('items');
    await context.sync();

    if (datasetIdProp.isNullObject) {
      return null;
    }
    datasetIdProp.load('value');
    await context.sync();
    return datasetIdProp.value as string;
  });
}

export async function setDatasetId(datasetId: string): Promise<void> {
  return Excel.run(async (context) => {
    const customProperties = context.workbook.properties.custom;
    // Idempotent: check if property already exists before adding
    const existing = customProperties.getItemOrNullObject('data_insight_dataset_id');
    await context.sync();
    if (existing.isNullObject) {
      customProperties.add('data_insight_dataset_id', datasetId);
    } else {
      existing.load('value');
      await context.sync();
      existing.value = datasetId;
    }
    await context.sync();
  });
}

export async function unlinkDataset(): Promise<void> {
  if (typeof Excel === 'undefined') return;
  return Excel.run(async (context) => {
    const customProperties = context.workbook.properties.custom;
    const existing = customProperties.getItemOrNullObject('data_insight_dataset_id');
    await context.sync();
    if (!existing.isNullObject) {
      existing.delete();
      await context.sync();
    }
  });
}

/**
 * Detect column data types by sampling the first 10 data rows.
 * Returns: 'numeric' | 'date' | 'boolean' | 'text'
 */
function detectColumnTypes(headerRow: any[], dataRows: any[][]): string[] {
  return headerRow.map((_, colIdx) => {
    const vals = dataRows.map(row => row[colIdx]).filter(v => v !== null && v !== undefined && v !== '');
    if (vals.length === 0) return 'text';
    const numericCount = vals.filter(v => typeof v === 'number').length;
    const boolCount = vals.filter(v => typeof v === 'boolean').length;
    // Excel date serials are numbers > 1 that were formatted as dates
    if (numericCount / vals.length > 0.8) {
      // Heuristic: if all numbers are in date serial range (1900-2200), could be date
      const avg = vals.reduce((a: number, b: any) => a + (typeof b === 'number' ? b : 0), 0) / vals.length;
      return 'numeric';
    }
    if (boolCount / vals.length > 0.8) return 'boolean';
    return 'text';
  });
}

export async function getWorkbookContext() {
  if (typeof Excel === 'undefined') {
    return {
      sheetNames: ['Sheet1'],
      activeSheetName: 'Sheet1',
      rowCount: 100,
      columnCount: 4,
      columnHeaders: ['ID', 'Date', 'Amount', 'Category'],
      columnTypes: ['numeric', 'date', 'numeric', 'text'],
      usedRangeAddress: 'A1:D100',
      sampleRows: [[1, '2024-01-01', 500, 'Marketing']],
    };
  }

  return Excel.run(async (context) => {
    const worksheets = context.workbook.worksheets;
    worksheets.load('items/name');
    const activeWorksheet = worksheets.getActiveWorksheet();
    activeWorksheet.load('name');

    const usedRange = activeWorksheet.getUsedRangeOrNullObject();
    usedRange.load(['rowCount', 'columnCount', 'address']);
    await context.sync();

    let columnHeaders: string[] = [];
    let columnTypes: string[] = [];
    let sampleRows: any[][] = [];
    let usedRangeAddress = '';
    let rowCount = 0;
    let columnCount = 0;

    if (!usedRange.isNullObject && usedRange.rowCount > 0) {
      rowCount = usedRange.rowCount;
      columnCount = usedRange.columnCount;
      usedRangeAddress = usedRange.address;

      // Load header row
      const headerRange = usedRange.getRow(0);
      headerRange.load('values');

      // Load sample data (first 10 data rows)
      const sampleEnd = Math.min(10, usedRange.rowCount - 1);
      let sampleRange: Excel.Range | null = null;
      if (sampleEnd > 0) {
        sampleRange = usedRange.getRowsBelow(sampleEnd);
        if (sampleRange) sampleRange.load('values');
      }

      await context.sync();

      columnHeaders = headerRange.values[0].map(v => String(v || ''));
      if (sampleRange) {
        sampleRows = sampleRange.values.slice(0, 10);
        columnTypes = detectColumnTypes(headerRange.values[0], sampleRows);
      } else {
        columnTypes = columnHeaders.map(() => 'text');
      }
    }

    return {
      sheetNames: worksheets.items.map(sheet => sheet.name),
      activeSheetName: activeWorksheet.name,
      rowCount,
      columnCount,
      columnHeaders,
      columnTypes,
      usedRangeAddress,
      sampleRows: sampleRows.slice(0, 5),
    };
  });
}

export async function getSelectedRange() {
  if (typeof Excel === 'undefined') {
    return {
      address: 'Sheet1!A1:D5',
      headers: ['ID', 'Date', 'Amount', 'Category'],
      rows: [
        [1, '2024-01-01', 500, 'Marketing'],
        [2, '2024-01-02', 300, 'Sales']
      ]
    };
  }

  return Excel.run(async (context) => {
    const range = context.workbook.getSelectedRange();
    range.load(['address', 'values', 'rowCount', 'columnCount']);
    await context.sync();

    // If selection is only 1 cell or the user selected the whole sheet, 
    // fall back to used range
    if (range.rowCount <= 1 && range.columnCount <= 1) {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const usedRange = sheet.getUsedRangeOrNullObject();
      usedRange.load(['address', 'values', 'rowCount', 'columnCount']);
      await context.sync();
      if (!usedRange.isNullObject && usedRange.rowCount > 1) {
        const limited = usedRange.rowCount > 200
          ? usedRange.getResizedRange(200 - usedRange.rowCount, 0)
          : usedRange;
        limited.load('values');
        await context.sync();
        return {
          address: usedRange.address,
          headers: limited.values[0] || [],
          rows: limited.values.slice(1)
        };
      }
    }

    if (range.rowCount > 200) {
      const limitedRange = range.getResizedRange(200 - range.rowCount, 0);
      limitedRange.load('values');
      await context.sync();
      return {
        address: range.address,
        headers: limitedRange.values[0] || [],
        rows: limitedRange.values.slice(1)
      };
    }

    return {
      address: range.address,
      headers: range.values[0] || [],
      rows: range.values.slice(1)
    };
  });
}

export async function getWorkbookSchema(): Promise<{
  sheets: Array<{
    name: string,
    columns: string[],
    column_types: string[],
    row_count: number,
    used_range: string
  }>
}> {
  if (typeof Excel === 'undefined') {
    return {
      sheets: [
        { name: 'Sheet1', columns: ['ID', 'Date', 'Amount', 'Category'], column_types: ['numeric','date','numeric','text'], row_count: 100, used_range: 'A1:D100' }
      ]
    };
  }

  return Excel.run(async (context) => {
    const worksheets = context.workbook.worksheets;
    worksheets.load('items/name');
    await context.sync();

    const sheets = [];
    // No arbitrary cap â€” process all sheets
    for (let i = 0; i < worksheets.items.length; i++) {
      const sheet = worksheets.items[i];
      const usedRange = sheet.getUsedRangeOrNullObject();
      usedRange.load(['rowCount', 'columnCount', 'address']);
      await context.sync();

      let columns: string[] = [];
      let column_types: string[] = [];
      let rowCount = 0;
      let usedRangeAddr = '';

      if (!usedRange.isNullObject && usedRange.rowCount > 0 && usedRange.columnCount > 0) {
        rowCount = usedRange.rowCount;
        usedRangeAddr = usedRange.address;
        const headerRange = usedRange.getRow(0);
        headerRange.load('values');

        const sampleEnd = Math.min(5, usedRange.rowCount - 1);
        let sampleRange: Excel.Range | null = null;
        if (sampleEnd > 0) {
          sampleRange = usedRange.getRowsBelow(sampleEnd);
          if (sampleRange) sampleRange.load('values');
        }
        await context.sync();

        columns = headerRange.values[0].map(v => String(v || ''));
        if (sampleRange) {
          column_types = detectColumnTypes(headerRange.values[0], sampleRange.values);
        } else {
          column_types = columns.map(() => 'text');
        }
      }

      sheets.push({ name: sheet.name, columns, column_types, row_count: rowCount, used_range: usedRangeAddr });
    }

    return { sheets };
  });
}

// ── Auto-Clean: apply fill, deduplicate, and trim in Excel ────────────────────
export async function applyAutoClean(cleanResult: any): Promise<{
  nulls_filled: number;
  duplicates_removed: number;
  spaces_trimmed: number;
}> {
  if (typeof Excel === 'undefined') {
    console.log('[Browser Mock] Would apply auto-clean');
    return { nulls_filled: 0, duplicates_removed: 0, spaces_trimmed: 0 };
  }

  return Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getActiveWorksheet();
    sheet.load('name');
    await context.sync();

    let nulls_filled = 0;
    let duplicates_removed = 0;
    let spaces_trimmed = 0;

    // ── Step 1: Fill null/empty cells ─────────────────────────────────────
    const fillInstructions: any[] = cleanResult.fill_instructions || [];
    for (const fi of fillInstructions) {
      if (fi.fill_strategy === 'forward_fill' || fi.fill_value == null) continue;
      const colLetter = fi.excel_col.toUpperCase();
      let colIndex = 0;
      for (let c = 0; c < colLetter.length; c++) {
        colIndex = colIndex * 26 + colLetter.charCodeAt(c) - 64;
      }
      colIndex -= 1; // 0-based

      const batchSize = 50;
      const rows: number[] = fi.null_excel_rows || [];
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        for (const excelRow of batch) {
          try {
            const cell = sheet.getRangeByIndexes(excelRow - 1, colIndex, 1, 1);
            cell.values = [[fi.fill_value]];
            cell.format.fill.color = '#D1FAE5'; // Light green = auto-filled
            nulls_filled++;
          } catch (_) { /* skip invalid rows */ }
        }
        await context.sync();
      }
    }

    // ── Step 2: Trim whitespace cells ─────────────────────────────────────
    const trimColumns: any[] = cleanResult.trim_columns || [];
    for (const tc of trimColumns) {
      const colLetter = tc.excel_col.toUpperCase();
      let colIndex = 0;
      for (let c = 0; c < colLetter.length; c++) {
        colIndex = colIndex * 26 + colLetter.charCodeAt(c) - 64;
      }
      colIndex -= 1;

      const cells: any[] = tc.cells || [];
      const batchSize = 50;
      for (let i = 0; i < cells.length; i += batchSize) {
        const batch = cells.slice(i, i + batchSize);
        for (const c of batch) {
          try {
            const cell = sheet.getRangeByIndexes(c.excel_row - 1, colIndex, 1, 1);
            cell.values = [[c.trimmed_value]];
            spaces_trimmed++;
          } catch (_) { /* skip */ }
        }
        await context.sync();
      }
    }

    // ── Step 3: Delete duplicate rows (bottom-to-top to preserve indices) ─
    const dupRows: number[] = (cleanResult.duplicate_excel_rows || []).sort((a: number, b: number) => b - a);
    for (const excelRow of dupRows) {
      try {
        // getRow is 0-based in Office.js
        const row = sheet.getRangeByIndexes(excelRow - 1, 0, 1, 50);
        row.delete(Excel.DeleteShiftDirection.up);
        duplicates_removed++;
      } catch (_) { /* skip */ }
    }
    if (dupRows.length > 0) await context.sync();

    return { nulls_filled, duplicates_removed, spaces_trimmed };
  });
}

// ── Smart Categorize: write result column next to source column ───────────────
export async function writeColumnResults(
  sourceExcelCol: string,    // e.g. "C" — the column being categorized
  headerName: string,        // e.g. "Sentiment" or "Category"
  labels: string[],          // array of labels, one per row
  startExcelRow: number = 2  // 2 = first data row (row 1 = header)
): Promise<void> {
  if (typeof Excel === 'undefined') {
    console.log('[Browser Mock] Would write column results');
    return;
  }

  return Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getActiveWorksheet();

    // Find the column AFTER sourceExcelCol
    const colLetter = sourceExcelCol.toUpperCase();
    let colIndex = 0;
    for (let c = 0; c < colLetter.length; c++) {
      colIndex = colIndex * 26 + colLetter.charCodeAt(c) - 64;
    }
    // colIndex is now 1-based → the next column is colIndex (0-based)
    const targetColIndex = colIndex; // 0-based index of the column right after source

    // Check if target column is already occupied — if so, shift right to find empty
    const headerCell = sheet.getRangeByIndexes(0, targetColIndex, 1, 1);
    headerCell.load('values');
    await context.sync();

    // Write header (row 0 = header row)
    const headerRange = sheet.getRangeByIndexes(0, targetColIndex, 1, 1);
    headerRange.values = [[headerName]];
    headerRange.format.font.bold = true;
    headerRange.format.fill.color = '#6366F1';  // Indigo for categorize, green for sentiment
    headerRange.format.font.color = '#FFFFFF';

    // Write labels in batches of 100
    const batchSize = 100;
    for (let i = 0; i < labels.length; i += batchSize) {
      const batch = labels.slice(i, i + batchSize).map(l => [l]);
      const dataRange = sheet.getRangeByIndexes(
        startExcelRow - 1 + i,  // 0-based row
        targetColIndex,
        batch.length,
        1
      );
      dataRange.values = batch;
    }

    // Auto-fit the new column
    sheet.getUsedRange().format.autofitColumns();
    await context.sync();
  });
}

// ── Clear all highlights on active sheet (undo DQ / Anomaly coloring) ─────────
export async function clearHighlights(): Promise<void> {
  if (typeof Excel === 'undefined') {
    console.log('[Browser Mock] Would clear highlights');
    return;
  }
  return Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getActiveWorksheet();
    const used = sheet.getUsedRangeOrNullObject();
    used.load('isNullObject');
    await context.sync();
    if (!used.isNullObject) {
      used.format.fill.clear();       // Remove all fill colors
      used.format.font.color = '';    // Reset font color to default
    }
    await context.sync();
  });
}

// ── Check if a cell already has data before inserting formula ─────────────────
export async function checkCellHasData(cellAddress: string): Promise<{ hasData: boolean; currentValue: string }> {
  if (typeof Excel === 'undefined') {
    return { hasData: false, currentValue: '' };
  }
  return Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getActiveWorksheet();
    const cell = sheet.getRange(cellAddress);
    cell.load('values');
    await context.sync();
    const val = cell.values[0]?.[0];
    const isEmpty = val === null || val === undefined || val === '';
    return { hasData: !isEmpty, currentValue: isEmpty ? '' : String(val) };
  });
}

// ── Data Quality: highlight null/empty cells in Excel ─────────────────────────
export async function highlightNullCells(
  columnsWithIssues: Array<{ column: string; excel_col: string; null_excel_rows: number[]; total_missing: number; }>
): Promise<{ highlighted_cells: number; columns_affected: string[] }> {
  if (typeof Excel === 'undefined') {
    console.log('[Browser Mock] Would highlight null cells');
    return { highlighted_cells: 0, columns_affected: [] };
  }

  return Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getActiveWorksheet();
    sheet.load('name');
    await context.sync();

    let totalHighlighted = 0;
    const affectedCols: string[] = [];

    for (const col of columnsWithIssues) {
      if (!col.null_excel_rows || col.null_excel_rows.length === 0) continue;
      affectedCols.push(col.column);

      // Process in batches of 50 to avoid Excel API overload
      const batchSize = 50;
      for (let i = 0; i < col.null_excel_rows.length; i += batchSize) {
        const batch = col.null_excel_rows.slice(i, i + batchSize);
        for (const excelRow of batch) {
          try {
            // Convert col letter to index (A=0, B=1, ...)
            const colLetter = col.excel_col.toUpperCase();
            let colIndex = 0;
            for (let c = 0; c < colLetter.length; c++) {
              colIndex = colIndex * 26 + colLetter.charCodeAt(c) - 64;
            }
            colIndex -= 1; // 0-based

            const cell = sheet.getRangeByIndexes(excelRow - 1, colIndex, 1, 1);
            cell.format.fill.color = '#FEE2E2'; // Light red for nulls
            cell.format.font.color = '#991B1B';
            totalHighlighted++;
          } catch (_) { /* skip invalid rows */ }
        }
        await context.sync();
      }
    }

    return { highlighted_cells: totalHighlighted, columns_affected: affectedCols };
  });
}

// ── Data Quality: write a formatted report sheet ─────────────────────────────
export async function writeDataQualityReport(qualityResult: any): Promise<string> {
  if (typeof Excel === 'undefined') {
    console.log('[Browser Mock] Would write DQ report');
    return 'DQ_Report';
  }

  const reportSheetName = 'DQ_Report';

  return Excel.run(async (context) => {
    const wb = context.workbook;

    // ── Remember which sheet the employee is on ──────────────────────────────
    const originalSheet = wb.worksheets.getActiveWorksheet();
    originalSheet.load('name');
    await context.sync();
    const originalSheetName = originalSheet.name;

    // Delete old report sheet if exists (only if it IS the DQ report, never touch data sheets)
    const existing = wb.worksheets.getItemOrNullObject(reportSheetName);
    existing.load('isNullObject');
    await context.sync();
    if (!existing.isNullObject) {
      existing.delete();
      await context.sync();
    }

    // Create fresh report sheet — but do NOT activate it yet
    const sheet = wb.worksheets.add(reportSheetName);

    const NUM_COLS = 10;
    const now = new Date().toLocaleString();
    const rows: any[][] = [
      // Title block — padded to NUM_COLS
      [`Data Quality Report — ${qualityResult.dataset_name}`, '', '', '', '', '', '', '', '', ''],
      [`Generated: ${now}`, '', '', '', '', '', '', '', '', ''],
      [`Dataset: ${qualityResult.total_rows?.toLocaleString()} rows x ${qualityResult.total_columns} columns`, '', '', '', '', '', '', '', '', ''],
      [`Overall Quality Score: ${qualityResult.quality_score}%`, '', '', '', '', '', '', '', '', ''],
      [`Total Missing Cells: ${qualityResult.total_missing_cells?.toLocaleString() ?? 0}`, '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', ''],
      // Column report header
      ['Column', 'Excel Col', 'Type', 'Null Count', 'Empty Count', 'Total Missing', 'Missing %', 'Fill Strategy', 'Fill Value', 'Status'],
    ];

    const allCols: any[] = qualityResult.columns || [];
    for (const c of allCols) {
      rows.push([
        c.column ?? '',
        c.excel_col ?? '',
        c.dtype || '—',
        c.null_count ?? 0,
        c.empty_count ?? 0,
        c.total_missing ?? 0,
        `${c.missing_pct ?? 0}%`,
        c.fill_strategy || '—',
        c.fill_value != null ? String(c.fill_value) : '—',
        c.is_clean ? 'Clean' : 'Has Issues',
      ]);
    }

    // All rows guaranteed to be NUM_COLS wide — write in one call
    const dataRange = sheet.getRangeByIndexes(0, 0, rows.length, NUM_COLS);
    dataRange.values = rows;

    // Style title rows
    sheet.getRangeByIndexes(0, 0, 1, 1).format.font.bold = true;
    sheet.getRangeByIndexes(0, 0, 1, 1).format.font.size = 14;
    sheet.getRangeByIndexes(0, 0, 1, 1).format.font.color = '#10B981';

    // Style header row (row 6 = index 6)
    const headerRow = sheet.getRangeByIndexes(6, 0, 1, 10);
    headerRow.format.fill.color = '#10B981';
    headerRow.format.font.color = '#FFFFFF';
    headerRow.format.font.bold = true;

    // Style data rows: yellow background for rows with issues
    for (let i = 0; i < allCols.length; i++) {
      if (!allCols[i].is_clean) {
        const row = sheet.getRangeByIndexes(7 + i, 0, 1, 10);
        row.format.fill.color = '#FEF3C7';
      }
    }

    // Auto-fit columns
    sheet.getUsedRange().format.autofitColumns();

    await context.sync();

    // ── CRITICAL: Go back to the original data sheet ─────────────────────────
    // Never leave the employee on the DQ_Report sheet — return them to their data
    if (originalSheetName !== reportSheetName) {
      wb.worksheets.getItem(originalSheetName).activate();
      await context.sync();
    }

    return reportSheetName;
  });
}

