<div align="center">

<br />

<!-- LOGO / BRAND -->
<img src="https://img.shields.io/badge/Data%20Insight-AI%20Business%20Intelligence-10B981?style=for-the-badge&logo=databricks&logoColor=white" alt="Data Insight" height="45" />

<br /><br />

# Data Insight

### Enterprise AI-Powered Business Intelligence & Analytics Platform

**Transform raw data into executive intelligence. Powered by world-class AI.**

<br />

[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-10B981.svg?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-059669.svg?style=flat-square)](CHANGELOG.md)
[![Status](https://img.shields.io/badge/Status-In%20Development-ECFDF5.svg?style=flat-square&labelColor=10B981)](/)
[![Python](https://img.shields.io/badge/Python-3.12%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?style=flat-square&logo=postgresql&logoColor=white)](https://supabase.com)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)

<br />

[📘 Documentation](#-documentation) · [🚀 Quick Start](#-quick-start) · [🏗 Architecture](#-architecture) · [🤖 AI Modules](#-ai-modules) · [🗺 Roadmap](#-roadmap)

<br />

---

</div>

## 📌 Table of Contents

- [Project Overview](#-project-overview)
- [Design System](#-design-system)
- [Core Features](#-core-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [AI Modules](#-ai-modules)
- [Database Design](#-database-design)
- [Folder Structure](#-folder-structure)
- [Multi-Tenant Architecture](#-multi-tenant-architecture)
- [Security](#-security)
- [API Overview](#-api-overview)
- [Development Phases](#-development-phases)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [Documentation](#-documentation)
- [License](#-license)

---

## 🎯 Project Overview

**Data Insight** is a production-ready, enterprise-grade AI Business Intelligence SaaS platform built for modern organizations that need to make fast, confident, data-driven decisions.

Instead of spending days building dashboards manually or waiting for analysts to generate reports, Data Insight allows any business user to:

- **Upload** raw CSV, Excel, or JSON data
- **Let AI automatically** clean it, understand it, and detect KPIs
- **Generate** interactive dashboards, executive Excel reports, and PDF insights — in minutes
- **Forecast** future revenue, sales, and growth trends using real ML models
- **Chat** with their data in plain English using the AI Copilot

> *Data Insight is not a dashboard tool. It is an AI analyst that runs 24/7 for your entire organization.*

### Why Data Insight?

| Traditional BI Tools | Data Insight |
|---|---|
| Requires an analyst to build dashboards | AI builds dashboards automatically |
| Static reports | Living, AI-generated insights |
| Requires SQL knowledge | Ask questions in plain English |
| One-size-fits-all | Fully multi-tenant, per-company isolated |
| No forecasting | Built-in ML-powered forecasting |
| Manual Excel reports | AI-generated professional Excel workbooks |

---

## 🎨 Design System

Data Insight uses a carefully crafted, enterprise-grade design language built on the **Inter** typeface and a professional green-neutral palette.

### Color Palette

| Role | Hex | Description |
|---|---|---|
| **Primary** | `#10B981` | Emerald Green — CTAs, active states, highlights |
| **Secondary** | `#059669` | Deep Emerald — Hover states, secondary actions |
| **Tertiary** | `#ECFDF5` | Mint Frost — Light backgrounds, tag fills |
| **Neutral** | `#F8FAFC` | Slate White — Page backgrounds, card fills |

### Typography

| Style | Font | Weight | Usage |
|---|---|---|---|
| **Headline** | Inter | 700 (Bold) | Page titles, hero sections |
| **Body** | Inter | 400 (Regular) | Paragraphs, descriptions, content |
| **Label** | Inter | 500 (Medium) | Buttons, badges, form labels |

### Button Variants

| Variant | Style |
|---|---|
| **Primary** | `#10B981` fill, white text — main actions |
| **Secondary** | White fill, `#10B981` border — secondary actions |
| **Inverted** | `#111827` (dark) fill, white text — destructive/emphasis |
| **Outlined** | Transparent fill, gray border — tertiary actions |

### UI Principles

- **Enterprise Minimal** — Clean, no noise; every element earns its place
- **Dark & Light Mode** — System-aware with manual override
- **Responsive First** — Designed for 1440px desktop, scales to mobile
- **Accessible** — WCAG 2.1 AA compliant throughout
- **Micro-Animations** — Framer Motion powered transitions for a premium feel

---

## ✨ Core Features

### 🗂 Dataset Management
- Upload CSV, Excel (.xlsx), JSON files via drag and drop
- Automatic data validation, cleaning, and profiling
- Column type detection, null analysis, duplicate detection
- Anomaly and outlier detection on import
- Dataset versioning — track every schema and data change over time
- Secure, per-tenant isolated storage via Supabase Storage

### 🤖 AI Copilot
- Chat with your data in plain English
- *"What was our top-performing region last quarter?"*
- AI generates charts, tables, and summaries directly from conversation
- Persistent conversation memory within a session
- Auto-suggested business questions powered by dataset context

### 📊 Dashboard Builder
- Drag-and-drop widget canvas powered by dnd-kit
- 50+ chart types: KPI cards, bar, line, pie, funnel, heatmap, gauge, candlestick
- AI auto-generates the best dashboard layout from your data in one click
- Filter by date range, dimension, and business segment
- Shareable via secure link or embeddable via iframe
- Export as PDF or high-resolution image

### 📈 AI Excel Generator
- Upload a dataset → AI generates a professional multi-sheet Excel workbook
- Includes: Executive Summary, Raw Data, Charts, Pivot Tables, Forecasts, Recommendations
- AI-detected KPIs with conditional formatting (red/green thresholds)
- Auto-inserted Excel formulas (SUM, AVERAGEIF, VLOOKUP, etc.)
- Branded with company name and configurable colors
- Download as `.xlsx` — board-presentation ready

### 📄 AI Report Generator
- One click → professional PDF report with AI-written narrative
- Templates: Executive, Financial, Sales, Marketing, HR Operations
- AI writes insights and recommendations, not just raw numbers
- Scheduled report delivery via email (daily, weekly, monthly)
- Multi-language support (future roadmap)

### 🔮 Forecasting Engine
- Revenue, Sales, Expense, and Growth forecasting
- Models: Prophet, ARIMA, SARIMA (auto-selected per data characteristics)
- Scenario planning: Best Case / Base Case / Worst Case
- Confidence intervals clearly visualized on interactive charts
- AI-written plain-English explanation of every forecast result

### 🧠 Machine Learning Studio
- No-code ML model training on your own datasets
- Classification — churn prediction, fraud detection, lead scoring
- Regression — price modeling, revenue forecasting
- Clustering — customer segmentation, product grouping
- Anomaly Detection — fraud, data errors, operational outliers
- Feature importance explained in plain English for non-technical users

### ⚙️ Automation Engine
- Visual trigger-based workflow builder
- *"When sales drop below $X → send alert to CEO"*
- *"Every Monday 8AM → generate weekly report → email the team"*
- Celery-powered background jobs with Redis as the message broker
- Full job status tracking, history, and retry management

### 🔔 Notification System
- In-app notification center with real-time updates
- Transactional email notifications via Resend
- Slack and Microsoft Teams webhook integrations
- AI insight alerts ("Unusual spike detected in your Q3 sales data")
- Billing, quota, and system alerts

### 💳 Billing & Subscriptions
- Stripe-powered subscription management portal
- **Starter:** $99/mo — 5 users, 5GB storage, 100K AI tokens/mo
- **Professional:** $299/mo — 20 users, 25GB storage, 500K AI tokens/mo
- **Enterprise:** $999/mo — Unlimited users, storage, and tokens
- Usage-based billing for AI token and storage overages
- Self-service invoice generation and subscription management

### 🛡 Admin Panel
- Super admin dashboard for managing all tenant organizations
- Per-tenant usage analytics: storage consumed, AI tokens used, API calls
- Feature flag management per subscription plan tier
- System health and infrastructure monitoring dashboard
- Full audit log viewer across all organizations and users

---

## 🛠 Technology Stack

### 🎨 Frontend

| Category | Technology | Version |
|---|---|---|
| Framework | Next.js | 15 |
| UI Library | React | 19 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Components | Shadcn/UI + Radix UI | Latest |
| Icons | Lucide React | Latest |
| Animations | Framer Motion | Latest |
| State (Global) | Zustand | Latest |
| State (Server) | TanStack Query | v5 |
| Forms | React Hook Form | Latest |
| Validation | Zod | Latest |
| Tables | TanStack Table | v8 |
| Charts | Apache ECharts | Latest |
| File Upload | React Dropzone | Latest |
| Drag & Drop | dnd-kit | Latest |
| Date Handling | date-fns | Latest |
| Toast | Sonner | Latest |
| Themes | next-themes | Latest |
| HTTP Client | Axios | Latest |
| Auth Client | Supabase Auth | Latest |

### ⚙️ Backend

| Category | Technology | Version |
|---|---|---|
| Framework | FastAPI | Latest |
| Language | Python | 3.12+ |
| ASGI Server | Uvicorn | Latest |
| ORM | SQLAlchemy | 2.x |
| Migrations | Alembic | Latest |
| Validation | Pydantic | v2 |
| Auth | JWT + Supabase Auth | — |
| Cache | Redis | Latest |
| Background Jobs | Celery | Latest |
| Job Monitor | Flower | Latest |
| Rate Limiting | slowapi | Latest |
| Logging | Loguru | Latest |
| HTTP Client | HTTPX | Latest |
| File Handling | aiofiles | Latest |
| Email | Resend | Latest |
| Monitoring | Prometheus + Grafana | Latest |
| API Docs | Swagger UI / OpenAPI | Auto-generated |

### 🤖 AI & Data Science

| Category | Technology |
|---|---|
| Complex Reasoning | Anthropic Claude 3.5 Sonnet |
| Chat & Reports | OpenAI GPT-4o |
| Fast Routing | OpenAI GPT-4o-mini |
| Embeddings (Search) | OpenAI text-embedding-3-large |
| AI Orchestration | MCP Server (Model Context Protocol) |
| Data Analysis | Pandas |
| Numerical Computing | NumPy |
| Machine Learning | Scikit-learn |
| Forecasting | Prophet + Statsmodels (ARIMA/SARIMA) |
| Excel Generation | OpenPyXL + XlsxWriter |
| PDF Generation | WeasyPrint |
| Data Validation | Pandera |

### 🗄 Database & Storage

| Category | Technology |
|---|---|
| Primary Database | PostgreSQL (via Supabase) |
| Tenant Isolation | Separate Supabase project per company |
| Storage | Supabase Storage |
| Cache | Redis |
| DB Features | UUID PKs, RLS, Indexes, Foreign Keys, Soft Delete |

### 🐳 DevOps & Infrastructure

| Category | Technology |
|---|---|
| Containers | Docker + Docker Compose |
| Reverse Proxy | Nginx |
| CI/CD | GitHub Actions |
| CDN / WAF | Cloudflare |
| SSL | Let's Encrypt |
| Hosting | Ubuntu Linux (Cloud VPS) |
| Version Control | Git + GitHub |
| Process Manager | Gunicorn + Uvicorn Workers |

---

## 🏗 System Architecture

```
                    ┌─────────────────────────────┐
                    │     User Browser / Client   │
                    └──────────────┬──────────────┘
                                   │ HTTPS
                    ┌──────────────▼──────────────┐
                    │   Cloudflare (CDN + WAF)    │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │     Nginx Reverse Proxy     │
                    │     (SSL Termination)       │
                    └──────┬───────────────┬──────┘
                           │               │
          ┌────────────────▼───┐   ┌───────▼────────────────┐
          │  Next.js Frontend  │   │   FastAPI Backend      │
          │  (Port 3000)       │   │   (Port 8000)          │
          └────────────────────┘   └───┬───────────────┬────┘
                                       │               │
                          ┌────────────▼──┐   ┌────────▼───────────┐
                          │  Supabase     │   │  Redis             │
                          │  ├ PostgreSQL │   │  ├ Cache Layer     │
                          │  ├ Auth       │   │  └ Celery Queue    │
                          │  └ Storage    │   └────────┬───────────┘
                          └───────────────┘            │
                                                ┌──────▼──────────────┐
                                                │  Celery Workers     │
                                                │  ├ AI Jobs          │
                                                │  ├ Excel Generator  │
                                                │  ├ Report Generator │
                                                │  ├ Forecasting Jobs │
                                                │  └ Email Jobs       │
                                                └──────┬──────────────┘
                                                       │
                                         ┌─────────────▼────────────┐
                                         │    AI Orchestration      │
                                         │  ├ MCP Server            │
                                         │  ├ Claude 3.5 Sonnet     │
                                         │  ├ OpenAI GPT-4o         │
                                         │  └ Embeddings API        │
                                         └──────────────────────────┘
```

### Clean Architecture Pattern (Backend)

```
HTTP Request
     │
     ▼
┌─────────────────────────────────────────┐
│  API Router  (HTTP logic ONLY)          │
│  Parses request → calls service         │
└──────────────────┬──────────────────────┘
                   │
     ┌─────────────▼─────────────┐
     │  Service Layer            │
     │  (ALL business logic)     │
     └─────────────┬─────────────┘
                   │
     ┌─────────────▼─────────────┐
     │  Repository Layer         │
     │  (Data access ONLY)       │
     └─────────────┬─────────────┘
                   │
     ┌─────────────▼─────────────┐
     │  SQLAlchemy / Supabase    │
     │  (Database)               │
     └───────────────────────────┘
```

> **Golden Rule:** Business logic lives ONLY in the Service layer. Never in routers. Never in repositories. This is non-negotiable.

---

## 🤖 AI Modules

Data Insight uses a **multi-model orchestration strategy** — routing each task to the model best suited for that job.

| Module | Model | Reason |
|---|---|---|
| **AI Copilot Chat** | GPT-4o-mini | Ultra-fast, cost-efficient rapid Q&A |
| **Data Reasoning & Code** | Claude 3.5 Sonnet | Best for complex analysis and data transformation |
| **Report Writing** | GPT-4o | Natural, professional executive tone |
| **Semantic Search** | text-embedding-3-large | Search datasets by meaning, not keywords |
| **Forecasting** | Prophet + Scikit-learn | Real statistics — then LLM explains the output |
| **Excel Generation** | Claude 3.5 Sonnet + XlsxWriter | Claude plans; Python executes |
| **Dashboard Builder** | GPT-4o | Recommends optimal chart types and layouts |

### AI Excel Generator — Full 20-Step Pipeline

```
Upload Dataset
     ↓  Validate & Clean             (Pandas)
     ↓  Data Profiling               (column types, nulls, distributions)
     ↓  Business Domain Detection    (Sales? Finance? HR? Marketing?)
     ↓  KPI Auto-Detection           (AI identifies the most important metrics)
     ↓  Chart Recommendation         (AI decides best visualization per KPI)
     ↓  Worksheet Planning           (AI designs the full sheet architecture)
     ↓  Pivot Table Planning         (dimensions, measures, aggregations)
     ↓  Formula Generation           (SUMIF, AVERAGEIF, VLOOKUP, etc.)
     ↓  Conditional Formatting Rules (red/amber/green thresholds)
     ↓  Executive Summary Writing    (AI-written professional narrative)
     ↓  Insights Generation          (What the data is really saying)
     ↓  Recommendations Writing      (Actionable next steps)
     ↓  Risk Analysis                (What could go wrong)
     ↓  Forecast Sheet Generation    (Prophet/ARIMA projections)
     ↓  Professional Styling         (fonts, borders, header rows)
     ↓  Company Branding             (logo, colors, name)
     ↓  File Assembly                (XlsxWriter execution)
     ↓  Upload to Supabase Storage
     ↓  Download Link delivered to User
```

---

## 🗄 Database Design

### Foundation Tables (Phase 0–1)

```sql
-- Master tenant registry (platform-level)
tenants
  id UUID PK, name, slug UNIQUE, plan ENUM, supabase_project_id, created_at

-- Global user registry (matches Supabase Auth UID)
users
  id UUID PK, email UNIQUE, full_name, avatar_url, created_at

-- User ↔ Company membership with role
tenant_users
  id UUID PK, tenant_id FK, user_id FK, role ENUM(Owner/Admin/Member/Viewer), status ENUM

-- Sub-divisions within a company
workspaces
  id UUID PK, tenant_id FK, name, created_by FK, created_at

-- Immutable audit trail of every platform action
audit_logs
  id UUID PK, tenant_id FK, user_id FK, action, entity_type, entity_id, metadata JSONB, ip_address, created_at
```

### Data Tables (Phase 2)

```sql
datasets             → id, tenant_id, workspace_id, name, file_url, row_count, status
dataset_versions     → dataset_id, version_number, file_url, changed_by
dataset_columns      → dataset_id, column_name, data_type, null_pct, unique_count
data_quality_reports → dataset_id, issues_found, issues_fixed, quality_score
```

### AI Tables (Phase 5+)

```sql
ai_conversations     → id, tenant_id, user_id, dataset_id, title, created_at
ai_messages          → conversation_id, role(user/assistant), content, tokens_used
ai_jobs              → id, type, status(pending/running/done/failed), payload JSONB, result JSONB
ai_token_usage       → tenant_id, year_month, tokens_used, model, cost_usd
```

### Output Tables (Phase 4+)

```sql
dashboards           → id, tenant_id, workspace_id, name, config JSONB, is_public
dashboard_widgets    → dashboard_id, chart_type, position JSONB, dataset_id, query_config JSONB
reports              → id, tenant_id, type, file_url, status, generated_at
excel_exports        → id, tenant_id, dataset_id, file_url, sheet_count, generated_at
forecasts            → id, tenant_id, dataset_id, model_used, predictions JSONB, confidence JSONB
```

### Platform Tables (Phase 9+)

```sql
subscriptions        → tenant_id, plan, status, stripe_subscription_id, current_period_end
billing_events       → tenant_id, event_type, amount_cents, stripe_event_id, metadata JSONB
api_keys             → tenant_id, user_id, key_hash, name, last_used_at, is_active
notifications        → tenant_id, user_id, type, title, content, read_at, created_at
```

> **Total target:** 100+ tables across all 29 specification volumes.

---

## 📁 Folder Structure

### Frontend (`/frontend`)

```
frontend/
├── src/
│   ├── app/                        # Next.js 15 App Router
│   │   ├── (auth)/                 # Login, Register, Reset Password
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── (dashboard)/            # All authenticated app routes
│   │   │   ├── layout.tsx          # Sidebar + Navbar layout
│   │   │   ├── page.tsx            # Main dashboard
│   │   │   ├── ai-copilot/
│   │   │   ├── datasets/
│   │   │   ├── dashboards/
│   │   │   ├── reports/
│   │   │   ├── forecasting/
│   │   │   ├── billing/
│   │   │   └── settings/
│   │   ├── (admin)/                # Super admin routes
│   │   ├── layout.tsx              # Root layout + Providers
│   │   └── page.tsx                # Public landing page
│   │
│   ├── components/                 # Atomic Design System
│   │   ├── atoms/                  # Button, Input, Badge, Spinner, Avatar
│   │   ├── molecules/              # KPICard, SearchBar, FileUploader, StatCard
│   │   ├── organisms/              # DataTable, DashboardPanel, Sidebar, Navbar
│   │   ├── templates/              # DashboardLayout, AuthLayout, SettingsLayout
│   │   └── ui/                     # Shadcn/UI generated base components
│   │
│   ├── features/                   # Feature-scoped business logic
│   │   ├── ai/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── api.ts
│   │   ├── datasets/
│   │   ├── dashboards/
│   │   └── reports/
│   │
│   ├── hooks/                      # Shared custom React hooks
│   ├── store/                      # Zustand global state stores
│   ├── lib/                        # Utilities
│   │   ├── supabase.ts             # Supabase client
│   │   ├── axios.ts                # Axios instance + interceptors
│   │   └── utils.ts                # cn(), formatDate(), formatCurrency()
│   ├── types/                      # TypeScript interfaces & enums
│   └── styles/                     # globals.css, design tokens
│
├── public/
├── .env.local
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

### Backend (`/backend`)

```
backend/
├── app/
│   ├── api/
│   │   └── v1/                     # All HTTP routers (no business logic)
│   │       ├── auth.py
│   │       ├── organizations.py
│   │       ├── workspaces.py
│   │       ├── datasets.py
│   │       ├── dashboards.py
│   │       ├── ai.py
│   │       ├── reports.py
│   │       ├── forecasting.py
│   │       ├── billing.py
│   │       └── admin.py
│   │
│   ├── core/                       # Application-wide configuration
│   │   ├── config.py               # Pydantic BaseSettings (env vars)
│   │   ├── security.py             # JWT creation/verification, bcrypt
│   │   ├── dependencies.py         # get_current_user, get_tenant, etc.
│   │   └── exceptions.py           # Global FastAPI exception handlers
│   │
│   ├── db/
│   │   ├── session.py              # SQLAlchemy async engine & session
│   │   └── migrations/             # Alembic migration scripts
│   │       └── versions/
│   │
│   ├── models/                     # SQLAlchemy ORM table definitions
│   │   ├── tenant.py
│   │   ├── user.py
│   │   ├── workspace.py
│   │   ├── dataset.py
│   │   ├── dashboard.py
│   │   ├── report.py
│   │   └── audit_log.py
│   │
│   ├── schemas/                    # Pydantic request/response schemas
│   │   ├── auth_schema.py
│   │   ├── dataset_schema.py
│   │   └── ai_schema.py
│   │
│   ├── repositories/               # CRUD data access layer
│   │   ├── base_repo.py            # Generic CRUD base class
│   │   ├── user_repo.py
│   │   └── dataset_repo.py
│   │
│   ├── services/                   # ALL business logic lives here
│   │   ├── auth_service.py
│   │   ├── tenant_service.py
│   │   ├── dataset_service.py
│   │   ├── ai_service.py           # OpenAI + Anthropic orchestration
│   │   ├── excel_service.py        # 20-step Excel pipeline
│   │   ├── report_service.py
│   │   └── forecast_service.py
│   │
│   ├── worker/                     # Celery async workers
│   │   ├── celery_app.py           # Celery + Redis configuration
│   │   └── tasks/
│   │       ├── ai_tasks.py
│   │       ├── excel_tasks.py
│   │       ├── report_tasks.py
│   │       └── email_tasks.py
│   │
│   └── main.py                     # FastAPI app entry point
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── conftest.py
├── .env
├── alembic.ini
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

---

## 🏢 Multi-Tenant Architecture

Data Insight implements **Tier 3 Isolation** — the strongest available level of data separation for enterprise SaaS.

```
Your Platform (Single Codebase, Single Deployment)
        │
        ├── Acme Corp    → Supabase Project A → Postgres A → Storage A
        ├── TechStart    → Supabase Project B → Postgres B → Storage B
        └── GlobalBank   → Supabase Project C → Postgres C → Storage C
```

### Guarantees

- ✅ Each company's data is stored in a **physically separate database**
- ✅ No `WHERE company_id = X` on shared tables — true isolation, not filtering
- ✅ Even the development team **cannot read tenant business data** without explicit credentials
- ✅ Tenant databases are provisioned **automatically** on signup — zero manual setup
- ✅ If a company cancels, their database can be **exported and deleted cleanly**
- ✅ One company's heavy queries **cannot degrade performance** for another

### Tenant Onboarding Flow

```
Company Registers
       ↓
Stripe Payment Confirmed
       ↓
System auto-creates new Supabase project
       ↓
Alembic runs all migrations on new project
       ↓
Admin user created and linked to tenant
       ↓
Welcome email sent via Resend
       ↓
Company logs into their fully isolated workspace
```

### Every API Request Flow

```
Request arrives
     ↓  Nginx → FastAPI
     ↓  JWT extracted from Authorization header
     ↓  Supabase Auth validates JWT signature
     ↓  Middleware extracts: user_id, tenant_id, role
     ↓  Tenant DB connection resolved from tenant registry
     ↓  Request continues with scoped DB session
     ↓  Action logged to audit_logs
     ↓  Response returned
```

---

## 🔐 Security

| Control | Implementation |
|---|---|
| **Authentication** | Supabase Auth — JWT access tokens + refresh tokens |
| **Authorization** | RBAC — Owner / Admin / Member / Viewer per tenant |
| **Data Isolation** | Separate Supabase project per company + RLS policies |
| **Password Hashing** | bcrypt (min 12 rounds) |
| **MFA** | Supabase Auth TOTP (Authenticator app support) |
| **Rate Limiting** | slowapi — Redis-backed, per-tenant per-endpoint limits |
| **Input Validation** | Pydantic v2 (backend) + Zod (frontend) on every input |
| **SQL Injection** | SQLAlchemy ORM parameterized queries — zero raw SQL |
| **XSS Protection** | Next.js DOMPurify + strict Content-Security-Policy headers |
| **CORS** | FastAPI CORS middleware — allowlist only, no wildcards |
| **File Uploads** | MIME type validation, max size limits, malware scan hook |
| **Audit Logs** | Every action: user, timestamp, IP, resource, before/after state |
| **Secrets** | Pydantic BaseSettings — environment variables, never hardcoded |
| **HTTPS** | Enforced at Nginx + Cloudflare — no HTTP in production |
| **OWASP Top 10** | All 10 categories addressed by design in every module |

---

## 🔌 API Overview

All APIs follow RESTful conventions under the versioned prefix `/api/v1/`.

| Module | Base Path | Key Endpoints |
|---|---|---|
| Auth | `/api/v1/auth` | `POST /register` `POST /login` `POST /refresh` `POST /logout` `POST /password-reset` |
| Organizations | `/api/v1/orgs` | `POST /` `GET /{id}` `PUT /{id}` `DELETE /{id}` `GET /{id}/members` |
| Workspaces | `/api/v1/workspaces` | `POST /` `GET /` `PUT /{id}` `DELETE /{id}` `POST /{id}/invite` |
| Datasets | `/api/v1/datasets` | `POST /upload` `GET /` `GET /{id}` `GET /{id}/profile` `DELETE /{id}` |
| AI | `/api/v1/ai` | `POST /chat` `POST /analyze` `POST /excel` `POST /report` `GET /jobs/{id}` |
| Dashboards | `/api/v1/dashboards` | `POST /` `GET /` `PUT /{id}` `DELETE /{id}` `POST /{id}/widgets` |
| Reports | `/api/v1/reports` | `POST /generate` `GET /` `GET /{id}` `GET /{id}/download` |
| Forecasting | `/api/v1/forecasts` | `POST /run` `GET /` `GET /{id}` |
| Billing | `/api/v1/billing` | `GET /subscription` `POST /subscribe` `POST /cancel` `GET /invoices` |
| Admin | `/api/v1/admin` | `GET /tenants` `GET /tenants/{id}` `GET /tenants/{id}/usage` |

> Full interactive API docs auto-generated via **Swagger UI** at `/docs` and **ReDoc** at `/redoc`.

---

## 🗺 Development Phases

| Phase | Timeline | Focus Area | Key Milestone |
|---|---|---|---|
| **0** | Month 1, Wk 1–2 | Project Foundation | Docker, CI/CD, health check endpoint live |
| **1** | Month 1, Wk 3–4 | Auth & Multi-Tenancy | Secure login, tenant auto-provisioning, RBAC |
| **2** | Month 2, Wk 1–2 | Dataset Management | Upload, validate, clean, profile, store |
| **3** | Month 2, Wk 1–2 | Org & Workspace UI | Team management, member invitations |
| **4** | Month 2, Wk 3–4 | Dashboard Builder | Drag-drop widgets, ECharts, manual KPIs |
| **5** | Month 2, Wk 3–4 | Business Intelligence | KPI tracking, variance analysis, trends |
| **6** | Month 3, Wk 1–2 | AI Copilot | Chat with data, Q&A, contextual suggestions |
| **7** | Month 3, Wk 3–4 | Forecasting Engine | Prophet/ARIMA, scenario planning, charts |
| **8** | Month 4, Wk 1–2 | AI Excel Generator | Full 20-step pipeline, .xlsx download |
| **9** | Month 4, Wk 3–4 | AI Dashboard & Report Generator | One-click AI generation |
| **10** | Month 4, Wk 3–4 | Machine Learning Studio | No-code classification, clustering |
| **11** | Month 5, Wk 1–2 | Automation & Notifications | Celery jobs, email alerts, webhooks |
| **12** | Month 5, Wk 3–4 | Billing & Subscriptions | Stripe, tiers, usage-based billing |
| **13** | Month 5, Wk 3–4 | Admin Panel | Tenant mgmt, feature flags, monitoring |
| **14** | Month 6, Wk 1–2 | QA & Performance | Load tests, edge case resolution |
| **15** | Month 6, Wk 3–4 | Security Audit & Launch | Hardening, penetration testing, **Go Live** |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Python 3.12+
- Docker & Docker Compose
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/data-insight.git
cd data-insight
```

### 2. Configure Environment Variables

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
# Fill in values as documented below
```

### 3. Start All Services

```bash
docker compose up --build
```

This starts:

| Service | URL |
|---|---|
| **Next.js Frontend** | `http://localhost:3000` |
| **FastAPI Backend** | `http://localhost:8000` |
| **Swagger UI (API Docs)** | `http://localhost:8000/docs` |
| **Flower (Celery Monitor)** | `http://localhost:5555` |
| **Redis** | `localhost:6379` |

### 4. Run Database Migrations

```bash
docker compose exec backend alembic upgrade head
```

---

## 🔧 Environment Variables

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (`backend/.env`)

```env
# Application
APP_ENV=development
SECRET_KEY=your-secret-key-minimum-32-characters
ALLOWED_ORIGINS=http://localhost:3000

# Master Database
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/datainsight

# Supabase (Master Project)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis
REDIS_URL=redis://localhost:6379/0

# AI Models
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Email
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@datainsight.ai

# Billing
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Monitoring
PROMETHEUS_ENABLED=true
```

---

## 📘 Documentation

Full documentation is organized in `/docs`:

```
docs/
├── prompts/
│   ├── 00-master-project-prompt.md
│   ├── 01-backend.md
│   ├── 02-database.md
│   ├── 03-frontend.md
│   ├── 04-ai.md
│   └── 05-excel-generator.md
└── volumes/
    ├── vol-01-project-vision.md
    ├── vol-02-business-analysis.md
    ├── vol-03-features.md
    ├── vol-04-user-roles.md
    ├── vol-05-database.md
    ├── vol-06-backend.md
    ├── vol-07-frontend.md
    ├── vol-08-atomic-design.md
    ├── vol-09-api-documentation.md
    ├── vol-10-ai-architecture.md
    └── ... (29 volumes total)
```

---

## 📄 License

This project is proprietary software. All rights reserved.

Copyright © 2026 Data Insight. Unauthorized copying, distribution, or use without explicit written permission is strictly prohibited.

---

<div align="center">

**Built with precision. Powered by world-class AI.**

[![Made with Next.js](https://img.shields.io/badge/Made%20with-Next.js-000000?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Powered by FastAPI](https://img.shields.io/badge/Powered%20by-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![AI by OpenAI & Anthropic](https://img.shields.io/badge/AI-OpenAI%20%26%20Anthropic-10B981?style=for-the-badge)](/)

<br />

*Data Insight — Where Raw Data Becomes Executive Intelligence.*

</div>
