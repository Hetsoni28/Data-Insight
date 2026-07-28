"""Add is_owner and account_type columns to users

Revision ID: 004_add_owner_and_account_type
Revises: 368a96512f8e
Create Date: 2026-07-28

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '004_add_owner_account_type'
down_revision = '368a96512f8e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add is_owner flag — protects the single platform owner account
    op.add_column(
        'users',
        sa.Column('is_owner', sa.Boolean(), nullable=False, server_default='false')
    )
    # Add account_type — drives automatic role assignment
    op.add_column(
        'users',
        sa.Column('account_type', sa.String(length=50), nullable=False, server_default='individual')
    )


def downgrade() -> None:
    op.drop_column('users', 'account_type')
    op.drop_column('users', 'is_owner')
