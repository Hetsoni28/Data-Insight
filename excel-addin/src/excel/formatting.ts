/* global Excel */

export async function highlightRange(action: {
  sheet: string, range: string, color: string, reason: string
}) {
  return Excel.run(async (context) => {
    // Safely fallback to active worksheet
    const sheet = context.workbook.worksheets.getActiveWorksheet();
    const range = sheet.getRange(action.range);
    
    // Use the color passed in the action
    range.format.fill.color = action.color;
    
    await context.sync();
  });
}

export async function highlightRows(sheetName: string, rows: number[], color: string = '#EF4444', reason: string = '') {
  if (typeof Excel === 'undefined') {
    console.log('[Browser Mock] Would highlight rows:', rows, 'with color', color, 'for reason:', reason);
    return;
  }

  return Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getActiveWorksheet();
    // Cap at 100 rows
    const rowsToHighlight = rows.slice(0, 100);
    
    for (const rowIndex of rowsToHighlight) {
      // Row indices are 0-based from data (skip header row — so add 1 for Excel row)
      const excelRowIndex = rowIndex + 1;
      const rowRange = sheet.getRange().getRow(excelRowIndex);
      rowRange.format.fill.color = color;
    }
    
    await context.sync();
  });
}
