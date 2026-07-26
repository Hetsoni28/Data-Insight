# AI Excel Generator Prompt Blueprint

When generating code for the AI Excel Generator pipeline, adhere to these strict rules:

## 1. 20-Step Pipeline Execution
The Excel generation process must follow the 20-step pipeline defined in the `README.md`.
Never attempt to do this in a single synchronous function. It must run in a Celery background task.

## 2. Library Usage
- Use **Pandas** for all data validation, cleaning, and profiling.
- Use **XlsxWriter** (not OpenPyXL) for writing the final `.xlsx` file, as it is faster and better suited for generating complex formatting, charts, and conditional formatting from scratch.

## 3. Architecture of the Pipeline
- **Phase 1 (Data):** FastAPI accepts the file, saves it to Supabase Storage, and triggers a Celery task.
- **Phase 2 (Reasoning):** The Celery worker loads the data, uses Pandas to profile it, and calls Claude 3.5 Sonnet to design the workbook structure (which sheets, which KPIs, what charts).
- **Phase 3 (Generation):** The worker uses XlsxWriter to physically build the `.xlsx` file based on Claude's blueprint.
- **Phase 4 (Delivery):** The file is uploaded to Supabase Storage, and a secure download link is generated and sent to the frontend via database polling or SSE.

## 4. Excel Formatting Rules
- Always include an 'Executive Summary' sheet as the first tab.
- Apply company branding (colors and logo) if provided.
- Freeze the top row on all data sheets.
- Use Excel's native Conditional Formatting for KPI thresholds (red/amber/green) rather than hardcoding cell colors, so they remain dynamic if the user changes the data later.
