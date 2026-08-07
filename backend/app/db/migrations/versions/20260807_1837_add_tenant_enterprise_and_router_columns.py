"""Add enterprise DB routing and quota enforcement columns to tenants

Revision ID: e2a19b8409ee
Revises: 8409e8982dd2
Create Date: 2026-08-07 18:37:00.000000+00:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e2a19b8409ee'
down_revision = '8409e8982dd2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add enterprise routing and quota tracking columns to tenants table
    op.add_column(
        'tenants',
        sa.Column('db_connection_type', sa.String(length=20), server_default='shared', nullable=False)
    )
    op.add_column(
        'tenants',
        sa.Column('dedicated_db_url', sa.Text(), nullable=True)
    )
    op.add_column(
        'tenants',
        sa.Column('current_storage_bytes', sa.BigInteger(), server_default='0', nullable=False)
    )
    op.add_column(
        'tenants',
        sa.Column('current_ai_tokens_used', sa.BigInteger(), server_default='0', nullable=False)
    )
    op.add_column(
        'tenants',
        sa.Column('quota_reset_at', sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        'tenants',
        sa.Column('is_suspended', sa.Boolean(), server_default='false', nullable=False)
    )
    op.add_column(
        'tenants',
        sa.Column('suspension_reason', sa.String(length=255), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('tenants', 'suspension_reason')
    op.drop_column('tenants', 'is_suspended')
    op.drop_column('tenants', 'quota_reset_at')
    op.drop_column('tenants', 'current_ai_tokens_used')
    op.drop_column('tenants', 'current_storage_bytes')
    op.drop_column('tenants', 'dedicated_db_url')
    op.drop_column('tenants', 'db_connection_type')
