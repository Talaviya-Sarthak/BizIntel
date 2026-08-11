-- =====================================================================
-- seed.sql — Development seed data
-- PS-05 Enterprise Intelligence Platform
--
-- WARNING: Development-only. Never place production credentials or
-- real customer data in this file.
--
-- Idempotent: safe to run multiple times.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Demo user (DEVELOPMENT ONLY)
-- email:    dev@ps05.local
-- password: DevPass#2026
-- role:     owner
-- The password_hash below is a bcrypt hash of the password above
-- generated with cost factor 10. It is valid for demonstration only.
-- ---------------------------------------------------------------------
INSERT INTO users (name, email, password_hash, role, email_verified)
VALUES (
    'Demo Analyst',
    'dev@ps05.local',
    '$2b$10$W3qIPaif/EVsTk.1.nutm.KgUeaE9WIjMUvLwaF/eO9WhQRZ1Ahwu',
    'owner',
    TRUE
)
ON CONFLICT (lower(email)) DO NOTHING;
