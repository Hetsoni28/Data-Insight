"""Merge multiple heads

Revision ID: 1cee6698e3fb
Revises: db119eec3cb8, 6bd30796fa4c
Create Date: 2026-08-11 10:13:26.349975+00:00

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "1cee6698e3fb"
down_revision = ("db119eec3cb8", "6bd30796fa4c")
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
