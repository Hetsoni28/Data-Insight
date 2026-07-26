# AI System Workflow — Complete Architecture

This document explains exactly how Data Insight's AI brain works. It covers all 6 AI modules, the multi-model orchestration strategy, Celery pipelines, and the MCP layer.

---

## The Big Picture: How AI Is Structured

The Data Insight AI system has **3 distinct tiers**:

```
┌─────────────────────────────────────────────────────┐
│  TIER 1 — AI GATEWAY (FastAPI Service Layer)        │
│  Receives user intent. Decides routing. Logs usage. │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────▼────────────┐
          │  TIER 2 — ORCHESTRATOR  │
          │  (MCP Server + Router)  │
          │  Picks the right model  │
          │  for the right task     │
          └────────────┬────────────┘
                       │
     ┌─────────────────┼───────────────────┐
     ▼                 ▼                   ▼
Claude 3.5         GPT-4o             GPT-4o-mini
(Reasoning,        (Writing,          (Fast Chat,
 Code Gen,          Reports,           Routing,
 Excel Plan)        Summaries)         Q&A)
```

### The Multi-Model Routing Rule

| Task | Model | Reason |
|---|---|---|
| Data reasoning, Pandas code, Excel planning | Claude 3.5 Sonnet | Best at complex logic and code |
| Executive summaries, report writing, narrative | GPT-4o | Best at natural business language |
| Fast Q&A chat, intent detection | GPT-4o-mini | Under 1 second, 10x cheaper |
| Semantic dataset search | text-embedding-3-large | Meaning-based search |
| Forecasting math | Prophet / Scikit-learn (NOT LLM) | Real statistics, not hallucination |

> **Critical Rule:** LLMs must NEVER do math or forecasting directly. We run real ML models (Prophet, ARIMA) for numbers, then pass the results to GPT-4o to write a plain-English explanation.

---

## Module 1: AI Copilot Chat

**What it does:** Allows a user to ask plain-English questions about their data ("What was our top-selling product last quarter?") and receive answers, charts, or tables.

### Full Workflow

```
User types a question in the Chat UI
         │
         ▼
Frontend sends:
  POST /api/v1/ai/chat
  { "message": "...", "conversation_id": "...", "dataset_id": "..." }
         │
         ▼
FastAPI AI Service (ai_service.py)
  1. Load conversation history from DB (last 10 messages for context)
  2. Load dataset column schema from DB (so AI knows what data exists)
  3. Detect intent via GPT-4o-mini:
     - Is this a SIMPLE question?  → Answer directly
     - Does it need DATA ANALYSIS? → Generate Pandas query
     - Does it need a CHART?       → Generate ECharts config
         │
         ▼  (If data analysis needed)
Claude 3.5 Sonnet is called with:
  - System prompt: "You are a data analyst. Given the dataset schema, 
                    generate safe Pandas code to answer the question."
  - Dataset column schema injected
  - User's question injected
         │
         ▼
FastAPI executes the generated Pandas code in a sandboxed subprocess
  - Timeout: 30 seconds
  - Memory limit: 512MB
  - No filesystem access (security)
         │
         ▼
Pandas returns computed results (numbers, table rows)
         │
         ▼
GPT-4o writes the final answer:
  "Your top-selling product was Widget A with $245,000 in Q3 revenue,
   which is 34% above your Q2 performance."
         │
         ▼
Response streams back to frontend (SSE/streaming)
Message saved to ai_messages table
Token usage logged to ai_token_usage table
```

### Security Sandbox
The generated Pandas code is never executed in the main FastAPI process. It runs in an **isolated subprocess** with:
- No access to other tenants' data
- No network access
- No filesystem write access
- Hard execution timeout (30s)

---

## Module 2: AI Excel Generator (The Core Differentiator)

**What it does:** Accepts a dataset and generates a complete, professional multi-sheet Excel workbook. This is the most complex AI workflow in the platform.

### Full 20-Step Async Pipeline

```
STEP 1: User uploads dataset & clicks "Generate Excel"
         │
STEP 2: FastAPI creates an ai_jobs record → status: PENDING
         Returns: { "job_id": "abc123", "status": "PENDING" }
         │
STEP 3: FastAPI queues task in Redis via Celery:
         generate_excel_task.delay(job_id="abc123", dataset_id="...", tenant_id="...")
         │
STEP 4: Celery Worker picks up the task
         │
═══════════════════════════════════════
PHASE A — DATA UNDERSTANDING (Pandas)
═══════════════════════════════════════
STEP 5: Load CSV/Excel from Supabase Storage into Pandas DataFrame
STEP 6: Run automatic Data Profiling:
          - Detect column data types (numeric, categorical, date, text)
          - Calculate null percentages, unique value counts
          - Detect min, max, mean, median, std per numeric column
          - Detect date range if time-series data exists
STEP 7: Detect Business Domain:
          Claude 3.5 Sonnet analyzes column names + sample data
          Returns: { "domain": "Sales", "kpis": ["revenue", "units_sold", "growth_rate"] }

═══════════════════════════════════════
PHASE B — AI WORKBOOK PLANNING (Claude)
═══════════════════════════════════════
STEP 8: Claude 3.5 Sonnet generates the full Workbook Blueprint:
          - Which sheets to create (Executive, Data, Charts, Forecast)
          - Which columns are KPIs
          - Which charts to generate (bar? line? pie? waterfall?)
          - Where to place conditional formatting rules
          - Which pivot table dimensions and measures to use
          - What Excel formulas to inject (SUMIF, AVERAGEIF, etc.)
          Returns: A structured JSON workbook_blueprint

═══════════════════════════════════════
PHASE C — CONTENT GENERATION (GPT-4o)
═══════════════════════════════════════
STEP 9: Generate Executive Summary text based on the profiling data
STEP 10: Generate Key Insights (what the data is saying)
STEP 11: Generate Recommendations (what the business should do)
STEP 12: Generate Risk Analysis (what could go wrong)

═══════════════════════════════════════
PHASE D — FILE CONSTRUCTION (XlsxWriter)
═══════════════════════════════════════
STEP 13: Create Workbook in memory using XlsxWriter
STEP 14: Build Sheet 1 — Executive Summary (AI text, KPI summary table)
STEP 15: Build Sheet 2 — Raw Data (properly formatted, freeze top row)
STEP 16: Build Sheet 3 — Charts (embedded ECharts-compatible charts)
STEP 17: Build Sheet 4 — Pivot Analysis (AI-planned pivot table)
STEP 18: Build Sheet 5 — Forecast (Prophet projections + chart)
STEP 19: Apply Branding (company name, logo, brand colors in header/footer)

═══════════════════════════════════════
PHASE E — DELIVERY
═══════════════════════════════════════
STEP 20: Upload final .xlsx file to Supabase Storage
          Update ai_jobs record → status: COMPLETED, file_url: "..."
          Send in-app notification to user: "Your Excel report is ready!"
         │
         ▼
Frontend (polling GET /api/v1/jobs/abc123) sees COMPLETED
Shows download button → User downloads the file
```

---

## Module 3: AI Dashboard Builder

**What it does:** Analyzes an uploaded dataset and automatically generates a complete, professional dashboard with the most appropriate charts and KPI cards.

### Workflow

```
User clicks "AI Generate Dashboard" and selects a dataset
         │
         ▼
POST /api/v1/ai/dashboard/generate
{ "dataset_id": "...", "dashboard_name": "..." }
         │
         ▼
AI Service:
  1. Load dataset schema + 100 sample rows (not full data for speed)
  2. Call Claude 3.5 Sonnet:
     Prompt: "Given these columns and sample data, design an optimal 
              business dashboard. Return a JSON dashboard configuration
              with widget positions, chart types, and data queries."
         │
         ▼
Claude returns a JSON Dashboard Blueprint:
  {
    "widgets": [
      { "type": "kpi_card", "title": "Total Revenue", "query": "SUM(revenue)", "position": {...} },
      { "type": "bar_chart", "title": "Revenue by Region", "x": "region", "y": "revenue" },
      { "type": "line_chart", "title": "Monthly Trend", "x": "month", "y": "sales" }
    ]
  }
         │
         ▼
FastAPI saves the Dashboard Blueprint to the dashboards table
Frontend receives the dashboard_id
         │
         ▼
Frontend renders the dashboard using Apache ECharts
Each widget fetches its data from GET /api/v1/datasets/{id}/query
```

---

## Module 4: AI Report Generator

**What it does:** Generates a complete, narrative-driven PDF report from a dataset. Unlike a basic data export, this report contains AI-written analysis.

### Workflow

```
User selects: Dataset + Report Template (Executive / Sales / Finance)
         │
         ▼
POST /api/v1/ai/reports/generate
{ "dataset_id": "...", "template": "executive", "report_name": "Q3 Report" }
         │
         ▼
Celery Worker:
  1. Load full dataset using Pandas
  2. Compute all relevant statistics
  3. Run AI Writing Pipeline (GPT-4o):
     - Section 1: Executive Overview (3-4 paragraphs)
     - Section 2: Key Findings (bullet points)
     - Section 3: Performance vs. Targets
     - Section 4: Recommendations (numbered list)
     - Section 5: Risks & Mitigation
  4. Generate charts as PNG images (Matplotlib/Plotly server-side)
  5. Combine text + charts into HTML template
  6. Convert HTML → PDF using WeasyPrint
  7. Upload PDF to Supabase Storage
  8. Update job status → COMPLETED
```

---

## Module 5: Forecasting Engine

**What it does:** Predicts future values (revenue, sales, inventory) using real ML models. This is NOT an LLM task — it uses real statistical models.

### Workflow

```
User selects: Dataset + Date column + Value column + Forecast periods
         │
         ▼
POST /api/v1/forecasts/run
{ "dataset_id": "...", "date_col": "month", "value_col": "revenue", "periods": 6 }
         │
         ▼
Celery Worker:
  
  STEP 1: Data Preparation
    - Load dataset, extract date + value columns
    - Handle missing dates (interpolation)
    - Detect seasonality automatically
    
  STEP 2: Auto Model Selection
    - Fit 3 models: Prophet, ARIMA, LinearRegression
    - Cross-validate each model (80/20 split)
    - Select model with lowest RMSE (Root Mean Squared Error)
    
  STEP 3: Generate Forecast
    - Run best model for requested periods
    - Calculate confidence intervals (upper/lower bounds)
    
  STEP 4: Generate 3 Scenarios
    - Base Case (model prediction)
    - Optimistic (+15% adjustment)
    - Pessimistic (-15% adjustment)
    
  STEP 5: AI Explanation (GPT-4o)
    "Based on your historical revenue data, we forecast $1.2M in Q1 2027.
     The model detected strong seasonality in Q4, which has been factored in.
     The key driver of growth is the upward trend in your SaaS subscription segment."
    
  STEP 6: Save results to forecasts table
  STEP 7: Update job status → COMPLETED
```

---

## Module 6: MCP Server Integration

**What it does:** The Model Context Protocol (MCP) allows AI agents to securely "call functions" like reading data from the database, calling external APIs, or triggering platform actions.

### How MCP Works in Data Insight

```
AI Copilot needs to answer: "Compare this month to last month"
         │
         ▼
AI (Claude) recognizes it needs data → calls MCP Tool: "query_dataset"
  
  MCP Tool Call:
  {
    "tool": "query_dataset",
    "params": {
      "dataset_id": "...",
      "query": "SELECT month, SUM(revenue) FROM data GROUP BY month ORDER BY month DESC LIMIT 2"
    }
  }
         │
         ▼
MCP Server receives the tool call
  SECURITY CHECK:
  - Verify the tenant_id of the AI session matches the dataset_id owner
  - Verify the user has READ permission on this dataset
  - If either check fails → MCP returns a permission error, not the data
         │
         ▼
MCP executes the query against the correct tenant's database
Returns structured data back to Claude
         │
         ▼
Claude uses the data to formulate the final answer
```

### MCP Security Boundary

```
Claude (AI)  ←→  MCP Server (Data Insight)  ←→  Tenant Database
                       ↑
                PERMISSION FIREWALL
                - tenant_id validation
                - role validation (Admin/Viewer)
                - read-only queries only (no INSERT/DELETE via MCP)
```

---

## Token Usage & Billing Integration

Every single AI call in every module above is tracked in real-time:

```python
# Every AI call goes through this wrapper
async def tracked_ai_call(tenant_id, model, prompt, max_tokens):
    
    # 1. Check if tenant has remaining quota
    remaining = await check_token_quota(tenant_id)
    if remaining <= 0:
        raise TenantQuotaExceededException("AI token limit reached. Please upgrade your plan.")
    
    # 2. Make the actual API call
    response = await openai.chat.complete(model=model, messages=prompt)
    
    # 3. Log usage to the database immediately
    await log_token_usage(
        tenant_id=tenant_id,
        model=model,
        prompt_tokens=response.usage.prompt_tokens,
        completion_tokens=response.usage.completion_tokens,
        cost_usd=calculate_cost(model, response.usage)
    )
    
    return response
```

This ensures:
- Tenants on the **Starter plan** ($99/mo) cannot exceed 100K tokens/month
- When they hit 80% of their limit, they receive an automated warning email
- When they hit 100%, all AI features are gracefully disabled with an upgrade prompt
- The **Admin Panel** shows real-time token burn rate per tenant

---

## Summary of All AI Workflows

```
User Action             → AI Module Called       → Primary Model
─────────────────────────────────────────────────────────────────
Ask a data question     → AI Copilot Chat        → GPT-4o-mini + Claude 3.5
Generate Excel report   → AI Excel Generator     → Claude 3.5 + GPT-4o
Build a dashboard       → AI Dashboard Builder   → Claude 3.5
Generate a PDF report   → AI Report Generator    → GPT-4o
Forecast future values  → Forecasting Engine     → Prophet/ARIMA + GPT-4o
Search for a dataset    → Semantic Search        → text-embedding-3-large
External tool access    → MCP Integration        → Any model + Permission layer
```
