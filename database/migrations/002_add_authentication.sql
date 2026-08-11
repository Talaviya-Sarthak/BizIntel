-- =====================================================================
-- 002_add_authentication.sql
-- PS-05 Enterprise Intelligence Platform
--
-- Adds authentication-related columns to `users`:
--   role, is_active, email_verified
-- This migration demonstrates the additive (forward-only) workflow.
--
-- NOTE: The migration runner wraps each migration file in a transaction.
-- Do not add BEGIN/COMMIT to migration files.
-- =====================================================================

ALTER TABLE users
    ADD COLUMN role           TEXT        NOT NULL DEFAULT 'user',
    ADD COLUMN is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
    ADD COLUMN email_verified BOOLEAN     NOT NULL DEFAULT FALSE;

-- Restrict allowed roles.
ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('user', 'owner', 'admin'));

-- Indexes used by authentication lookups and future admin queries.
CREATE INDEX users_role_idx ON users (role);
CREATE INDEX users_is_active_idx ON users (is_active);
