"""Add tenants, workspaces, datasets, reports, audit_logs, user_sessions, ai_token_usage

Revision ID: 002
Revises: 001
Create Date: 2026-07-26
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -- tenants --------------------------------------------------------------
    op.create_table(
        "tenants",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False, unique=True),
        sa.Column("domain", sa.String(255), nullable=True, unique=True),
        sa.Column("logo_url", sa.Text, nullable=True),
        sa.Column("industry", sa.String(100), nullable=True),
        sa.Column("timezone", sa.String(50), nullable=False, server_default="UTC"),
        sa.Column("currency", sa.String(10), nullable=False, server_default="USD"),
        sa.Column("plan", sa.String(50), nullable=False, server_default="starter"),
        sa.Column("max_users", sa.Integer, nullable=False, server_default="5"),
        sa.Column("max_storage_gb", sa.Integer, nullable=False, server_default="5"),
        sa.Column("max_ai_tokens_per_month", sa.Integer, nullable=False, server_default="100000"),
        sa.Column("white_label_config", postgresql.JSONB, nullable=True),
        sa.Column("stripe_customer_id", sa.String(255), nullable=True, unique=True),
        sa.Column("stripe_subscription_id", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("is_deleted", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_tenants_slug", "tenants", ["slug"], unique=True)

    # -- update users — add tenant_id, role, auth fields ----------------------
    op.add_column("users", sa.Column("tenant_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("tenants.id", ondelete="SET NULL"), nullable=True))
    op.add_column("users", sa.Column("avatar_url", sa.Text, nullable=True))
    op.add_column("users", sa.Column("role", sa.String(50), nullable=False, server_default="member"))
    op.add_column("users", sa.Column("is_email_verified", sa.Boolean, nullable=False, server_default="false"))
    op.add_column("users", sa.Column("email_verification_token", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("password_reset_token", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("password_reset_expires", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_users_tenant_id", "users", ["tenant_id"])

    # -- user_sessions ---------------------------------------------------------
    op.create_table(
        "user_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.String(255), nullable=False, unique=True),
        sa.Column("device_name", sa.String(255), nullable=True),
        sa.Column("browser", sa.String(100), nullable=True),
        sa.Column("ip_address", sa.String(50), nullable=True),
        sa.Column("user_agent", sa.Text, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_active_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_user_sessions_user_id", "user_sessions", ["user_id"])
    op.create_index("ix_user_sessions_token_hash", "user_sessions", ["token_hash"], unique=True)

    # -- workspaces ------------------------------------------------------------
    op.create_table(
        "workspaces",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("icon", sa.String(50), nullable=True),
        sa.Column("color", sa.String(20), nullable=True),
        sa.Column("is_default", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("is_deleted", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_workspaces_tenant_id", "workspaces", ["tenant_id"])

    # -- datasets --------------------------------------------------------------
    op.create_table(
        "datasets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("uploaded_by_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("file_type", sa.String(20), nullable=False),
        sa.Column("file_url", sa.Text, nullable=False),
        sa.Column("file_size_bytes", sa.BigInteger, nullable=True),
        sa.Column("original_filename", sa.String(500), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="uploading"),
        sa.Column("celery_task_id", sa.String(255), nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("row_count", sa.Integer, nullable=True),
        sa.Column("column_count", sa.Integer, nullable=True),
        sa.Column("profile", postgresql.JSONB, nullable=True),
        sa.Column("data_quality_score", sa.Integer, nullable=True),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("parent_dataset_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("datasets.id", ondelete="SET NULL"), nullable=True),
        sa.Column("is_deleted", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_datasets_tenant_id", "datasets", ["tenant_id"])
    op.create_index("ix_datasets_workspace_id", "datasets", ["workspace_id"])
    op.create_index("ix_datasets_status", "datasets", ["status"])

    # -- reports ---------------------------------------------------------------
    op.create_table(
        "reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("dataset_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("report_type", sa.String(20), nullable=False, server_default="excel"),
        sa.Column("status", sa.String(50), nullable=False, server_default="queued"),
        sa.Column("generation_config", postgresql.JSONB, nullable=True),
        sa.Column("ai_blueprint", postgresql.JSONB, nullable=True),
        sa.Column("output_url", sa.Text, nullable=True),
        sa.Column("output_size_bytes", sa.Integer, nullable=True),
        sa.Column("celery_task_id", sa.String(255), nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("progress", sa.Integer, nullable=False, server_default="0"),
        sa.Column("approved_by_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("approval_notes", sa.Text, nullable=True),
        sa.Column("ai_tokens_used", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_deleted", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_reports_tenant_id", "reports", ["tenant_id"])
    op.create_index("ix_reports_status", "reports", ["status"])

    # -- audit_logs ------------------------------------------------------------
    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("resource_type", sa.String(100), nullable=True),
        sa.Column("resource_id", sa.String(255), nullable=True),
        sa.Column("actor_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("ip_address", sa.String(50), nullable=True),
        sa.Column("user_agent", sa.Text, nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="success"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_audit_logs_tenant_id", "audit_logs", ["tenant_id"])
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"])
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])

    # -- ai_token_usage --------------------------------------------------------
    op.create_table(
        "ai_token_usage",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("feature", sa.String(100), nullable=False),
        sa.Column("model", sa.String(100), nullable=False),
        sa.Column("prompt_tokens", sa.Integer, nullable=False, server_default="0"),
        sa.Column("completion_tokens", sa.Integer, nullable=False, server_default="0"),
        sa.Column("total_tokens", sa.Integer, nullable=False, server_default="0"),
        sa.Column("cost_usd", sa.Float, nullable=False, server_default="0"),
        sa.Column("report_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("dataset_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_ai_token_usage_tenant_id", "ai_token_usage", ["tenant_id"])
    op.create_index("ix_ai_token_usage_created_at", "ai_token_usage", ["created_at"])


def downgrade() -> None:
    op.drop_table("ai_token_usage")
    op.drop_table("audit_logs")
    op.drop_table("reports")
    op.drop_table("datasets")
    op.drop_table("workspaces")
    op.drop_table("user_sessions")
    op.drop_column("users", "password_reset_expires")
    op.drop_column("users", "password_reset_token")
    op.drop_column("users", "email_verification_token")
    op.drop_column("users", "is_email_verified")
    op.drop_column("users", "role")
    op.drop_column("users", "avatar_url")
    op.drop_column("users", "tenant_id")
    op.drop_table("tenants")
