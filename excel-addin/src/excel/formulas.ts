/* global Excel */

export async function insertFormula(action: {
  formula: string, cell: string, sheet?: string
}) {
  if (typeof Excel === 'undefined') {
    console.log('[Browser Mock] Would insert formula:', action);
    return;
  }

  return Excel.run(async (context) => {
    // Assuming action.cell is an address like "Sheet1!A1"
    const range = context.workbook.worksheets.getActiveWorksheet().getRange(action.cell);
    
    // Set the formula
    range.formulas = [[action.formula]];
    
    // Auto-fit column to ensure it is visible
    range.format.autofitColumns();
    
    await context.sync();
  });
}
