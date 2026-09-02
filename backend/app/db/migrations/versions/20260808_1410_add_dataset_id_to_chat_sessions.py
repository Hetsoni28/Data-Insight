"""add dataset_id to chat_sessions

Revision ID: 7d8e2f1a9b4c
Revises: 3f1e5a230e9c
Create Date: 2026-08-08 14:10:00.000000+00:00

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "7d8e2f1a9b4c"
down_revision = "3f1e5a230e9c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("chat_sessions", sa.Column("dataset_id", sa.UUID(), nullable=True))
    op.create_index(
        op.f("ix_chat_sessions_dataset_id"),
        "chat_sessions",
        ["dataset_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_chat_sessions_dataset_id",
        "chat_sessions",
        "datasets",
        ["dataset_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_chat_sessions_dataset_id", "chat_sessions", type_="foreignkey",
    )
    op.drop_index(op.f("ix_chat_sessions_dataset_id"), table_name="chat_sessions")
    op.drop_column("chat_sessions", "dataset_id")
