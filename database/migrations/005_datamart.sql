-- =====================================================================
-- 005_datamart.sql
-- PS-05 Enterprise Intelligence Platform
--
-- Adds the DataMart reusable analytical layer:
--   datamart_analyses          (saved structured queries)
--   datamart_analysis_runs     (execution history/metadata)
--   datamart_metrics           (reusable KPI definitions)
--   datamart_dashboards        (dashboard containers)
--   datamart_dashboard_widgets (widgets bound to analyses/metrics)
--
-- The uploaded dataset remains the source of truth. PostgreSQL stores
-- query CONFIGURATION and METADATA only — never the analytical results.
-- DuckDB executes every query against the original files at run time.
--
-- NOTE: The migration runner wraps each migration file in a transaction.
-- Do not add BEGIN/COMMIT to migration files.
-- =====================================================================

-- ---------------------------------------------------------------------
-- datamart_analyses
-- A saved analytical query. `query_config` is the canonical structured
-- (JSONB) definition used to re-execute against current dataset data.
-- SQL is never stored as the canonical definition.
-- ---------------------------------------------------------------------
CREATE TABLE datamart_analyses (
    id               UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL,
    name             TEXT        NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 200),
    description      TEXT        CHECK (description IS NULL OR char_length(description) <= 1000),
    query_config     JSONB       NOT NULL,
    dataset_ids      JSONB       NOT NULL DEFAULT '[]'::jsonb,
    tags             JSONB       NOT NULL DEFAULT '[]'::jsonb,
    last_executed_at TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT datamart_analyses_pkey PRIMARY KEY (id),
    CONSTRAINT datamart_analyses_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);

-- Every analysis lookup is scoped by owner, then listed newest-first.
CREATE INDEX datamart_analyses_user_id_idx ON datamart_analyses (user_id);
CREATE INDEX datamart_analyses_user_created_at_idx ON datamart_analyses (user_id, created_at DESC);

-- ---------------------------------------------------------------------
-- datamart_analysis_runs
-- Execution history for saved analyses. Metadata only — result rows are
-- never persisted here (they would go stale the moment the dataset changes).
-- ---------------------------------------------------------------------
CREATE TABLE datamart_analysis_runs (
    id                UUID        NOT NULL DEFAULT gen_random_uuid(),
    analysis_id       UUID        NOT NULL,
    user_id           UUID        NOT NULL,
    status            TEXT        NOT NULL DEFAULT 'SUCCESS'
                        CHECK (status IN ('SUCCESS', 'FAILED')),
    execution_time_ms INTEGER     NOT NULL CHECK (execution_time_ms >= 0),
    rows_returned     INTEGER     NOT NULL DEFAULT 0 CHECK (rows_returned >= 0),
    error_message     TEXT        CHECK (error_message IS NULL OR char_length(error_message) <= 1000),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT datamart_analysis_runs_pkey PRIMARY KEY (id),
    CONSTRAINT datamart_analysis_runs_analysis_id_fkey FOREIGN KEY (analysis_id)
        REFERENCES datamart_analyses (id) ON DELETE CASCADE,
    CONSTRAINT datamart_analysis_runs_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX datamart_analysis_runs_analysis_id_idx ON datamart_analysis_runs (analysis_id);
CREATE INDEX datamart_analysis_runs_user_id_idx ON datamart_analysis_runs (user_id);

-- ---------------------------------------------------------------------
-- datamart_metrics
-- Reusable KPI definitions. `definition` is a JSONB metric built from the
-- safe expression grammar (e.g. { "kind": "formula",
-- "formula": "SUM(profit) / SUM(revenue)" }). `format` is presentation
-- metadata applied client-side; raw analytical values are never altered.
-- ---------------------------------------------------------------------
CREATE TABLE datamart_metrics (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL,
    dataset_id  UUID        NOT NULL,
    name        TEXT        NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
    description TEXT        CHECK (description IS NULL OR char_length(description) <= 1000),
    definition  JSONB       NOT NULL,
    format      TEXT        NOT NULL DEFAULT 'number'
                  CHECK (format IN ('number', 'currency', 'percent', 'decimal', 'compact')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT datamart_metrics_pkey PRIMARY KEY (id),
    CONSTRAINT datamart_metrics_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT datamart_metrics_dataset_id_fkey FOREIGN KEY (dataset_id)
        REFERENCES datasets (id) ON DELETE CASCADE
);

CREATE INDEX datamart_metrics_user_id_idx ON datamart_metrics (user_id);
CREATE INDEX datamart_metrics_dataset_id_idx ON datamart_metrics (dataset_id);

-- ---------------------------------------------------------------------
-- datamart_dashboards
-- Dashboard containers. Layout is a simple responsive column count
-- ('1' | '2' | '3'). Dashboards are private to their owner.
-- ---------------------------------------------------------------------
CREATE TABLE datamart_dashboards (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL,
    name        TEXT        NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 200),
    description TEXT        CHECK (description IS NULL OR char_length(description) <= 1000),
    layout      TEXT        NOT NULL DEFAULT '2'
                  CHECK (layout IN ('1', '2', '3')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT datamart_dashboards_pkey PRIMARY KEY (id),
    CONSTRAINT datamart_dashboards_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX datamart_dashboards_user_id_idx ON datamart_dashboards (user_id);
CREATE INDEX datamart_dashboards_user_created_at_idx ON datamart_dashboards (user_id, created_at DESC);

-- ---------------------------------------------------------------------
-- datamart_dashboard_widgets
-- A widget binds a dashboard to a saved analysis or a saved metric.
-- `configuration` holds chart settings only (type, axes, title, etc.) —
-- never raw analytical results. Results are always freshly executed.
-- ---------------------------------------------------------------------
CREATE TABLE datamart_dashboard_widgets (
    id            UUID        NOT NULL DEFAULT gen_random_uuid(),
    dashboard_id  UUID        NOT NULL,
    type          TEXT        NOT NULL DEFAULT 'table'
                    CHECK (type IN ('kpi', 'table', 'bar', 'line', 'pie', 'scatter', 'area')),
    title         TEXT        NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
    analysis_id   UUID,
    metric_id     UUID,
    configuration JSONB       NOT NULL DEFAULT '{}'::jsonb,
    position      INTEGER     NOT NULL DEFAULT 0 CHECK (position >= 0),
    size          TEXT        NOT NULL DEFAULT 'full'
                    CHECK (size IN ('full', 'half', 'third')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT datamart_dashboard_widgets_pkey PRIMARY KEY (id),
    CONSTRAINT datamart_dashboard_widgets_dashboard_id_fkey FOREIGN KEY (dashboard_id)
        REFERENCES datamart_dashboards (id) ON DELETE CASCADE,
    CONSTRAINT datamart_dashboard_widgets_analysis_id_fkey FOREIGN KEY (analysis_id)
        REFERENCES datamart_analyses (id) ON DELETE SET NULL,
    CONSTRAINT datamart_dashboard_widgets_metric_id_fkey FOREIGN KEY (metric_id)
        REFERENCES datamart_metrics (id) ON DELETE SET NULL,
    CONSTRAINT datamart_dashboard_widgets_source_check CHECK (
        (analysis_id IS NOT NULL) <> (metric_id IS NOT NULL)
    )
);

CREATE INDEX datamart_dashboard_widgets_dashboard_id_idx ON datamart_dashboard_widgets (dashboard_id);
CREATE INDEX datamart_dashboard_widgets_analysis_id_idx ON datamart_dashboard_widgets (analysis_id);
CREATE INDEX datamart_dashboard_widgets_metric_id_idx ON datamart_dashboard_widgets (metric_id);

-- ---------------------------------------------------------------------
-- updated_at maintenance triggers
-- ---------------------------------------------------------------------
CREATE TRIGGER datamart_analyses_set_updated_at
    BEFORE UPDATE ON datamart_analyses
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER datamart_metrics_set_updated_at
    BEFORE UPDATE ON datamart_metrics
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER datamart_dashboards_set_updated_at
    BEFORE UPDATE ON datamart_dashboards
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
