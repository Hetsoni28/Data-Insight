# Database & Schema Prompt Blueprint

When generating database schemas (SQLAlchemy models) for Data Insight, adhere to these strict rules:

## 1. Multi-Tenant Enforcement
- Every table that contains business data MUST have a `tenant_id` foreign key referencing the `tenants` table.
- All database queries in the repository layer MUST automatically filter by `tenant_id`.

## 2. Table Design Rules
- **Primary Keys:** Use `UUID` (not auto-increment integers) for all primary keys.
- **Audit Fields:** Every table must include `created_at` and `updated_at` timestamps.
- **Soft Deletes:** Critical tables must include `is_deleted` (Boolean) and `deleted_at` (Timestamp). Do not actually DELETE records unless explicitly required for compliance.

## 3. Naming Conventions
- Table names must be plural (e.g., `users`, `datasets`, `workspaces`).
- Foreign keys must end in `_id` (e.g., `user_id`, `tenant_id`).
- Use `snake_case` for all columns and table names.

## 4. Migrations (Alembic)
- Never modify the database directly. All changes must be done via Alembic migrations.
- Always review the generated Alembic migration file to ensure `down_revision` is correct and no tables are accidentally dropped.
