# Error Handling Specification
## Data Insight — AI-Powered Business Intelligence Platform
**Version:** 1.0.0  
**Scope:** Every page, module, API endpoint, and AI workflow

---

> **Golden Rule:** Every error must be **User-friendly**, **Actionable**, **Logged**, and **Recoverable**.

---

## ERROR CODE SYSTEM

```
DI-[LAYER]-[MODULE]-[CODE]

DI     = Data Insight
LAYER  = FE | BE | AI | DB | ST
MODULE = AUTH | DATASET | DASH | EXCEL | REPORT | FORECAST | BILL | ADMIN | ML | API
CODE   = 3-digit number
```

### HTTP Status Code Mapping

| Code | Meaning |
|---|---|
| 200 | OK — Successful GET |
| 201 | Created — Successful POST |
| 202 | Accepted — Async Celery job queued |
| 400 | Bad Request — Invalid input |
| 401 | Unauthorized — Missing/invalid JWT |
| 403 | Forbidden — RBAC permission denied |
| 404 | Not Found — Resource missing |
| 409 | Conflict — Duplicate resource |
| 413 | Payload Too Large — File too big |
| 422 | Unprocessable Entity — Pydantic failure |
| 429 | Too Many Requests — Rate limited |
| 402 | Payment Required — Quota exceeded |
| 500 | Internal Server Error |
| 502 | Bad Gateway — AI API unreachable |
| 503 | Service Unavailable — Celery down |
| 504 | Gateway Timeout — AI job timed out |

---

## MODULE 1: AUTHENTICATION

### 1.1 Login (`/login`)

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-BE-AUTH-001 | Email not found | "No account found with this email address." | Show Register link |
| DI-BE-AUTH-002 | Wrong password | "Incorrect password. Please try again." | Show Forgot Password link |
| DI-BE-AUTH-003 | Account not verified | "Please verify your email before logging in." | Show Resend Verification button |
| DI-BE-AUTH-004 | Account suspended | "Your account has been suspended. Contact support@datainsight.ai" | Show support contact |
| DI-BE-AUTH-005 | 5+ failed attempts | "Account temporarily locked for 15 minutes." | Show countdown timer |
| DI-BE-AUTH-006 | JWT creation failure | "Login failed due to a server error. Please try again." | Auto-retry once |
| DI-BE-AUTH-007 | Rate limit exceeded | "Too many login attempts. Please wait 15 minutes." | Disable button with timer |
| DI-BE-AUTH-008 | Supabase Auth down | "Authentication service temporarily unavailable." | Retry button |
| DI-FE-AUTH-001 | Empty email | "Email address is required." | Inline validation |
| DI-FE-AUTH-002 | Invalid email format | "Please enter a valid email address." | Inline validation |
| DI-FE-AUTH-003 | Empty password | "Password is required." | Inline validation |

### 1.2 Register (`/register`)

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-BE-AUTH-010 | Email already registered | "An account with this email already exists." | Show Login link |
| DI-BE-AUTH-011 | Org slug taken | "This company name is already taken. Please choose another." | Inline slug error |
| DI-BE-AUTH-012 | Supabase user creation failed | "Registration failed. Please try again." | Retry button |
| DI-BE-AUTH-013 | Tenant provisioning failed | "Account created but workspace setup failed. Our team has been notified." | Auto-trigger support ticket |
| DI-FE-AUTH-010 | Password < 8 chars | "Password must be at least 8 characters." | Inline validation |
| DI-FE-AUTH-011 | No uppercase in password | "Password must contain at least one uppercase letter." | Inline validation |
| DI-FE-AUTH-012 | No number in password | "Password must contain at least one number." | Inline validation |
| DI-FE-AUTH-013 | Passwords do not match | "Passwords do not match." | Inline on confirm field |
| DI-FE-AUTH-014 | Company name too short | "Company name must be at least 2 characters." | Inline validation |
| DI-FE-AUTH-015 | Terms not accepted | "You must accept the Terms of Service to continue." | Highlight checkbox |

### 1.3 Forgot Password (`/forgot-password`)

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-BE-AUTH-020 | Email not found | "If this email is registered, you will receive a reset link shortly." | Always show (prevent email enumeration) |
| DI-BE-AUTH-021 | Reset email send failure | "Failed to send reset email. Please try again." | Retry button |
| DI-BE-AUTH-022 | Rate limit (3/hour) | "Too many reset requests. Please wait 1 hour." | Show timer |

### 1.4 Reset Password (`/reset-password`)

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-BE-AUTH-030 | Token expired | "This reset link has expired. Please request a new one." | Link to /forgot-password |
| DI-BE-AUTH-031 | Token already used | "This reset link has already been used. Please request a new one." | Link to /forgot-password |
| DI-BE-AUTH-032 | Token invalid | "This reset link is invalid. Please request a new one." | Link to /forgot-password |
| DI-FE-AUTH-030 | Same as old password | "New password must be different from your current password." | Inline validation |

### 1.5 Email Verification (`/verify-email`)

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-BE-AUTH-040 | Token expired | "Your verification link has expired. We have sent a new one." | Auto-resend |
| DI-BE-AUTH-041 | Token invalid | "This verification link is invalid." | Show Request New Link button |
| DI-BE-AUTH-042 | Already verified | "Your email is already verified. You can now log in." | Redirect to /login |

---

## MODULE 2: DASHBOARD HOME (`/dashboard`)

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-BE-DASH-001 | KPI summary load failure | "Unable to load your KPIs. Please refresh." | Refresh button in widget |
| DI-BE-DASH-002 | Activity feed failure | "Activity feed unavailable." | Show empty state |
| DI-BE-DASH-003 | Recent reports failure | "Could not load recent reports." | Show empty state |
| DI-FE-DASH-001 | No datasets in workspace | "You have not uploaded any datasets yet." | Show Upload Dataset CTA |
| DI-FE-DASH-002 | No dashboards created | "No dashboards found. Create your first dashboard." | Show Create Dashboard CTA |
| DI-BE-DASH-004 | Tenant DB connection failure | "Trouble connecting to your workspace. Please try again." | Retry, alert engineering |

---

## MODULE 3: DATASET MANAGEMENT (`/datasets`)

### 3.1 Dataset List

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-BE-DATASET-001 | Failed to fetch list | "Unable to load your datasets. Please refresh." | Refresh button |
| DI-FE-DATASET-001 | No datasets exist | "No datasets found. Upload your first dataset." | Show upload CTA |
| DI-BE-DATASET-002 | Search returns nothing | "No datasets match your search." | Show clear search suggestion |

### 3.2 Dataset Upload (`/datasets/upload`)

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-FE-DATASET-010 | No file selected | "Please select a file to upload." | Highlight dropzone |
| DI-FE-DATASET-011 | Invalid file type | "Only CSV, Excel (.xlsx), and JSON files are supported." | Show accepted formats |
| DI-FE-DATASET-012 | File > 100MB | "File is too large. Maximum file size is 100MB." | Show compression tips |
| DI-BE-DATASET-010 | MIME type mismatch | "File content does not match its extension. Please check your file." | Show help link |
| DI-BE-DATASET-011 | Storage upload failure | "File upload failed. Please check your connection and try again." | Retry with progress bar |
| DI-BE-DATASET-012 | CSV parse failure | "We could not read this file. It may be corrupted." | Show sample file download |
| DI-BE-DATASET-013 | Excel password protected | "This Excel file is password protected. Please remove the password first." | Show how-to guide |
| DI-BE-DATASET-014 | File has 0 rows | "This file appears to be empty." | Reject upload |
| DI-BE-DATASET-015 | File has 0 columns | "No columns detected. Please check your file format." | Reject upload |
| DI-BE-DATASET-016 | Storage quota exceeded | "You have reached your 5GB storage limit. Please upgrade or delete old datasets." | Show upgrade CTA |
| DI-BE-DATASET-017 | Duplicate file name | "A dataset with this name already exists. This will create a new version." | Show version confirmation dialog |
| DI-BE-DATASET-018 | Celery worker unavailable | "File uploaded but processing is delayed. We will notify you when ready." | Show pending status |
| DI-BE-DATASET-019 | Profiling timeout (>60s) | "Data analysis is taking longer than expected. We will notify you when complete." | Show async status |
| DI-FE-DATASET-013 | Upload cancelled by user | "Upload cancelled." | Reset dropzone |

### 3.3 Dataset Detail (`/datasets/[id]`)

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-BE-DATASET-020 | Dataset not found | "This dataset does not exist or has been deleted." | Redirect to /datasets |
| DI-BE-DATASET-021 | No access permission | "You do not have permission to view this dataset." | Show contact admin |
| DI-BE-DATASET-022 | Still processing | "This dataset is still being analyzed. Please wait." | Show progress with polling |
| DI-BE-DATASET-023 | Processing failed | "We encountered an error analyzing this file. Please try re-uploading." | Show re-upload button |
| DI-BE-DATASET-024 | Column profile unavailable | "Column statistics unavailable." | Show partial data |
| DI-BE-DATASET-025 | Preview rows failed | "Data preview failed to load." | Retry button |

### 3.4 Dataset Delete

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-BE-DATASET-030 | Has dependent dashboards | "This dataset is used by [N] dashboards. Deleting it will break those dashboards. Continue?" | Show list, confirmation required |
| DI-BE-DATASET-031 | Has pending AI jobs | "This dataset has a job in progress. Please wait for it to complete." | Block delete, show job status |
| DI-BE-DATASET-032 | Storage delete failed | "Record deleted but file could not be removed from storage. Team notified." | Log for manual cleanup |

---

## MODULE 4: AI COPILOT (`/ai-copilot`)

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-AI-COPILOT-001 | No dataset selected | "Please select a dataset to start chatting." | Show dataset selector |
| DI-AI-COPILOT-002 | Empty message | "Please type a question." | Disable send button |
| DI-AI-COPILOT-003 | OpenAI API key invalid | "AI service is currently unavailable. Please contact support." | Alert engineering |
| DI-AI-COPILOT-004 | OpenAI rate limit | "The AI is handling too many requests. Please wait a moment." | 30-second countdown |
| DI-AI-COPILOT-005 | OpenAI timeout (>30s) | "The AI took too long to respond. Please try a simpler question." | Retry button |
| DI-AI-COPILOT-006 | Pandas code execution failure | "The AI generated code that could not run on your data. Please rephrase." | Log generated code |
| DI-AI-COPILOT-007 | Pandas execution timeout | "Your question requires too much computation. Try a smaller date range." | Suggest optimization |
| DI-AI-COPILOT-008 | Token quota exceeded | "You have used your monthly AI token limit. Please upgrade your plan." | Show upgrade CTA |
| DI-AI-COPILOT-009 | Dataset too large (>50k rows) | "This dataset is too large to analyze in chat. Please use a filtered subset." | Show filter suggestion |
| DI-AI-COPILOT-010 | Prompt injection detected | "This message contains content that cannot be processed. Please rephrase." | Log, block silently |
| DI-AI-COPILOT-011 | MCP tool call failure | "The AI could not retrieve your data. Please try again." | Retry button |
| DI-AI-COPILOT-012 | Conversation history load failure | "Could not load your conversation history." | Start fresh conversation |
| DI-AI-COPILOT-013 | Streaming connection dropped | "Connection lost. Reconnecting..." | Auto-reconnect SSE |
| DI-AI-COPILOT-014 | Unsupported question type | "This type of analysis is not supported yet. Try asking about totals, trends, or comparisons." | Show example questions |

---

## MODULE 5: AI EXCEL GENERATOR (`/excel-generator`)

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-AI-EXCEL-001 | No dataset selected | "Please select a dataset before generating." | Highlight selector |
| DI-AI-EXCEL-002 | Dataset still processing | "Your dataset is still being analyzed. Please wait." | Show dataset status |
| DI-AI-EXCEL-003 | Dataset < 5 rows | "This dataset has too few rows for analysis (minimum 5 rows)." | Reject |
| DI-AI-EXCEL-004 | Dataset < 2 columns | "This dataset needs at least 2 columns for analysis." | Reject |
| DI-AI-EXCEL-005 | Claude API failure (Phase B) | "AI workbook planning failed. Retrying automatically..." | Auto-retry once |
| DI-AI-EXCEL-006 | GPT-4o failure (Phase C) | "AI content generation failed. Retrying..." | Auto-retry once |
| DI-AI-EXCEL-007 | XlsxWriter build failure | "Excel file construction failed. Our team has been notified." | Log, notify engineering |
| DI-AI-EXCEL-008 | Storage upload failure | "Excel generated but upload failed. Retrying..." | Auto-retry 3 times |
| DI-AI-EXCEL-009 | Job timeout (>10 min) | "This is taking longer than expected. We will notify you when ready." | Background, email notification |
| DI-AI-EXCEL-010 | Celery crashed mid-job | "Generation was interrupted. Please try again." | Status set to FAILED |
| DI-AI-EXCEL-011 | Token quota exceeded mid-generation | "AI token limit reached mid-generation. Please upgrade and retry." | Save partial if possible |
| DI-AI-EXCEL-012 | Download link expired (>24h) | "Your download link has expired. Please regenerate." | Show Regenerate button |
| DI-AI-EXCEL-013 | User cancels job | "Generation cancelled." | Set status to CANCELLED |
| DI-AI-EXCEL-014 | Storage quota exceeded | "Cannot save the generated file. Your storage is full." | Show storage management link |
| DI-AI-EXCEL-015 | Forecast pipeline failure | "Forecast sheet generation failed. Workbook delivered without Forecast sheet." | Include partial workbook, log error |

---

## MODULE 6: DASHBOARD BUILDER (`/dashboards`)

### 6.1 Dashboard List

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-BE-DASH-010 | Load failure | "Unable to load dashboards. Please refresh." | Refresh button |
| DI-FE-DASH-010 | No dashboards exist | "No dashboards yet. Create your first one." | Show create CTA |

### 6.2 Builder Canvas

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-BE-DASH-020 | Dashboard not found | "This dashboard does not exist or has been deleted." | Redirect to /dashboards |
| DI-BE-DASH-021 | Widget dataset deleted | "The dataset for this widget no longer exists. Please update the widget." | Highlight broken widget in red |
| DI-BE-DASH-022 | Widget query failure | "This chart could not load its data." | Error state inside widget only |
| DI-BE-DASH-023 | Save failure | "Your changes could not be saved. Please try again." | Auto-retry, preserve local state |
| DI-BE-DASH-024 | Delete dashboard with active shared link | "This dashboard has an active shared link. Deleting will break it. Continue?" | Show confirmation |
| DI-FE-DASH-020 | Widget dragged outside canvas | Snap widget back to last valid position | No message, snap behavior |
| DI-FE-DASH-021 | Widget count > 50 | "Maximum of 50 widgets per dashboard. Please remove a widget first." | Block add |
| DI-AI-DASH-001 | AI generation failure | "AI dashboard generation failed. You can still build manually." | Fall back to manual |
| DI-AI-DASH-002 | Non-numeric data for chart | "Non-numeric data detected. Chart type adjusted automatically." | Auto-correct |

---

## MODULE 7: REPORT GENERATOR (`/reports`)

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-BE-REPORT-001 | Generation job failure | "Report generation failed. Please try again." | Retry button |
| DI-BE-REPORT-002 | WeasyPrint PDF failure | "PDF export failed. The report is available in Excel format." | Offer Excel alternative |
| DI-BE-REPORT-003 | Report not found | "This report does not exist or has been deleted." | Redirect to /reports |
| DI-BE-REPORT-004 | Download link expired | "This download link has expired. Please regenerate." | Regenerate button |
| DI-BE-REPORT-005 | GPT-4o writing failure | "AI report writing failed. Basic statistical report generated instead." | Generate non-AI fallback |
| DI-BE-REPORT-006 | Scheduled email failure | "Scheduled report email failed to deliver. Please check the email address." | Log, alert admin |
| DI-BE-REPORT-007 | Report approval rejected | "Your report was rejected. Please review the feedback and resubmit." | Show reason, resubmit button |
| DI-AI-REPORT-001 | Token limit mid-report | "AI writing was cut short due to token limits. Report partially generated." | Save partial, show warning banner |

---

## MODULE 8: FORECASTING (`/forecasting`)

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-BE-FORECAST-001 | No date column detected | "Forecasting requires a date or time column. None detected." | Show column selector |
| DI-BE-FORECAST-002 | No numeric column | "Forecasting requires a numeric column to predict." | Show column selector |
| DI-BE-FORECAST-003 | Insufficient data points (<12) | "Forecasting requires at least 12 data points. Your dataset has [N]." | Reject with explanation |
| DI-BE-FORECAST-004 | Irregular date intervals | "Your date column has irregular intervals. Please ensure consistent periods." | Show cleaning suggestion |
| DI-BE-FORECAST-005 | Prophet model failure | "Prophet model failed. Switching to ARIMA automatically." | Auto-fallback |
| DI-BE-FORECAST-006 | ARIMA model failure | "Forecasting models could not fit your data. Please check for outliers." | Show data quality suggestions |
| DI-BE-FORECAST-007 | Both models fail | "Unable to generate a forecast for this data. Please review your time series." | Log full error |
| DI-BE-FORECAST-008 | Forecast job timeout | "Forecasting is taking longer than expected. We will notify you when complete." | Background, send notification |
| DI-FE-FORECAST-001 | 0 forecast periods selected | "Please select at least 1 forecast period." | Inline validation |
| DI-FE-FORECAST-002 | > 60 forecast periods | "Maximum is 60 periods. Forecasts beyond 60 have very low accuracy." | Cap at 60, show warning |

---

## MODULE 9: MACHINE LEARNING STUDIO (`/ml-studio`)

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-BE-ML-001 | No target column selected | "Please select a target column (the variable you want to predict)." | Highlight selector |
| DI-BE-ML-002 | Non-numeric target (regression) | "Regression requires a numeric target column." | Auto-suggest Classification |
| DI-BE-ML-003 | Target has only 1 unique value | "Your target column has only one unique value. ML cannot train on this." | Reject |
| DI-BE-ML-004 | Missing values > 50% in target | "More than 50% of your target values are missing. Please clean your data first." | Link to dataset cleaning |
| DI-BE-ML-005 | Model training failure | "Model training failed. Please try with a different configuration." | Show config suggestions |
| DI-BE-ML-006 | Training timeout (>15 min) | "Training is taking longer than expected. We will notify you when complete." | Move to background |
| DI-BE-ML-007 | Insufficient rows (<50) | "Machine learning requires at least 50 rows. Your dataset has [N]." | Reject |
| DI-BE-ML-008 | All AutoML models fail | "None of the models could be trained on your data. Please review your dataset." | Dataset health check link |

---

## MODULE 10: BILLING & SUBSCRIPTIONS (`/billing`)

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-BE-BILL-001 | Stripe payment failed | "Payment failed. Please check your card details." | Show Stripe error |
| DI-BE-BILL-002 | Card declined | "Your card was declined. Please try a different payment method." | Card update form |
| DI-BE-BILL-003 | Subscription creation failure | "Subscription setup failed. You have not been charged. Please try again." | Retry |
| DI-BE-BILL-004 | Downgrade exceeds new limits | "Downgrading would exceed your current usage. Please resolve this first." | Show usage breakdown |
| DI-BE-BILL-005 | Invoice download failure | "Invoice download failed. Please try again." | Retry |
| DI-BE-BILL-006 | Webhook signature failure | Log silently, alert engineering | Never exposed to user |
| DI-BE-BILL-007 | Free trial expired | "Your free trial has ended. Please select a plan to continue." | Redirect to billing |
| DI-BE-BILL-008 | AI token quota at 80% | "You have used 80% of your monthly AI tokens. Consider upgrading." | Banner notification |
| DI-BE-BILL-009 | AI token quota at 100% | "Monthly AI token limit reached. All AI features paused until renewal or upgrade." | Disable AI features, upgrade CTA |
| DI-BE-BILL-010 | Storage quota at 90% | "You are almost out of storage (90% used). Please upgrade or delete old files." | Storage management link |

---

## MODULE 11: SETTINGS (`/settings`)

### Profile Settings

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-BE-SETTINGS-001 | Profile update failure | "Profile update failed. Please try again." | Retry |
| DI-BE-SETTINGS-002 | Avatar upload failure | "Profile photo upload failed. Maximum size is 2MB." | Show size limit |
| DI-BE-SETTINGS-003 | Email already in use | "This email is already associated with another account." | Inline error |
| DI-BE-SETTINGS-004 | Email verification send failure | "Verification email could not be sent. Please try again." | Retry |
| DI-BE-SETTINGS-005 | Wrong current password | "Current password is incorrect." | Inline error |

### API Key Management

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-BE-SETTINGS-010 | Max 10 API keys reached | "Maximum of 10 API keys allowed. Please delete an existing key first." | Show key list |
| DI-BE-SETTINGS-011 | API key delete failure | "Failed to delete API key. Please try again." | Retry |
| DI-BE-SETTINGS-012 | API key name conflict | "An API key with this name already exists." | Inline error |

### Notification Settings

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-BE-SETTINGS-020 | Slack webhook URL invalid | "This Slack webhook URL is invalid. Please check it." | Slack setup guide |
| DI-BE-SETTINGS-021 | Teams webhook test failure | "Microsoft Teams webhook test failed. Please verify the URL." | Teams setup guide |

---

## MODULE 12: ADMIN PANEL (`/admin`)

### Tenant Management

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-BE-ADMIN-001 | Tenant not found | "This organization does not exist." | Redirect to tenant list |
| DI-BE-ADMIN-002 | Tenant provisioning failure | "Supabase project provisioning failed. Manual intervention required." | Alert engineering immediately |
| DI-BE-ADMIN-003 | Tenant suspension failure | "Unable to suspend organization. Please try again." | Retry |
| DI-BE-ADMIN-004 | Impersonation audit log unavailable | "Impersonation blocked: audit logging unavailable. Cannot proceed without audit trail." | Block impersonation entirely |
| DI-BE-ADMIN-005 | Feature flag update failure | "Feature flag update failed." | Retry |

### User Management

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-BE-ADMIN-010 | Remove only Owner | "You cannot remove the only Owner. Assign another Owner first." | Block, show role change |
| DI-BE-ADMIN-011 | Invite — already a member | "This user is already a member of this workspace." | Show existing member |
| DI-BE-ADMIN-012 | Invite email send failure | "Invitation saved but email failed to send. You can resend from the members list." | Show resend option |

---

## MODULE 13: ORGANIZATION & WORKSPACE

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-BE-ORG-001 | Org name too short | "Organization name must be at least 2 characters." | Inline validation |
| DI-BE-ORG-002 | Workspace name conflict | "A workspace with this name already exists in your organization." | Inline error |
| DI-BE-ORG-003 | Delete workspace with datasets | "This workspace contains [N] datasets. Deleting will permanently remove all data. Continue?" | Confirmation with list |
| DI-BE-ORG-004 | Cannot delete last workspace | "You cannot delete the only workspace in your organization." | Block delete |
| DI-BE-ORG-005 | Member limit reached | "Your plan allows a maximum of [N] members. Please upgrade to add more." | Upgrade CTA |

---

## MODULE 14: NOTIFICATIONS (`/notifications`)

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-BE-NOTIF-001 | Load failure | "Could not load notifications." | Retry silently |
| DI-BE-NOTIF-002 | Mark all read failure | "Failed to mark notifications as read." | Retry |
| DI-BE-NOTIF-003 | Email notification failure | Log silently, retry via Celery | Never shown to user |
| DI-BE-NOTIF-004 | WebSocket connection failure | Fall back to 30-second polling | Show "Live updates paused" indicator |

---

## MODULE 15: GLOBAL / SYSTEM-WIDE ERRORS

### Frontend Global Errors

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-FE-GLOBAL-001 | No internet | "You are offline. Please check your internet connection." | Offline banner, pause API calls |
| DI-FE-GLOBAL-002 | Backend unreachable | "We are experiencing technical difficulties. Please try again shortly." | Show status page link |
| DI-FE-GLOBAL-003 | 401 on any request | "Your session has expired. Please log in again." | Clear token, redirect to /login |
| DI-FE-GLOBAL-004 | 403 on any request | "You do not have permission to perform this action." | Contact admin message |
| DI-FE-GLOBAL-005 | Unhandled React error | "Something went wrong. Our team has been notified." | Error boundary with "Go Home" button |
| DI-FE-GLOBAL-006 | 404 route | "Page not found." | 404 page with navigation links |
| DI-FE-GLOBAL-007 | Feature not on plan | "This feature is not available on your current plan. Upgrade to access it." | Plan comparison |

### Backend Global Errors

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-BE-GLOBAL-001 | Unhandled 500 | "An unexpected error occurred. Our engineering team has been notified." | Log to Sentry, send alert |
| DI-BE-GLOBAL-002 | DB connection failure | "Database temporarily unavailable. Please try again in a moment." | Exponential backoff retry |
| DI-BE-GLOBAL-003 | Redis connection failure | "Background processing unavailable. Some features may be limited." | Graceful degradation |
| DI-BE-GLOBAL-004 | Rate limit exceeded | "Too many requests. Please wait before trying again." | Show wait time from Redis |
| DI-BE-GLOBAL-005 | Pydantic validation failure | Display specific field errors | Map to form field errors on frontend |
| DI-BE-GLOBAL-006 | Request too large | "Request is too large. Maximum allowed is [N]MB." | Show size limit |

### AI & External API Errors

| Error Code | Trigger | User-Facing Message | Action |
|---|---|---|---|
| DI-AI-GLOBAL-001 | OpenAI completely down | "AI services are temporarily unavailable." | Disable AI features, show status |
| DI-AI-GLOBAL-002 | Anthropic completely down | "AI analysis temporarily unavailable. Please try again later." | Fallback to OpenAI where possible |
| DI-AI-GLOBAL-003 | Invalid platform API key | Alert engineering via Sentry/PagerDuty | Never expose to user |
| DI-AI-GLOBAL-004 | Content policy violation | "Your request could not be processed. Please rephrase your question." | Log prompt for review |
| DI-AI-GLOBAL-005 | MCP Server unreachable | "AI data access temporarily unavailable." | Graceful degradation |

---

## IMPLEMENTATION ARCHITECTURE

### Frontend — Axios Interceptor Pattern

```
Every API call → Axios Interceptors
  ├── 401 → Clear JWT → Redirect to /login
  ├── 403 → Show permission denied toast
  ├── 429 → Show rate limit toast with countdown timer
  ├── 500 → Show generic error toast + log to Sentry
  └── Network Error → Show offline banner
```

### Toast Notification Rules

| Type | Color | Duration | Dismiss |
|---|---|---|---|
| Success | Green | 3 seconds | Auto |
| Warning | Yellow | 5 seconds | Manual |
| Error | Red | 7 seconds | Manual |
| Info | Blue | 4 seconds | Auto |

### NEVER show users

- Raw error stack traces
- Database error messages
- Internal server file paths
- API keys or secrets
- Raw SQL query strings

---

### Backend — Standard Error Response Format

```json
{
  "error": "RESOURCE_NOT_FOUND",
  "message": "Dataset with ID abc123 does not exist.",
  "code": "DI-BE-DATASET-020",
  "timestamp": "2026-07-25T09:00:00Z",
  "request_id": "req_xyz789"
}
```

### Celery Job Status States

| Status | Meaning |
|---|---|
| PENDING | Queued in Redis, not yet picked up |
| RUNNING | Worker actively processing |
| COMPLETED | Finished successfully |
| FAILED | Exception thrown, stored in error_message |
| CANCELLED | User cancelled manually |
| TIMEOUT | Exceeded maximum duration |
| RETRYING | Auto-retry in progress (max 3 attempts) |

---

## LOGGING STANDARDS

### Log Levels

| Level | Usage |
|---|---|
| DEBUG | Development only — variable values, function entry/exit |
| INFO | Normal operations — job started, completed, user logged in |
| WARNING | Recoverable issues — quota at 80%, retry attempt 2/3 |
| ERROR | Feature failures — Excel generation failed, API call failed |
| CRITICAL | Platform failures — database down, all AI services down |

### Required Context on Every Error Log

- `tenant_id` — Which company triggered the error
- `user_id` — Which user triggered the error
- `error_code` — DI error code for support correlation
- `error_detail` — Exception message (internal only)
- `request_id` — Unique trace ID for log correlation
- `timestamp` — UTC ISO 8601

---

*Data Insight — Error Handling Specification v1.0.0*  
*Last Updated: 2026-07-25*  
*Next Review: 2026-10-25*
