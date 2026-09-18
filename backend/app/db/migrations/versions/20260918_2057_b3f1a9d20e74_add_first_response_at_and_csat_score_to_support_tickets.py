"""add first_response_at and csat_score to support_tickets

Revision ID: b3f1a9d20e74
Revises: 95fa65c54191
Create Date: 2026-09-18 20:57:00.000000+00:00

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "b3f1a9d20e74"
down_revision = "95fa65c54191"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add first_response_at: stamped automatically when a ticket first moves to IN_PROGRESS.
    # NULL means the ticket has not yet received a first response.
    op.add_column(
        "support_tickets",
        sa.Column("first_response_at", sa.DateTime(), nullable=True),
    )

    # Add csat_score: customer satisfaction rating (1-5) submitted after resolution.
    # NULL means no rating has been submitted yet.
    op.add_column(
        "support_tickets",
        sa.Column("csat_score", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("support_tickets", "csat_score")
    op.drop_column("support_tickets", "first_response_at")
