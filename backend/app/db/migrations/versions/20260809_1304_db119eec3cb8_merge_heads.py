"""merge heads

Revision ID: db119eec3cb8
Revises: 1a69c2ebe523, 4ae3ff03084b
Create Date: 2026-08-09 13:04:41.831632+00:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'db119eec3cb8'
down_revision = ('1a69c2ebe523', '4ae3ff03084b')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
