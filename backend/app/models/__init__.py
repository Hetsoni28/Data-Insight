"""Models package — import all models so Alembic can detect them."""

from app.models.ai_ops import (
    AIModel,
    AIPromptTemplate,
    AIProvider,
    AIRoutingRule,
    AIUsageLog,
)
from app.models.ai_token_usage import AITokenUsage
from app.models.api_gateway import (
    ApiIntegration,
    ApiRateLimit,
    ApiRequestLog,
    OAuthClient,
)
from app.models.api_key import ApiKey
from app.models.audit_log import AuditLog
from app.models.auth import LoginHistory, RefreshToken
from app.models.billing_activity import BillingActivity
from app.models.chart import Chart
from app.models.chat import ChatMessage, ChatSession
from app.models.dashboard import Dashboard
from app.models.dataset import Dataset, DatasetFileType, DatasetStatus
from app.models.feature_flag import FeatureExperiment, FeatureFlag, FeatureRollout
from app.models.integration import (
    AutomationWorkflow,
    IntegrationConnection,
    IntegrationLog,
)
from app.models.invitation import Invitation, InvitationStatus
from app.models.invoice import Invoice, InvoiceStatus
from app.models.lead import Lead, LeadSource, LeadStatus
from app.models.notification import Notification
from app.models.operating_expense import OperatingExpense
from app.models.rental_contract import ContractStatus, ContractType, RentalContract
from app.models.report import Report, ReportStatus, ReportType
from app.models.report_activity import ReportActivity
from app.models.report_bookmark import ReportBookmark
from app.models.report_schedule import ReportSchedule
from app.models.resource_request import (
    ResourceRequest,
    ResourceRequestStatus,
    ResourceRequestType,
)
from app.models.security import ComplianceReport, SecurityEvent, ThreatIntelligence
from app.models.storage import (
    StorageActivityLog,
    StorageBackup,
    StorageBucket,
    StorageFile,
    StorageLifecyclePolicy,
)
from app.models.stripe_event import StripeEvent
from app.models.support import PlatformIncident, SupportTicket
from app.models.tenant import DBConnectionType, PlanType, Tenant
from app.models.tenant_department import TenantDepartment
from app.models.tenant_role import TenantRole
from app.models.user import AccountType, User, UserRole
from app.models.user_activity import UserActivity
from app.models.user_profile import UserProfile
from app.models.user_session import UserSession
from app.models.webhook import Webhook
from app.models.webhook_delivery import WebhookDeliveryLog
from app.models.workspace import Workspace

__all__ = [
    "AIModel",
    "AIPromptTemplate",
    "AIProvider",
    "AIRoutingRule",
    "AITokenUsage",
    "AIUsageLog",
    "AccountType",
    "ApiIntegration",
    "ApiKey",
    "ApiRateLimit",
    "ApiRequestLog",
    "AuditLog",
    "AutomationWorkflow",
    "BillingActivity",
    "ChatMessage",
    "ComplianceReport",
    "ContractStatus",
    "ContractType",
    "DBConnectionType",
    "Dataset",
    "DatasetFileType",
    "DatasetStatus",
    "FeatureExperiment",
    "FeatureFlag",
    "FeatureRollout",
    "IntegrationConnection",
    "IntegrationLog",
    "Invitation",
    "InvitationStatus",
    "Invoice",
    "InvoiceStatus",
    "Lead",
    "LeadSource",
    "LeadStatus",
    "LoginHistory",
    "Notification",
    "OAuthClient",
    "OperatingExpense",
    "PlanType",
    "PlatformIncident",
    "RefreshToken",
    "RentalContract",
    "Report",
    "ReportActivity",
    "ReportBookmark",
    "ReportSchedule",
    "ReportStatus",
    "ReportType",
    "ResourceRequest",
    "ResourceRequestStatus",
    "ResourceRequestType",
    "SecurityEvent",
    "StorageActivityLog",
    "StorageBackup",
    "StorageBucket",
    "StorageFile",
    "StorageLifecyclePolicy",
    "StripeEvent",
    "SupportTicket",
    "Tenant",
    "ThreatIntelligence",
    "User",
    "UserActivity",
    "UserProfile",
    "UserRole",
    "UserSession",
    "Webhook",
    "WebhookDeliveryLog",
    "Workspace",
]
from app.models.dataset_alert import DatasetAlert
