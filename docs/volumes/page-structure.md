# Data Insight — Page Structure

**Total Pages: 61** | **Roles: 5** | **Framework: Next.js 15 App Router**

Each user only sees pages their role has access to.
Route groups `(auth)` and `(dashboard)` are invisible in the URL.

---

## Role Legend

| Symbol | Meaning |
|---|---|
| ✅ | Full access (read + write) |
| 👀 | View only (read) |
| ❌ | No access (page hidden) |

---

## 👑 Super Admin

> Full access to every page on the platform.

```
src/app/
│
├── (auth)/
│   ├── login/
│   │   └── page.tsx                          → /login
│   ├── register/
│   │   └── page.tsx                          → /register
│   ├── forgot-password/
│   │   └── page.tsx                          → /forgot-password
│   ├── reset-password/
│   │   └── page.tsx                          → /reset-password
│   └── verify-email/
│       └── page.tsx                          → /verify-email
│
├── onboarding/
│   └── page.tsx                              → /onboarding
│
├── share/
│   └── [token]/
│       └── page.tsx                          → /share/:token  (public, no login)
│
└── (dashboard)/
    ├── home/
    │   └── page.tsx                          → /home
    ├── analytics/
    │   └── page.tsx                          → /analytics
    ├── notifications/
    │   └── page.tsx                          → /notifications
    │
    ├── datasets/
    │   ├── page.tsx                          → /datasets
    │   ├── upload/
    │   │   └── page.tsx                      → /datasets/upload
    │   └── [id]/
    │       ├── page.tsx                      → /datasets/:id
    │       └── history/
    │           └── page.tsx                  → /datasets/:id/history
    │
    ├── ai-copilot/
    │   └── page.tsx                          → /ai-copilot
    │
    ├── excel-generator/
    │   ├── page.tsx                          → /excel-generator
    │   └── [jobId]/
    │       └── result/
    │           └── page.tsx                  → /excel-generator/:jobId/result
    │
    ├── dashboards/
    │   ├── page.tsx                          → /dashboards
    │   ├── create/
    │   │   └── page.tsx                      → /dashboards/create
    │   └── [id]/
    │       ├── page.tsx                      → /dashboards/:id
    │       └── edit/
    │           └── page.tsx                  → /dashboards/:id/edit
    │
    ├── reports/
    │   ├── page.tsx                          → /reports
    │   ├── create/
    │   │   └── page.tsx                      → /reports/create
    │   ├── [id]/
    │   │   └── page.tsx                      → /reports/:id
    │   └── scheduled/
    │       └── page.tsx                      → /reports/scheduled
    │
    ├── forecasting/
    │   ├── page.tsx                          → /forecasting
    │   └── [id]/
    │       └── page.tsx                      → /forecasting/:id
    │
    ├── ml-studio/
    │   ├── page.tsx                          → /ml-studio
    │   └── [modelId]/
    │       └── page.tsx                      → /ml-studio/:modelId
    │
    ├── team/
    │   ├── page.tsx                          → /team
    │   ├── invite/
    │   │   └── page.tsx                      → /team/invite
    │   ├── roles/
    │   │   └── page.tsx                      → /team/roles
    │   └── [userId]/
    │       └── page.tsx                      → /team/:userId
    │
    ├── organizations/
    │   ├── page.tsx                          → /organizations
    │   ├── create/
    │   │   └── page.tsx                      → /organizations/create
    │   └── [id]/
    │       └── page.tsx                      → /organizations/:id
    │
    ├── billing/
    │   ├── page.tsx                          → /billing
    │   ├── invoices/
    │   │   └── page.tsx                      → /billing/invoices
    │   └── usage/
    │       └── page.tsx                      → /billing/usage
    │
    ├── settings/
    │   ├── page.tsx                          → /settings
    │   ├── security/
    │   │   └── page.tsx                      → /settings/security
    │   ├── api-keys/
    │   │   └── page.tsx                      → /settings/api-keys
    │   ├── integrations/
    │   │   └── page.tsx                      → /settings/integrations
    │   ├── notifications/
    │   │   └── page.tsx                      → /settings/notifications
    │   └── workspace/
    │       └── page.tsx                      → /settings/workspace
    │
    ├── admin/                                ← Super Admin ONLY
    │   ├── page.tsx                          → /admin
    │   ├── users/
    │   │   └── page.tsx                      → /admin/users
    │   ├── ai-models/
    │   │   └── page.tsx                      → /admin/ai-models
    │   ├── prompt-manager/
    │   │   └── page.tsx                      → /admin/prompt-manager
    │   ├── audit-logs/
    │   │   └── page.tsx                      → /admin/audit-logs
    │   └── activity-logs/
    │       └── page.tsx                      → /admin/activity-logs
    │
    └── profile/
        ├── page.tsx                          → /profile
        └── change-password/
            └── page.tsx                      → /profile/change-password
```

---

## Page Access Matrix

| Page / Route | Super Admin | Org Admin | Manager | Analyst | Viewer |
|---|---|---|---|---|---|
| `/login` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/register` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/forgot-password` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/verify-email` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/onboarding` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/share/:token` | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Core** | | | | | |
| `/home` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/analytics` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/notifications` | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Datasets** | | | | | |
| `/datasets` | ✅ | ✅ | ✅ | ✅ | 👀 |
| `/datasets/upload` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `/datasets/:id` | ✅ | ✅ | ✅ | ✅ | 👀 |
| `/datasets/:id/history` | ✅ | ✅ | ✅ | ✅ | ❌ |
| **AI** | | | | | |
| `/ai-copilot` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `/excel-generator` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `/excel-generator/:jobId/result` | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Dashboards** | | | | | |
| `/dashboards` | ✅ | ✅ | ✅ | ✅ | 👀 |
| `/dashboards/create` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `/dashboards/:id` | ✅ | ✅ | ✅ | ✅ | 👀 |
| `/dashboards/:id/edit` | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Reports** | | | | | |
| `/reports` | ✅ | ✅ | ✅ | ✅ | 👀 |
| `/reports/create` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `/reports/:id` | ✅ | ✅ | ✅ | ✅ | 👀 |
| `/reports/scheduled` | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Forecasting** | | | | | |
| `/forecasting` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `/forecasting/:id` | ✅ | ✅ | ✅ | ✅ | ❌ |
| **ML Studio** | | | | | |
| `/ml-studio` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `/ml-studio/:modelId` | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Team** | | | | | |
| `/team` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/team/invite` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/team/roles` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/team/:userId` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Organizations** | | | | | |
| `/organizations` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/organizations/create` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/organizations/:id` | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Billing** | | | | | |
| `/billing` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/billing/invoices` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/billing/usage` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Settings** | | | | | |
| `/settings` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/settings/security` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/settings/api-keys` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/settings/integrations` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/settings/notifications` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/settings/workspace` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Admin Panel** | | | | | |
| `/admin` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/admin/users` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/admin/ai-models` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/admin/prompt-manager` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/admin/audit-logs` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/admin/activity-logs` | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Profile** | | | | | |
| `/profile` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/profile/change-password` | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Page Count by Role

| Role | Pages Accessible |
|---|---|
| 👑 Super Admin | 61 |
| 🏢 Org Admin | 42 |
| 👨‍💼 Manager | 32 |
| 📊 Analyst | 24 |
| 👀 Viewer | 12 |
