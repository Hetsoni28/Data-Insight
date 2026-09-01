from __future__ import annotations
import io
import math
from datetime import datetime
from typing import Any, Dict, List, Optional
import polars as pl
import weasyprint

def _safe_float(v):
    try:
        f = float(v)
        return None if (math.isnan(f) or math.isinf(f)) else f
    except Exception:
        return None

class AdvancedPdfBuilder:
    def __init__(self, df: pl.DataFrame, profile: Dict[str, Any], dataset_name: str, ai_content: Dict[str, Any]):
        self.df = df
        self.profile = profile or {}
        self.name = (dataset_name or "Dataset")[:50]
        self.ai = ai_content or {}
        self.generated_at = datetime.now().strftime("%Y-%m-%d %H:%M UTC")
        self.num_cols = [c for c in df.columns if df[c].dtype in (pl.Float32, pl.Float64, pl.Int8, pl.Int16, pl.Int32, pl.Int64, pl.UInt8, pl.UInt16, pl.UInt32, pl.UInt64)]
        self.cat_cols = [c for c in df.columns if df[c].dtype == pl.Utf8 and 2 <= df[c].n_unique() <= 50]
        self.date_cols = [c for c in df.columns if df[c].dtype in (pl.Date, pl.Datetime)]

    def _get_logo_base64(self) -> str:
        """Render the logo to PNG (using the fix from excel_builder) and return as base64 data URI."""
        import base64
        try:
            from app.services.ingestion.excel_builder import AdvancedExcelBuilder
            png_bytes = AdvancedExcelBuilder._get_logo_png_bytes()
            if png_bytes:
                b64 = base64.b64encode(png_bytes).decode("utf-8")
                return f"data:image/png;base64,{b64}"
        except Exception as e:
            print(f"Logo render error: {e}")
        return ""

    def build(self) -> bytes:
        """Generates the PDF report and returns it as bytes."""
        ov = self.profile.get("overview", {})
        row_count = ov.get("row_count") or len(self.df)
        col_count = ov.get("column_count") or len(self.df.columns)
        qs = float(ov.get("quality_score") or self.profile.get("quality_score") or 0)
        miss_pct = float(ov.get("missing_cells_pct") or self.profile.get("missing_cells_pct") or 0)
        dupes = int(ov.get("duplicate_rows") or 0)

        logo_uri = self._get_logo_base64()
        logo_html = f'<img src="{logo_uri}" class="logo" />' if logo_uri else f'<h1>Data Insight</h1>'

        # Extract AI Content safely
        insights = self.ai.get("insights", [])
        if not insights:
            insights = [
                f"Dataset contains {row_count:,} records across {col_count} columns with a quality score of {qs:.1f}/100.",
                f"Data completeness is {100-miss_pct:.1f}% \u2014 {miss_pct:.1f}% of cells contain missing values.",
                f"Duplicate rows detected: {dupes:,}."
            ]

        recs = self.ai.get("recommendations", [])
        if not recs:
            recs = [
                f"This dataset has {row_count:,} rows and {col_count} columns \u2014 suitable for statistical modeling.",
                f"Quality score is {qs:.1f}/100 \u2014 {'excellent data quality.' if qs >= 90 else 'review missing values before modeling.'}"
            ]
            if miss_pct > 5:
                recs.append(f"Missing data at {miss_pct:.1f}% \u2014 apply imputation strategies (mean/median/mode) before analysis.")

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>{self.name} - AI Analysis Report</title>
            <style>
                @page {{
                    size: A4;
                    margin: 1.5cm;
                    @bottom-right {{
                        content: "Page " counter(page) " of " counter(pages);
                        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                        font-size: 9pt;
                        color: #64748b;
                    }}
                    @bottom-left {{
                        content: "Data Insight AI Platform";
                        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                        font-size: 9pt;
                        color: #64748b;
                    }}
                }}
                body {{
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    color: #1e293b;
                    line-height: 1.6;
                    margin: 0;
                    padding: 0;
                }}
                /* Typography */
                h1 {{ color: #0f172a; font-size: 28pt; margin-bottom: 8px; font-weight: 800; letter-spacing: -0.5px; }}
                h2 {{ color: #0f172a; font-size: 18pt; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px; margin-bottom: 20px; page-break-after: avoid; }}
                h3 {{ color: #334155; font-size: 14pt; margin-top: 24px; margin-bottom: 12px; page-break-after: avoid; }}
                p {{ font-size: 11pt; color: #475569; margin-bottom: 16px; }}
                
                /* Layout */
                .cover-page {{
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    page-break-after: always;
                }}
                .logo-container {{
                    background-color: #ffffff;
                    padding: 20px 0;
                    margin-bottom: 40px;
                    border-bottom: 4px solid #10b981;
                }}
                .logo {{ width: 250px; }}
                
                /* Metric Cards using CSS Grid/Flex equivalents */
                .metric-grid {{
                    display: table;
                    width: 100%;
                    border-spacing: 15px;
                    margin: -15px;
                    margin-bottom: 30px;
                }}
                .metric-row {{ display: table-row; }}
                .metric-card {{
                    display: table-cell;
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 20px;
                    width: 33.33%;
                    text-align: center;
                }}
                .metric-value {{ font-size: 24pt; font-weight: 700; color: #10b981; margin-bottom: 4px; }}
                .metric-label {{ font-size: 10pt; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }}
                
                /* Lists & Insights */
                ul.insight-list {{ padding-left: 20px; }}
                ul.insight-list li {{
                    font-size: 11pt;
                    color: #334155;
                    margin-bottom: 12px;
                    padding-left: 8px;
                }}
                .highlight-box {{
                    background-color: #ecfdf5;
                    border-left: 4px solid #10b981;
                    padding: 16px 20px;
                    margin: 20px 0;
                    border-radius: 0 8px 8px 0;
                }}
                .highlight-box h3 {{ color: #065f46; margin-top: 0; margin-bottom: 8px; border: none; font-size: 12pt; }}
                .highlight-box p {{ color: #047857; margin: 0; font-size: 10.5pt; }}
                
                /* Data Tables */
                table.data-table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                    margin-bottom: 30px;
                    font-size: 10pt;
                    page-break-inside: auto;
                }}
                table.data-table tr {{ page-break-inside: avoid; page-break-after: auto; }}
                table.data-table th {{
                    background-color: #f1f5f9;
                    color: #334155;
                    font-weight: 700;
                    text-align: left;
                    padding: 12px;
                    border-bottom: 2px solid #cbd5e1;
                }}
                table.data-table td {{
                    padding: 10px 12px;
                    border-bottom: 1px solid #e2e8f0;
                    color: #475569;
                }}
                
                /* CSS Bar Chart for Missing Values */
                .bar-chart-container {{ width: 100%; background: #f1f5f9; height: 12px; border-radius: 6px; overflow: hidden; margin-top: 6px; }}
                .bar-chart-fill {{ background: #ef4444; height: 100%; }}
                
            </style>
        </head>
        <body>

            <!-- Cover Page -->
            <div class="cover-page">
                <div class="logo-container">
                    {logo_html}
                </div>
                <h1 style="color: #0f172a; margin-top: 0;">AI Analysis & Data Quality Report</h1>
                <p style="font-size: 16pt; color: #10b981; font-weight: 600; margin-bottom: 4px;">{self.name}</p>
                <p style="font-size: 12pt; color: #64748b;">Generated on {self.generated_at}</p>
                
                <div style="margin-top: 60px;">
                    <p style="font-size: 12pt; font-weight: 600; color: #334155;">Executive Summary</p>
                    <p style="font-size: 11pt; line-height: 1.7;">
                        {self.ai.get("executive_summary", "This report contains an automated AI-driven analysis of your dataset, highlighting key statistical patterns, data quality metrics, potential anomalies, and actionable recommendations for downstream machine learning and reporting.")}
                    </p>
                </div>
            </div>

            <!-- Page 2: Key Metrics -->
            <h2>Data Profile Overview</h2>
            <div class="metric-grid">
                <div class="metric-row">
                    <div class="metric-card">
                        <div class="metric-value">{row_count:,}</div>
                        <div class="metric-label">Total Records</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{col_count}</div>
                        <div class="metric-label">Features / Columns</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" style="color: {'#10b981' if qs >= 85 else '#f59e0b' if qs >= 60 else '#ef4444'}">{qs:.1f}</div>
                        <div class="metric-label">Quality Score</div>
                    </div>
                </div>
            </div>

            <div class="highlight-box">
                <h3>Data Completeness</h3>
                <p>{100 - miss_pct:.1f}% of all cells contain valid data. {f"There are {dupes:,} duplicate rows." if dupes > 0 else "No duplicate rows were detected."}</p>
            </div>

            <h2>AI Insights & Key Findings</h2>
            <ul class="insight-list">
                {"".join(f"<li><strong>{i.split(':', 1)[0] if ':' in i else 'Observation'}:</strong> {i.split(':', 1)[1] if ':' in i else i}</li>" for i in insights)}
            </ul>

            <h2>Strategic Recommendations</h2>
            <ul class="insight-list">
                {"".join(f"<li>{r}</li>" for r in recs)}
            </ul>

            <!-- Data Dictionary & Missing Data -->
            <h2 style="page-break-before: always;">Data Dictionary & Quality</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width: 30%">Column Name</th>
                        <th style="width: 20%">Data Type</th>
                        <th style="width: 15%">Unique Vals</th>
                        <th style="width: 35%">Missing Data</th>
                    </tr>
                </thead>
                <tbody>
"""
        
        # Build Table Rows
        cols = self.profile.get("columns", {})
        for col_name, cinfo in cols.items():
            dt = cinfo.get("type", str(self.df[col_name].dtype) if col_name in self.df.columns else "Unknown")
            uniq = cinfo.get("n_unique", 0)
            nulls = cinfo.get("null_count", 0)
            null_pct = (nulls / row_count * 100) if row_count > 0 else 0
            
            fill_width = min(max(null_pct, 0), 100)
            html_content += f"""
                    <tr>
                        <td style="font-weight: 600;">{col_name}</td>
                        <td><code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 9pt;">{dt}</code></td>
                        <td>{uniq:,}</td>
                        <td>
                            <div style="font-size: 9pt; color: #64748b; margin-bottom: 2px;">{nulls:,} missing ({null_pct:.1f}%)</div>
                            <div class="bar-chart-container">
                                <div class="bar-chart-fill" style="width: {fill_width}%;"></div>
                            </div>
                        </td>
                    </tr>"""

        html_content += """
                </tbody>
            </table>
            
        </body>
        </html>
        """

        # Generate PDF using WeasyPrint
        pdf_bytes = weasyprint.HTML(string=html_content).write_pdf()
        return pdf_bytes

if __name__ == "__main__":
    import sys
    # Quick test logic
    print("Testing PDF builder...")
    df = pl.DataFrame({"CustomerID": [1,2,3], "Age": [25, 30, None], "Segment": ["A", "B", "A"]})
    prof = {
        "overview": {"row_count": 3, "column_count": 3, "quality_score": 85.5, "missing_cells_pct": 11.1},
        "columns": {
            "CustomerID": {"type": "Int64", "n_unique": 3, "null_count": 0},
            "Age": {"type": "Float64", "n_unique": 2, "null_count": 1},
            "Segment": {"type": "Utf8", "n_unique": 2, "null_count": 0}
        }
    }
    ai = {
        "executive_summary": "Test summary",
        "insights": ["Age: Has missing values", "Segment: mostly A"],
        "recommendations": ["Impute Age", "Check Segment balance"]
    }
    b = AdvancedPdfBuilder(df, prof, "Test Dataset", ai)
    out = b.build()
    with open("/app/app/services/ingestion/test_out.pdf", "wb") as f:
        f.write(out)
    print(f"PDF generated: {len(out)} bytes")
