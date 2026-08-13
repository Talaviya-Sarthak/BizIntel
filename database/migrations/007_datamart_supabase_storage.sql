-- =====================================================================
-- 007_datamart_supabase_storage.sql
-- PS-05 Enterprise Intelligence Platform
--
-- DataMart dataset metadata now reflects Supabase Storage:
--   storage_bucket  the dedicated `datamart-datasets` bucket
--   schema          detected column schema (JSONB) — METADATA ONLY,
--                   never the CSV rows themselves
--   content_type    stored object content type
--   checksum        SHA-256 of the uploaded CSV (integrity check)
--
-- The complete CSV stays as ONE object in Supabase Storage; PostgreSQL
-- still stores only metadata/schema. Error reporting keeps the existing
-- `error_message` column as `processing_error`.
--
-- NOTE: The migration runner wraps each migration file in a transaction.
-- Do not add BEGIN/COMMIT to migration files.
-- =====================================================================

ALTER TABLE datasets
    ADD COLUMN storage_bucket TEXT,
    ADD COLUMN schema         JSONB,
    ADD COLUMN content_type   TEXT,
    ADD COLUMN checksum       TEXT;