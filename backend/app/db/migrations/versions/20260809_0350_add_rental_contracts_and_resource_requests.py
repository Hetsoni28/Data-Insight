"""add rental contracts and resource requests

Revision ID: 4ae3ff03084b
Revises: 3ed2ee02073a
Create Date: 2026-08-09 03:50:00.000000+00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision = '4ae3ff03084b'
down_revision = '3ed2ee02073a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### rental_contracts table ###
    op.create_table(
        'rental_contracts',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('contract_number', sa.String(length=100), nullable=False),
        sa.Column('contract_type', sa.String(length=50), nullable=False, server_default='dedicated_system_rental'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='active'),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('renewal_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('billing_cycle', sa.String(length=20), nullable=False, server_default='annual'),
        sa.Column('base_price_monthly', sa.Float(), nullable=False, server_default='12500.0'),
        sa.Column('annual_contract_value', sa.Float(), nullable=False, server_default='150000.0'),
        sa.Column('annual_discount', sa.Float(), nullable=False, server_default='30000.0'),
        sa.Column('contracted_annual_amount', sa.Float(), nullable=False, server_default='120000.0'),
        sa.Column('currency', sa.String(length=10), nullable=False, server_default='USD'),
        sa.Column('payment_terms', sa.String(length=50), nullable=False, server_default='Annual Advance'),
        sa.Column('support_tier', sa.String(length=50), nullable=False, server_default='24/7 Dedicated Engineering'),
        sa.Column('sla_guarantee', sa.String(length=50), nullable=False, server_default='99.99% Uptime SLA'),
        sa.Column('deployment_model', sa.String(length=100), nullable=False, server_default='Dedicated Single-Tenant VPC'),
        sa.Column('document_url', sa.String(length=1024), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index(op.f('ix_rental_contracts_tenant_id'), 'rental_contracts', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_rental_contracts_contract_number'), 'rental_contracts', ['contract_number'], unique=True)

    # ### resource_requests table ###
    op.create_table(
        'resource_requests',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('resource_type', sa.String(length=50), nullable=False, server_default='storage'),
        sa.Column('requested_capacity', sa.String(length=100), nullable=False),
        sa.Column('current_capacity', sa.String(length=100), nullable=True),
        sa.Column('business_reason', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='submitted'),
        sa.Column('approved_capacity', sa.String(length=100), nullable=True),
        sa.Column('admin_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(op.f('ix_resource_requests_tenant_id'), 'resource_requests', ['tenant_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_resource_requests_tenant_id'), table_name='resource_requests')
    op.drop_table('resource_requests')
    op.drop_index(op.f('ix_rental_contracts_contract_number'), table_name='rental_contracts')
    op.drop_index(op.f('ix_rental_contracts_tenant_id'), table_name='rental_contracts')
    op.drop_table('rental_contracts')
