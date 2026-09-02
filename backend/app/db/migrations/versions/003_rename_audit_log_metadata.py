"""Rename audit_logs.metadata to audit_logs.extra_metadata

Revision ID: 003
Revises: 002
Create Date: 2026-07-26
"""

from collections.abc import Sequence

from alembic import op

revision: str = "003"
down_revision: str | None = "002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column("audit_logs", "metadata", new_column_name="extra_metadata")


def downgrade() -> None:
    op.alter_column("audit_logs", "extra_metadata", new_column_name="metadata")
