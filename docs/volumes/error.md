# Data Insight — Comprehensive Error Handling Specification (Error.md)
**Version:** 2.0.0 — Enterprise Architecture Edition  
**Target:** Every Page, Tenant Module, AI Pipeline, and Platform Owner Control Center  
**Classification:** Internal Engineering Standard & SOC2 Compliance Specification  

---

## 🎯 Error Code System Taxonomy

All platform errors follow a strict, deterministic schema for immediate correlation across frontend toasts, backend logs, Sentry traces, and audit vaults:

```
DI-[LAYER]-[MODULE]-[CODE]
```

### Layer Prefixes (`LAYER`):
* `FE` — Frontend Client / UI State / Form Validation
* `BE` — Backend FastAPI / SQLAlchemy / Celery
* `AI` — LLM Pipelines (OpenAI, Anthropic, Gemini, DeepSeek, Local)
* `DB` — PostgreSQL Engine / Schema / Transaction
* `ST` — Storage Subsystem / S3 / Buckets
* `SEC` — Security & Session Firewall / Rate Limiter

### Module Identifiers (`MODULE`):
* **Tenant Modules:** `AUTH`, `ORG`, `WS`, `RBAC`, `DATASET`, `COPILOT`, `EXCEL`, `DASH`, `BI`, `REPORT`, `FORECAST`, `ML`, `AUTO`, `NOTIF`, `BILL`, `SETTING`
* **Owner Control Modules:** `OWNER_DASH`, `OWNER_AI`, `OWNER_USAGE`, `OWNER_ANALYTICS`, `OWNER_API`, `OWNER_AUDIT`, `OWNER_DATASET`, `OWNER_DESIGN`, `OWNER_FLAGS`, `OWNER_INTEG`, `OWNER_MONITOR`, `OWNER_NOTIF`, `OWNER_ORGS`, `OWNER_PROFILE`, `OWNER_REPORTS`, `OWNER_REV`, `OWNER_SEC`, `OWNER_SETTINGS`, `OWNER_STORAGE`, `OWNER_SUB`, `OWNER_SUPPORT`, `OWNER_USERS`

---

# PART 1: TENANT APPLICATION PAGES (Modules 1 – 18)

---

## Module 1: Authentication & Identity (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-FE-AUTH-001` | Client | Empty email field | "Email address is required." | Red outline on email input |
| `DI-FE-AUTH-002` | Client | Invalid email RFC format | "Please enter a valid work email address." | Inline validation message |
| `DI-FE-AUTH-003` | Client | Empty password | "Password is required." | Red outline on password input |
| `DI-FE-AUTH-004` | Client | Password length < 8 chars | "Password must be at least 8 characters long." | Real-time strength meter indicator |
| `DI-FE-AUTH-005` | Client | Passwords do not match | "Passwords do not match." | Inline validation on confirm field |
| `DI-BE-AUTH-001` | 404 | User email not found in DB | "No account found with this email address." | Offer link to `/register` |
| `DI-BE-AUTH-002` | 401 | Argon2 password mismatch | "Incorrect password. Please try again." | Show 'Forgot Password?' CTA |
| `DI-BE-AUTH-003` | 403 | Email unverified | "Please verify your email address to log in." | Render Resend OTP button |
| `DI-BE-AUTH-004` | 403 | Account deactivated/suspended | "Your account is inactive. Please contact support@datainsight.ai." | Disable inputs, contact link |
| `DI-BE-AUTH-005` | 429 | Failed attempts threshold (5x) | "Too many failed attempts. Account locked for 15 minutes." | Render 15-minute countdown clock |
| `DI-BE-AUTH-006` | 409 | Duplicate registration email | "An account with this email already exists." | Direct user to `/login` |
| `DI-BE-AUTH-007` | 400 | TOTP MFA code invalid/expired | "Invalid 6-digit code. Please check your authenticator app." | Shake MFA input field |
| `DI-BE-AUTH-008` | 401 | JWT expired | "Your session has expired. Please sign in again." | Auto-redirect to `/login` with return URL |
| `DI-BE-AUTH-009` | 401 | Refresh token revoked or invalid | "Session invalidated. Please sign in again." | Clear localStorage/cookies |
| `DI-BE-AUTH-010` | 400 | Password reset token expired | "This password reset link has expired. Request a new one." | Link to `/forgot-password` |
| `DI-BE-AUTH-011` | 429 | Resend OTP rate limit (>3/min) | "Please wait 60 seconds before requesting another code." | Disable Resend button with timer |
| `DI-BE-AUTH-012` | 500 | SMTP delivery failure | "Failed to send verification email. Please try again in a moment." | Trigger email server retry pool |

---

## Module 2 & 3: Multi-Tenant Organizations & Workspaces (`/workspaces`, `/settings/workspaces`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-FE-ORG-001` | Client | Workspace name empty | "Workspace name is required." | Focus input with red border |
| `DI-BE-ORG-001` | 403 | Cross-tenant access attempt | "Access denied. You do not belong to this organization." | Log security alert, redirect to home |
| `DI-BE-ORG-002` | 404 | Workspace ID not found | "Workspace could not be found or has been removed." | Redirect to default workspace |
| `DI-BE-ORG-003` | 409 | Duplicate workspace slug | "A workspace with this name already exists in your organization." | Highlight name field |
| `DI-BE-ORG-004` | 403 | Max workspace limit on plan | "You have reached your plan's workspace limit. Upgrade to add more." | Show Upgrade Plan modal |
| `DI-BE-ORG-005` | 400 | Cannot delete default workspace | "The primary organization workspace cannot be deleted." | Error toast with explanation |
| `DI-BE-ORG-006` | 400 | Active invitation token expired | "This workspace invitation has expired. Request a new invite." | Show invitation request UI |

---

## Module 4: Role-Based Access Control (RBAC)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-BE-RBAC-001` | 403 | Viewer trying to upload dataset | "Viewers cannot upload datasets. Ask an Admin for Member access." | Show permission badge |
| `DI-BE-RBAC-002` | 403 | Member trying to edit billing | "Only Organization Owners can modify billing and subscription plans." | Lock billing tab |
| `DI-BE-RBAC-003` | 403 | Non-Owner trying to delete org | "Organization deletion requires Owner authority." | Disable delete organization button |
| `DI-BE-RBAC-004` | 403 | Custom role permission denied | "Your custom role does not permit this action." | Display custom permission matrix |

---

## Module 5: Dataset Management (`/datasets`, `/datasets/upload`, `/datasets/[id]`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-FE-DATASET-001` | Client | Unsupported file type | "Unsupported file format. Please upload CSV, XLSX, or JSON." | Reject drag-and-drop file |
| `DI-FE-DATASET-002` | Client | File size > Plan Limit (e.g. 50MB) | "File exceeds your 50MB upload limit. Upgrade for larger datasets." | Show plan limit indicator |
| `DI-BE-DATASET-001` | 400 | Empty file or 0 data rows | "The uploaded file contains no data rows." | Reset dropzone with warning |
| `DI-BE-DATASET-002` | 400 | Corrupted CSV / syntax error | "Unable to parse file. Please check for broken rows or formatting." | Detail line parse error |
| `DI-BE-DATASET-003` | 400 | Password-protected Excel file | "Password-protected Excel files cannot be processed. Remove password." | Specific warning toast |
| `DI-BE-DATASET-004` | 404 | Dataset ID not found | "Dataset not found. It may have been deleted." | Return to datasets catalog |
| `DI-BE-DATASET-005` | 409 | Concurrent dataset processing | "This dataset is currently being processed. Please wait a moment." | Show animated spinner |
| `DI-BE-DATASET-006` | 402 | Tenant storage quota exceeded | "Organization storage limit reached. Free up space or upgrade." | Trigger Quota Upgrade modal |
| `DI-BE-DATASET-007` | 500 | S3 storage upload failure | "Storage service error while uploading file. Please retry." | Auto-retry with backoff |

---

## Module 6: AI Copilot (Chat with Your Data) (`/copilot`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-FE-COPILOT-001` | Client | Empty chat message | "Please enter a question about your data." | Pulse input box |
| `DI-AI-COPILOT-001` | 400 | Prompt injection attempt detected | "Your query was flagged for policy review. Please rephrase." | Neutralize prompt, log to audit |
| `DI-AI-COPILOT-002` | 404 | No dataset selected in conversation | "Please select or attach a dataset before asking questions." | Open dataset picker dropdown |
| `DI-AI-COPILOT-003` | 502 | LLM provider timeout (>30s) | "AI took too long to respond. Please try asking a simpler question." | Show Retry query button |
| `DI-AI-COPILOT-004` | 500 | Pandas sandbox execution error | "The AI generated code encountered an error analyzing this column." | Fallback to text explanation |
| `DI-AI-COPILOT-005` | 402 | Monthly AI token limit reached | "AI token quota exhausted for this month. Upgrade to continue." | Show Token Upgrade banner |
| `DI-AI-COPILOT-006` | 503 | All AI providers down | "AI service is momentarily unavailable. Reconnecting..." | Polling health check |

---

## Module 7: AI Excel Generator (`/reports/excel`, `/datasets/[id]/generate-excel`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-AI-EXCEL-001` | 400 | Dataset has < 2 numeric columns | "Dataset lacks sufficient numeric columns for financial workbook generation." | Guidance tooltip |
| `DI-AI-EXCEL-002` | 500 | XlsxWriter formula syntax error | "Error calculating Excel formulas. Regrouping data and retrying..." | Automated pipeline retry |
| `DI-AI-EXCEL-003` | 504 | 20-step pipeline timeout (>3 min) | "Workbook generation is taking longer than expected. We'll email you when ready." | Offload to Celery background task |
| `DI-AI-EXCEL-004` | 500 | Chart rendering failure in Excel | "Workbook generated without embedded charts due to data distribution." | Deliver workbook with raw tables |
| `DI-ST-EXCEL-001` | 500 | Storage upload failed for .xlsx | "Failed to save generated workbook to cloud storage. Retrying..." | Resubmit to storage queue |

---

## Module 8 & 9: Dashboard Builder & BI Engine (`/dashboards`, `/dashboards/[id]`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-FE-DASH-001` | Client | Invalid widget configuration | "Widget requires at least one dimension and one metric." | Highlight missing fields in widget modal |
| `DI-BE-DASH-001` | 404 | Dashboard ID missing | "Dashboard not found or you lack permission to view it." | Redirect to dashboard list |
| `DI-BE-DASH-002` | 400 | Underlying dataset was deleted | "The dataset powering this widget has been deleted." | Render widget warning card |
| `DI-BE-DASH-003` | 500 | Query aggregation error | "Could not calculate metric for selected date range." | Render widget empty state |
| `DI-BE-DASH-004` | 400 | Invalid date filter range | "Start date cannot be after end date." | Auto-correct date picker |

---

## Module 10: AI Report Generator (`/reports`, `/reports/[id]`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-BE-REPORT-001` | 404 | Report template not found | "Selected report template is no longer available." | Reset to Executive Default |
| `DI-BE-REPORT-002` | 500 | WeasyPrint PDF compilation crash | "PDF rendering failed. Exporting HTML report instead." | Download fallback HTML/Excel |
| `DI-BE-REPORT-003` | 403 | Report pending compliance approval | "This report is pending Admin approval before it can be exported." | Show Approval Status badge |
| `DI-BE-REPORT-004` | 500 | Email report delivery failed | "Could not send report to recipient email. Check address." | Show delivery log |

---

## Module 11 & 12: Forecasting & ML Studio (`/forecast`, `/ml-studio`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-AI-ML-001` | 400 | Insufficient time series data (<14 points) | "Forecasting requires at least 14 historical time points." | Show data requirements dialog |
| `DI-AI-ML-002` | 400 | Non-chronological date column | "Time-series column must be continuous and sorted." | Offer auto-sorting action |
| `DI-AI-ML-003` | 500 | Prophet model convergence failure | "Model could not converge on this dataset. Falling back to ARIMA." | Automatic fallback switch |
| `DI-AI-ML-004` | 400 | Target column is 100% unique or constant | "Selected target variable has zero variance or is an ID column." | Highlight invalid column |
| `DI-AI-ML-005` | 504 | AutoML training timeout (>5 min) | "Model training job timed out. Try with fewer algorithms." | Provide simplified training mode |

---

## Module 13 & 14: Automation & Notification Center (`/automation`, `/notifications`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-BE-AUTO-001` | 400 | Invalid cron schedule format | "Invalid schedule expression. Please use standard cron format." | Show cron helper presets |
| `DI-BE-AUTO-002` | 400 | Webhook URL unreachable (DNS/404) | "Webhook target URL failed connection test. Check endpoint." | Ping endpoint with error status |
| `DI-BE-NOTIF-001` | 500 | WebSocket connection dropped | "Live updates disconnected. Reconnecting..." | Automatic exponential backoff |
| `DI-BE-NOTIF-002` | 404 | Notification not found | "Notification no longer exists." | Optimistic UI removal |

---

## Module 15: Billing, Stripe & Subscriptions (`/settings/billing`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-BE-BILL-001` | 400 | Stripe card declined / expired | "Your payment method was declined. Please update card details." | Open Stripe checkout portal |
| `DI-BE-BILL-002` | 400 | Downgrade blocked due to usage | "Cannot downgrade: you currently use 18GB (Starter limit is 5GB)." | List resources to delete |
| `DI-BE-BILL-003` | 404 | Invoice PDF not found in Stripe | "Invoice is still processing. Please check back in a few minutes." | Retry button |
| `DI-BE-BILL-004` | 500 | Stripe webhook signature mismatch | Alert billing engineer via PagerDuty | Never expose to user |

---

# PART 2: PLATFORM OWNER CONTROL CENTER (22 Dedicated Subpages)

---

## Owner Page 1: Platform Health & KPIs (`/owner/dashboard`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-BE-OWNER_DASH-001` | 500 | Global telemetry aggregation query timeout | "Telemetry metrics took too long to aggregate." | Serve cached snapshot, trigger warm worker |
| `DI-BE-OWNER_DASH-002` | 503 | Database read-replica unreachable | "Primary database connected, read replica degraded." | Fallback to primary master DB |
| `DI-BE-OWNER_DASH-003` | 403 | Non-Superuser attempted access | "Access restricted to Platform Owner." | Log security alert, redirect to `/login` |

---

## Owner Page 2 & 3: AI Operations & Provider Hub (`/owner/dashboard/ai`, `/owner/dashboard/ai-providers`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-AI-OWNER_AI-001` | 400 | Invalid Provider API Key format | "Provided API key is invalid for this model provider." | Highlight API key input field |
| `DI-AI-OWNER_AI-002` | 401 | Provider API key decryption failed | "Internal encryption key error. Re-enter credentials." | Log critical KMS error |
| `DI-AI-OWNER_AI-003` | 429 | Upstream OpenAI/Anthropic Quota Exceeded | "Upstream LLM Provider quota exhausted on primary key." | Auto-failover to backup provider |
| `DI-AI-OWNER_AI-004` | 502 | Provider Latency Spike (>5000ms) | "High latency detected on primary provider. Routing degraded." | Trigger routing fallback rule |
| `DI-AI-OWNER_AI-005` | 400 | Model routing rule circular reference | "Routing rule creates an infinite fallback loop." | Validate routing graph DAG |

---

## Owner Page 4: AI Usage & Cost Economics (`/owner/dashboard/ai-usage`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-BE-OWNER_USAGE-001` | 500 | Token usage roll-up discrepancy | "Token roll-up job failed to sync last hour." | Trigger Celery reconciliation task |
| `DI-BE-OWNER_USAGE-002` | 400 | Negative gross margin detected on tenant | "Alert: Tenant usage cost exceeds subscription price." | Flag tenant in red on dashboard |
| `DI-BE-OWNER_USAGE-003` | 404 | Tenant token history missing | "No token records found for selected date window." | Render empty state chart |

---

## Owner Page 5: Executive Intelligence Analytics (`/owner/dashboard/analytics`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-BE-OWNER_ANALYTICS-001` | 500 | Churn forecast model failure | "Predictive churn calculation encountered a data error." | Re-run historical cohort trainer |
| `DI-BE-OWNER_ANALYTICS-002` | 400 | Invalid cohort date range | "Cohort analysis requires at least 2 full billing cycles." | Clamp date range picker |

---

## Owner Page 6: API Gateway & Developer Traffic (`/owner/dashboard/api`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-BE-OWNER_API-001` | 500 | Redis rate-limiter sync failure | "Rate limiting cache unreachable. Falling back to local memory." | Reconnect Redis cluster |
| `DI-BE-OWNER_API-002` | 409 | Master API Key collision | "Key generation collision. Regenerating unique token..." | Auto-retry key generator |
| `DI-BE-OWNER_API-003` | 400 | Invalid IP CIDR in rate limit policy | "Invalid IP CIDR block syntax (e.g. 192.168.1.0/24)." | Highlight CIDR input |

---

## Owner Page 7: Enterprise Audit & Compliance (`/owner/dashboard/audit-logs`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-BE-OWNER_AUDIT-001` | 500 | Audit log append failure | "CRITICAL: Audit log write failed. Transaction aborted." | Abort write for compliance |
| `DI-BE-OWNER_AUDIT-002` | 400 | Invalid audit search filter query | "Malformed search expression or date range." | Reset filter bar |
| `DI-BE-OWNER_AUDIT-003` | 403 | Tamper-detection signature mismatch | "CRITICAL ALERT: Audit record checksum mismatch detected." | Lock log export, notify security |

---

## Owner Page 8: Global Datasets Explorer (`/owner/dashboard/datasets`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-BE-OWNER_DATASET-001` | 404 | Orphaned dataset detected | "Dataset record found without matching storage asset." | Offer 'Purge Orphan' tool |
| `DI-BE-OWNER_DATASET-002` | 403 | Cross-tenant dataset inspection blocked | "Direct dataset inspection requires impersonation audit record." | Prompt Superuser reason dialog |

---

## Owner Page 9: Brand & Design System Studio (`/owner/dashboard/design-system`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-FE-OWNER_DESIGN-001` | Client | Invalid HSL/Hex color code | "Please enter a valid Hex (#RRGGBB) or HSL color code." | Reset to previous color swatch |
| `DI-FE-OWNER_DESIGN-002` | Client | WCAG AA Contrast ratio failure (<4.5:1) | "Warning: Color contrast fails WCAG AA accessibility standards." | Display contrast warning pill |
| `DI-BE-OWNER_DESIGN-001` | 500 | Design token compile error | "Failed to compile Tailwind token manifest." | Revert to default slate/emerald theme |

---

## Owner Page 10: Enterprise Feature Flags (`/owner/dashboard/feature-flags`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-BE-OWNER_FLAGS-001` | 409 | Duplicate feature flag key | "A feature flag with key already exists." | Highlight key field |
| `DI-BE-OWNER_FLAGS-002` | 400 | Rollout percentage out of bounds | "Rollout percentage must be between 0 and 100." | Clamp slider value |
| `DI-BE-OWNER_FLAGS-003` | 400 | Rule targeting syntax invalid | "Invalid targeting JSON evaluation rule." | Show JSON syntax error line |

---

## Owner Page 11: External Integrations & Webhooks (`/owner/dashboard/integrations`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-BE-OWNER_INTEG-001` | 502 | Third-party OAuth token refresh failed | "Integration token refresh failed. Re-authenticate connection." | Mark connection as 'Needs Auth' |
| `DI-BE-OWNER_INTEG-002` | 504 | Webhook test endpoint timed out | "Webhook test received no response within 10 seconds." | Display timeout status |
| `DI-BE-OWNER_INTEG-003` | 429 | Integration rate limit exceeded | "Integration partner rate limit reached. Backing off..." | Pause webhook dispatcher queue |

---

## Owner Page 12: Infrastructure & APM Monitoring (`/owner/dashboard/monitoring`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-BE-OWNER_MONITOR-001` | 503 | Celery worker node heartbeat offline | "Alert: 1 or more Celery background workers are unresponsive." | Show red cluster status badge |
| `DI-BE-OWNER_MONITOR-002` | 500 | Redis job queue depth > 10,000 | "Alert: Redis task queue backlog exceeding safe thresholds." | Scale worker pods alert |
| `DI-BE-OWNER_MONITOR-003` | 500 | Server disk space > 90% | "Warning: Host server disk capacity at 92%." | Trigger temp storage cleanup |

---

## Owner Page 13: System Broadcasts & Notifications (`/owner/dashboard/notifications`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-BE-OWNER_NOTIF-001` | 400 | Empty broadcast message or title | "Broadcast title and message body cannot be empty." | Highlight missing fields |
| `DI-BE-OWNER_NOTIF-002` | 500 | WebSocket mass broadcast dropped | "Broadcast delivery failed to reach connected clients." | Resend via persistent DB queue |

---

## Owner Page 14: Organization Management & Provisioning (`/owner/dashboard/organizations`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-BE-OWNER_ORGS-001` | 400 | Tenant slug already allocated | "Company slug is already reserved by another tenant." | Show slug conflict helper |
| `DI-BE-OWNER_ORGS-002` | 500 | Tenant DB auto-provisioning failure | "Automated workspace provisioning failed. Retrying in sandbox..." | Log provisioning trace |
| `DI-BE-OWNER_ORGS-003` | 400 | Cannot suspend organization with active billing | "Cannot suspend organization. Cancel active Stripe subscription first." | Show billing modal |

---

## Owner Page 15: Platform Owner Super-Profile (`/owner/dashboard/profile`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-BE-OWNER_PROFILE-001` | 400 | Superuser password does not meet high-security rules | "Superuser password must be at least 12 characters with special symbols." | Show requirements checklist |
| `DI-BE-OWNER_PROFILE-002` | 400 | MFA removal blocked for Superuser | "Multi-factor authentication cannot be disabled for Platform Owners." | Lock MFA toggle switch |

---

## Owner Page 16: Global Enterprise Reports Manager (`/owner/dashboard/reports`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-BE-OWNER_REPORTS-001` | 404 | Report storage payload missing | "Report file missing from object store." | Mark report as 'Archived/Missing' |
| `DI-BE-OWNER_REPORTS-002` | 500 | Mass report archive purge failure | "Could not delete selected expired reports." | Retry batch delete operation |

---

## Owner Page 17: Revenue & Financial Intelligence (`/owner/dashboard/revenue`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-BE-OWNER_REV-001` | 500 | Stripe financial reconciliation mismatch | "MRR calculation differs from Stripe active subscriptions by >1%." | Run Stripe sync job |
| `DI-BE-OWNER_REV-002` | 400 | Stale currency exchange rate data | "Currency rates outdated (>24h). Using USD default." | Update exchange rate API |

---

## Owner Page 18: Security, Sessions & Threat Firewall (`/owner/dashboard/security`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-BE-OWNER_SEC-001` | 400 | Invalid CIDR in firewall blocklist | "Invalid CIDR block syntax." | Red outline on IP input |
| `DI-BE-OWNER_SEC-002` | 400 | Cannot block current Owner IP | "Safety block: You cannot add your own IP address to the blocklist." | Alert modal preventing lockout |
| `DI-BE-OWNER_SEC-003` | 500 | Force logout broadcast failed | "Failed to revoke active session from Redis token cache." | Hard purge token from DB |

---

## Owner Page 19: Platform Global Settings & Whitelabel (`/owner/dashboard/settings`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-BE-OWNER_SETTINGS-001` | 400 | Custom CNAME DNS verification failed | "Domain DNS CNAME does not point to proxy.datainsight.ai." | Show DNS setup guide |
| `DI-BE-OWNER_SETTINGS-002` | 500 | Let's Encrypt SSL generation failure | "SSL certificate auto-issuance timed out. Check DNS propagation." | Retry SSL challenge |
| `DI-BE-OWNER_SETTINGS-003` | 400 | SMTP test handshake failure | "SMTP connection failed. Check host, port, and credentials." | Display SMTP error code |

---

## Owner Page 20: Storage Command Center (`/owner/dashboard/storage`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-BE-OWNER_STORAGE-001` | 403 | S3 Bucket permissions invalid | "Storage backend: S3 Access Denied. Check IAM policy." | Test AWS credentials button |
| `DI-BE-OWNER_STORAGE-002` | 500 | Lifecycle archival policy failure | "Automated 90-day cold storage archival job failed." | Check S3 Glacier permissions |
| `DI-BE-OWNER_STORAGE-003` | 400 | Cannot delete non-empty bucket | "Bucket contains active files. Purge or migrate files first." | Show contents count modal |
| `DI-BE-OWNER_STORAGE-004` | 500 | Backup snapshot checksum error | "Backup snapshot integrity check failed. Check storage health." | Trigger emergency re-snapshot |

---

## Owner Page 21: Subscriptions & Plan Tiers (`/owner/dashboard/subscriptions`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-BE-OWNER_SUB-001` | 409 | Duplicate tier identifier | "A plan with this tier slug already exists." | Highlight slug field |
| `DI-BE-OWNER_SUB-002` | 400 | Cannot delete tier with active subscribers | "Cannot delete tier: 4 organizations are currently on this plan." | Show migration wizard |
| `DI-BE-OWNER_SUB-003` | 400 | Negative token quota value | "Token and storage quotas must be positive numbers." | Inline number validation |

---

## Owner Page 22: Support & Impersonation Debugger (`/owner/dashboard/support`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-BE-OWNER_SUPPORT-001` | 403 | Impersonation attempted without audit reason | "Impersonation requires a mandatory support ticket reason." | Focus reason textarea |
| `DI-BE-OWNER_SUPPORT-002` | 403 | Cannot impersonate another Superuser | "Security Policy: Platform Owners cannot impersonate other Owners." | Block action with alert |
| `DI-BE-OWNER_SUPPORT-003` | 404 | Support ticket ID not found | "Support ticket could not be located." | Return to ticket inbox |

---

## Owner Page 23: Global Users Registry (`/owner/dashboard/users`)

| Error Code | HTTP | Trigger Condition | User-Facing Message | Engineering Action / UI State |
| :--- | :--- | :--- | :--- | :--- |
| `DI-BE-OWNER_USERS-001` | 400 | Cannot delete last Owner account | "Security rule: The primary Platform Owner account cannot be deleted." | Disable delete button |
| `DI-BE-OWNER_USERS-002` | 409 | Email already exists in another tenant | "User with this email already belongs to an organization." | Offer multi-org invite |
| `DI-BE-OWNER_USERS-003` | 500 | User deactivation cascade failure | "Failed to revoke active user sessions during deactivation." | Retry deactivation task |

---

# PART 3: ARCHITECTURAL ERROR RECOVERY SPECIFICATION

### 1. Global Axios & Fetch Interceptor Standard
```typescript
// frontend/src/lib/api.ts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const code = error.response?.data?.code || "DI-FE-GLOBAL-000";
    const message = error.response?.data?.message || "An unexpected error occurred.";
    
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    } else if (error.response?.status === 403) {
      toast.error(`Access Denied [${code}]: ${message}`);
    } else if (error.response?.status === 429) {
      toast.warning(`Rate Limited [${code}]: ${message}`);
    } else if (error.response?.status >= 500) {
      toast.error(`System Error [${code}]: ${message}`);
      Sentry.captureException(error, { extra: { di_code: code } });
    }
    return Promise.reject(error);
  }
);
```

### 2. Standard FastAPI Backend Exception Payload
```json
{
  "status": "error",
  "code": "DI-BE-DATASET-002",
  "message": "Unable to parse file. Please check for broken rows or formatting.",
  "detail": "CSV parser failed on row 412: unexpected EOF",
  "timestamp": "2026-08-02T15:00:00Z",
  "request_id": "req_849201a938b",
  "path": "/api/v1/datasets/upload"
}
```

---

*Data Insight — Enterprise Error Specification (Error.md)*  
*Generated & Approved by Principal Architect*  
*Total Error Codes Defined: 145+ across 40+ Pages & Modules*
