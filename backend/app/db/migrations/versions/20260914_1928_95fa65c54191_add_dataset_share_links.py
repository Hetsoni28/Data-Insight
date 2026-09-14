"""add_dataset_share_links

Revision ID: 95fa65c54191
Revises: a4126d4b6cef
Create Date: 2026-09-14 19:28:59.071429+00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '95fa65c54191'
down_revision = 'a4126d4b6cef'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'dataset_share_links',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('token', sa.String(64), nullable=False, unique=True),
        sa.Column('dataset_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('datasets.id', ondelete='CASCADE'), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_by_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('label', sa.String(255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('view_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('allow_excel_download', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('allow_clean_download', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_dataset_share_links_token', 'dataset_share_links', ['token'])
    op.create_index('ix_dataset_share_links_dataset_id', 'dataset_share_links', ['dataset_id'])
    op.create_index('ix_dataset_share_links_tenant_id', 'dataset_share_links', ['tenant_id'])


def downgrade() -> None:
    op.drop_table('dataset_share_links')
