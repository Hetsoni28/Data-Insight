"""ReportExportService — Real data export for AI Reports (CSV, JSON, PDF)."""

import io
import json
import uuid
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.report import ReportService


class ReportExportService:
    """Service to handle generating file exports (CSV, JSON, PDF) from Reports."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.report_service = ReportService(session)

    async def generate_export(
        self, report_id: uuid.UUID, format_type: str, actor: User,
    ) -> dict:
        """Generates a real export of the report data from the AI blueprint stored in DB.
        Returns a dict with {"content": bytes, "filename": str, "content_type": str}
        """
        report = await self.report_service.get_report(report_id, actor)
        blueprint = report.ai_blueprint or {}
        safe_title = (
            "".join([c for c in report.title if c.isalpha() or c.isdigit() or c == " "])
            .strip()
            .replace(" ", "_")
        ) or "Report"

        if format_type == "csv":
            content = self._export_csv(blueprint, report.title)
            return {
                "content": content,
                "filename": f"{safe_title}.csv",
                "content_type": "text/csv",
            }

        if format_type == "json":
            content = self._export_json(blueprint)
            return {
                "content": content,
                "filename": f"{safe_title}.json",
                "content_type": "application/json",
            }

        if format_type == "pdf":
            content = self._export_pdf(blueprint, report.title)
            return {
                "content": content,
                "filename": f"{safe_title}.pdf",
                "content_type": "application/pdf",
            }

        raise ValueError(f"Unsupported format: {format_type}")

    def _export_csv(self, blueprint: dict, title: str) -> bytes:
        """Convert AI blueprint to a well-structured CSV."""
        import csv

        output = io.StringIO()
        writer = csv.writer(output)

        # Header row
        writer.writerow([f"# Report: {title}", "", ""])
        writer.writerow([])

        # Executive Summary
        if blueprint.get("companyOverview") or blueprint.get("datasetSummary"):
            writer.writerow(["=== EXECUTIVE SUMMARY ==="])
            if blueprint.get("companyOverview"):
                writer.writerow(["Company Overview", blueprint["companyOverview"]])
            if blueprint.get("datasetSummary"):
                writer.writerow(["Dataset Summary", blueprint["datasetSummary"]])
            writer.writerow([])

        # KPIs
        kpis = blueprint.get("executiveKPIs", [])
        if kpis:
            writer.writerow(["=== KEY PERFORMANCE INDICATORS ==="])
            writer.writerow(["Metric", "Value", "Trend"])
            for kpi in kpis:
                writer.writerow([
                    kpi.get("label", ""),
                    kpi.get("value", ""),
                    kpi.get("trend", ""),
                ])
            writer.writerow([])

        # Top Insights
        insights = blueprint.get("topInsights", [])
        if insights:
            writer.writerow(["=== TOP INSIGHTS ==="])
            for i, insight in enumerate(insights, 1):
                writer.writerow([f"{i}.", insight])
            writer.writerow([])

        # Recommendations
        recs = blueprint.get("keyRecommendations", [])
        if recs:
            writer.writerow(["=== KEY RECOMMENDATIONS ==="])
            for i, rec in enumerate(recs, 1):
                writer.writerow([f"{i}.", rec])
            writer.writerow([])

        # BI Dashboard Charts data (if dashboard report)
        charts = blueprint.get("charts", [])
        for chart in charts:
            writer.writerow([f"=== CHART: {chart.get('title', 'Data')} ==="])
            data = chart.get("data", [])
            if data and isinstance(data, list) and len(data) > 0:
                headers = list(data[0].keys())
                writer.writerow(headers)
                for row in data:
                    writer.writerow([row.get(h, "") for h in headers])
            writer.writerow([])

        # Forecast data
        trendline = blueprint.get("predictedTrendline", [])
        if trendline:
            writer.writerow(["=== FORECAST DATA ==="])
            writer.writerow(["Period", "Historical Value", "Predicted Value", "Optimistic Bound", "Pessimistic Bound"])
            for point in trendline:
                writer.writerow([
                    point.get("period", ""),
                    point.get("historicalValue", ""),
                    point.get("predictedValue", ""),
                    point.get("optimisticBound", ""),
                    point.get("pessimisticBound", ""),
                ])

        return output.getvalue().encode("utf-8-sig")  # utf-8-sig for Excel CSV compatibility

    def _export_json(self, blueprint: dict) -> bytes:
        """Return pretty-printed JSON of the AI blueprint."""
        return json.dumps(blueprint, indent=2, default=str, ensure_ascii=False).encode("utf-8")

    def _export_pdf(self, blueprint: dict, title: str) -> bytes:
        """Generate a professional PDF report from the AI blueprint using weasyprint."""
        try:
            from weasyprint import HTML
            html_content = self._build_pdf_html(blueprint, title)
            pdf_bytes = HTML(string=html_content).write_pdf()
            return pdf_bytes
        except ImportError:
            # If weasyprint is not installed, fall back to a plain-text PDF-like bytes
            return self._fallback_pdf(blueprint, title)

    def _build_pdf_html(self, blueprint: dict, title: str) -> str:
        """Build a beautiful branded HTML string that weasyprint will convert to PDF."""
        now = datetime.now().strftime("%B %d, %Y")

        kpi_rows = ""
        for kpi in blueprint.get("executiveKPIs", []):
            trend_color = "#10b981" if "up" in str(kpi.get("trend", "")).lower() or "+" in str(kpi.get("trend", "")) else "#ef4444"
            kpi_rows += f"""
            <div class="kpi-card">
                <div class="kpi-label">{kpi.get('label', '')}</div>
                <div class="kpi-value">{kpi.get('value', '')}</div>
                <div class="kpi-trend" style="color:{trend_color}">{kpi.get('trend', '')}</div>
            </div>"""

        insights_html = "".join(
            f"<li>{insight}</li>" for insight in blueprint.get("topInsights", [])
        )
        recommendations_html = "".join(
            f"<li>{rec}</li>" for rec in blueprint.get("keyRecommendations", [])
        )
        opportunities_html = "".join(
            f"<li>{opp}</li>" for opp in blueprint.get("businessOpportunities", [])
        )
        risks_html = "".join(
            f"<li>{risk}</li>" for risk in blueprint.get("potentialRisks", [])
        )
        actions_html = "".join(
            f"<li>{action}</li>" for action in blueprint.get("managementActionPlan", [])
        )

        return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: Inter, Arial, sans-serif; color: #1e293b; background: #fff; font-size: 12px; }}
  .header {{ background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 36px 48px 28px; }}
  .header h1 {{ font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 6px; }}
  .header p {{ font-size: 13px; opacity: 0.85; }}
  .badge {{ display: inline-block; background: rgba(255,255,255,0.2); border-radius: 20px; padding: 4px 14px; font-size: 11px; font-weight: 600; margin-top: 12px; }}
  .body {{ padding: 36px 48px; }}
  .section {{ margin-bottom: 32px; }}
  .section-title {{ font-size: 14px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #d1fae5; padding-bottom: 8px; margin-bottom: 16px; }}
  .overview-text {{ font-size: 12px; line-height: 1.8; color: #475569; background: #f8fafc; border-left: 3px solid #10b981; padding: 14px 18px; border-radius: 0 8px 8px 0; }}
  .kpi-grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }}
  .kpi-card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; text-align: center; }}
  .kpi-label {{ font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }}
  .kpi-value {{ font-size: 20px; font-weight: 800; color: #1e293b; margin-bottom: 4px; }}
  .kpi-trend {{ font-size: 11px; font-weight: 600; }}
  ul {{ padding-left: 20px; }}
  li {{ margin-bottom: 6px; line-height: 1.6; color: #475569; }}
  .two-col {{ display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }}
  .box {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; }}
  .box-green {{ border-left: 4px solid #10b981; }}
  .box-red {{ border-left: 4px solid #ef4444; }}
  .box-blue {{ border-left: 4px solid #6366f1; }}
  .conclusion {{ background: linear-gradient(135deg, #ecfdf5, #f0fdf4); border: 1px solid #bbf7d0; border-radius: 12px; padding: 22px; font-size: 12px; line-height: 1.8; color: #065f46; }}
  .footer {{ margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 18px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }}
  h3 {{ font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 10px; }}
</style>
</head>
<body>
<div class="header">
  <h1>{title}</h1>
  <p>{blueprint.get('datasetSummary', 'AI-Generated Business Intelligence Report')}</p>
  <div class="badge">Generated on {now} · Data Insight AI</div>
</div>
<div class="body">

  {'<div class="section"><div class="section-title">Company Overview</div><div class="overview-text">' + blueprint.get("companyOverview","") + '</div></div>' if blueprint.get("companyOverview") else ""}

  {('<div class="section"><div class="section-title">Executive KPIs</div><div class="kpi-grid">' + kpi_rows + '</div></div>') if kpi_rows else ""}

  {'<div class="section"><div class="section-title">Revenue Overview</div><div class="overview-text">' + blueprint.get("revenueOverview","") + '</div></div>' if blueprint.get("revenueOverview") else ""}

  {('<div class="section"><div class="section-title">Top Insights</div><ul>' + insights_html + '</ul></div>') if insights_html else ""}

  <div class="two-col">
    {('<div class="box box-green"><h3>Business Opportunities</h3><ul>' + opportunities_html + '</ul></div>') if opportunities_html else ""}
    {('<div class="box box-red"><h3>Potential Risks</h3><ul>' + risks_html + '</ul></div>') if risks_html else ""}
  </div>

  {('<div class="section" style="margin-top:24px"><div class="section-title">Key Recommendations</div><ul>' + recommendations_html + '</ul></div>') if recommendations_html else ""}

  {('<div class="section"><div class="section-title">Management Action Plan</div><div class="box box-blue"><ul>' + actions_html + '</ul></div></div>') if actions_html else ""}

  {'<div class="section"><div class="section-title">Executive Conclusion</div><div class="conclusion">' + blueprint.get("executiveConclusion","") + '</div></div>' if blueprint.get("executiveConclusion") else ""}

  <div class="footer">
    <span>Data Insight AI Platform · Confidential</span>
    <span>Generated: {now}</span>
  </div>
</div>
</body>
</html>"""

    def _fallback_pdf(self, blueprint: dict, title: str) -> bytes:
        """Simple fallback if weasyprint is not available — returns UTF-8 text as bytes."""
        lines = [f"REPORT: {title}", "=" * 60, ""]
        if blueprint.get("companyOverview"):
            lines += ["COMPANY OVERVIEW", blueprint["companyOverview"], ""]
        for kpi in blueprint.get("executiveKPIs", []):
            lines.append(f"• {kpi.get('label')}: {kpi.get('value')} ({kpi.get('trend')})")
        lines += ["", "TOP INSIGHTS"]
        for insight in blueprint.get("topInsights", []):
            lines.append(f"- {insight}")
        lines += ["", "RECOMMENDATIONS"]
        for rec in blueprint.get("keyRecommendations", []):
            lines.append(f"- {rec}")
        return "\n".join(lines).encode("utf-8")
