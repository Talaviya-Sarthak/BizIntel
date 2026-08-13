-- =====================================================================
-- 006_rag_pgvector.sql
-- PS-05 Enterprise Intelligence Platform
--
-- Enables pgvector extension and creates Supabase RAG storage tables:
--   documents
--   document_chunks
--   embeddings
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. documents table
CREATE TABLE IF NOT EXISTS documents (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    file_path   TEXT,
    uploaded_by TEXT        DEFAULT 'system',
    page_count  INTEGER     DEFAULT 1,
    status      TEXT        NOT NULL DEFAULT 'Complete',
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. document_chunks table
CREATE TABLE IF NOT EXISTS document_chunks (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID        REFERENCES documents(id) ON DELETE CASCADE,
    page_number INTEGER     DEFAULT 1,
    chunk_index INTEGER     NOT NULL,
    heading     TEXT,
    content     TEXT        NOT NULL,
    token_count INTEGER     DEFAULT 0,
    metadata    JSONB       DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. embeddings table
CREATE TABLE IF NOT EXISTS embeddings (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    chunk_id    UUID        REFERENCES document_chunks(id) ON DELETE CASCADE,
    embedding   VECTOR(384),
    model       TEXT        NOT NULL DEFAULT 'all-MiniLM-L6-v2',
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- 4. Indexes for vector search & keyword FTS
CREATE INDEX IF NOT EXISTS document_chunks_doc_id_idx ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS document_chunks_fts_idx ON document_chunks USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS embeddings_chunk_id_idx ON embeddings(chunk_id);
