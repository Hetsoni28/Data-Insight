/* global Excel */

const CHART_DATA_SHEET = '_DI_ChartData';

/**
 * Ensures the hidden chart-data scratch sheet exists.
 * It is always hidden so employees never see it.
 */
async function getOrCreateChartDataSheet(context: Excel.RequestContext): Promise<Excel.Worksheet> {
  const wb = context.workbook;
  let sheet = wb.worksheets.getItemOrNullObject(CHART_DATA_SHEET);
  sheet.load('isNullObject');
  await context.sync();

  if (sheet.isNullObject) {
    sheet = wb.worksheets.add(CHART_DATA_SHEET);
    sheet.visibility = Excel.SheetVisibility.veryHidden; // Hidden from users
    await context.sync();
  }
  return sheet;
}

/**
 * Calculates a safe position for the chart on the active sheet,
 * BELOW the user's existing data — never covering it.
 */
function getSafeChartPosition(usedRowCount: number, usedColCount: number) {
  // Place chart 2 rows below the last used row, starting at column A
  const startRow = Math.max(usedRowCount + 2, 2);
  const endRow = startRow + 20;
  const endCol = Math.min(usedColCount + 1, 12); // Up to column L, or match data width

  // Convert row/col to Excel cell notation
  const toCol = (n: number) => {
    let s = '';
    while (n > 0) { s = String.fromCharCode(64 + (n % 26 || 26)) + s; n = Math.floor((n - 1) / 26); }
    return s;
  };

  return {
    topLeft: `A${startRow}`,
    bottomRight: `${toCol(Math.max(endCol, 12))}${endRow}`,
  };
}

export async function insertChart(action: any): Promise<void> {
  if (typeof Excel === 'undefined') {
    console.log('[Browser Mock] Would insert chart:', action);
    return;
  }

  return Excel.run(async (context) => {
    const activeSheet = context.workbook.worksheets.getActiveWorksheet();
    activeSheet.load('name');

    // Load used range of the active sheet to calculate safe chart position
    const usedRange = activeSheet.getUsedRangeOrNullObject();
    usedRange.load(['rowCount', 'columnCount', 'isNullObject']);
    await context.sync();

    const usedRowCount = usedRange.isNullObject ? 0 : usedRange.rowCount;
    const usedColCount = usedRange.isNullObject ? 0 : usedRange.columnCount;

    let dataRange: Excel.Range;
    const chartData = action.chart_data;

    if (chartData && chartData.rows && chartData.rows.length > 0) {
      // ── Write pre-aggregated data to the HIDDEN scratch sheet (never user's sheet) ──
      const scratchSheet = await getOrCreateChartDataSheet(context);

      // Clear previous contents to avoid stale data
      scratchSheet.getUsedRangeOrNullObject().load('isNullObject');
      await context.sync();
      const existingRange = scratchSheet.getUsedRangeOrNullObject();
      existingRange.load('isNullObject');
      await context.sync();
      if (!existingRange.isNullObject) {
        existingRange.clear(Excel.ClearApplyTo.contents);
      }

      const numDataRows = chartData.rows.length;
      const numCols = chartData.headers.length;

      // Write a label row so anyone who unhides the sheet knows what it is
      const labelRange = scratchSheet.getRangeByIndexes(0, 0, 1, numCols);
      labelRange.values = [chartData.headers.map((_: any, i: number) =>
        i === 0 ? `Data Insight — Chart Data (auto-generated)` : ''
      )];
      labelRange.format.font.italic = true;
      labelRange.format.font.color = '#9CA3AF';

      // Write header row (row 1 = index 1)
      const headerRange = scratchSheet.getRangeByIndexes(1, 0, 1, numCols);
      headerRange.values = [chartData.headers];
      headerRange.format.font.bold = true;
      headerRange.format.fill.color = '#10B981';
      headerRange.format.font.color = '#FFFFFF';

      // Write data rows (starting row 2 = index 2)
      if (numDataRows > 0) {
        const dataValues = chartData.rows.map((row: any[]) => row.map(v => v === null ? '' : v));
        const dataRangeWrite = scratchSheet.getRangeByIndexes(2, 0, numDataRows, numCols);
        dataRangeWrite.values = dataValues;
      }

      // Chart from header + data (rows 1 to 1+numDataRows, index 1)
      dataRange = scratchSheet.getRangeByIndexes(1, 0, numDataRows + 1, numCols);
      await context.sync();

    } else {
      // ── Fallback: use the user's selected range ──
      let rawRange: string = action.data_range || '';
      if (rawRange.includes('!')) rawRange = rawRange.split('!').slice(1).join('!');

      if (!rawRange || rawRange === 'undefined' || rawRange === 'null' || rawRange === '') {
        const fallback = activeSheet.getUsedRangeOrNullObject();
        fallback.load('isNullObject');
        await context.sync();
        dataRange = fallback.isNullObject ? activeSheet.getRange('A1:B10') : fallback;
      } else {
        dataRange = activeSheet.getRange(rawRange);
      }
    }

    // ── Map chart_type to distinct Excel chart subtypes ────────────────────
    let chartType = Excel.ChartType.columnClustered;
    let seriesBy = Excel.ChartSeriesBy.columns;
    const t = (action.chart_type || 'column').toLowerCase();

    switch (t) {
      case 'bar':            chartType = Excel.ChartType.barClustered;     break; // Horizontal bars
      case 'column':         chartType = Excel.ChartType.columnClustered;  break; // Vertical bars
      case 'line':           chartType = Excel.ChartType.lineMarkers;       break; // Line with dots
      case 'area':           chartType = Excel.ChartType.area;              break; // Filled area
      case 'pie':            chartType = Excel.ChartType.pie;               break; // Pie slices
      case 'donut':          chartType = Excel.ChartType.doughnut;          break; // Donut ring
      case 'scatter':        chartType = Excel.ChartType.xyscatter; seriesBy = Excel.ChartSeriesBy.rows; break;
      case 'stacked_bar':    chartType = Excel.ChartType.barStacked;        break;
      case 'stacked_column': chartType = Excel.ChartType.columnStacked;     break;
      case 'histogram':      chartType = Excel.ChartType.columnClustered;   break; // Closest native
      default:               chartType = Excel.ChartType.columnClustered;   break;
    }

    // ── Insert chart on the ACTIVE sheet (user's sheet), not the scratch sheet ──
    const chart = activeSheet.charts.add(chartType, dataRange, seriesBy);
    chart.title.text = action.title || 'Chart';
    chart.title.format.font.bold = true;
    chart.title.format.font.size = 13;

    // ── Safe positioning: BELOW the user's existing data ──
    const pos = getSafeChartPosition(usedRowCount, usedColCount);
    chart.setPosition(pos.topLeft, pos.bottomRight);

    await context.sync();
  });
}
