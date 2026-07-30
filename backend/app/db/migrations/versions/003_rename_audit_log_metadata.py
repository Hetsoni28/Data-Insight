"""Rename audit_logs.metadata to audit_logs.extra_metadata

Revision ID: 003
Revises: 002
Create Date: 2026-07-26
"""

from typing import Sequence, Union
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("audit_logs", "metadata", new_column_name="extra_metadata")


def downgrade() -> None:
    op.alter_column("audit_logs", "extra_metadata", new_column_name="metadata")
