import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';
import { logger } from './logger.js';

/**
 * DATA MART Supabase Storage configuration (backend-only).
 *
 * DataMart CSV files are stored as single objects in the dedicated
 * `datamart-datasets` bucket under `datamart-datasets/{user_id}/{dataset_id}.csv`.
 *
 * The service-role key is used exclusively server-side and must never be
 * exposed to the frontend. RAG keeps its own Supabase setup (SUPABASE_DB_URL +
 * pgvector tables) and does NOT use this client.
 */
export const DATAMART_BUCKET = env.SUPABASE_DATAMART_BUCKET || 'datamart-datasets';

export function isSupabaseStorageConfigured(): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

let adminClient: SupabaseClient | null = null;

/** Lazily-created Supabase admin client for DataMart Storage. */
export function getSupabaseAdminClient(): SupabaseClient {
  if (!adminClient) {
    if (!isSupabaseStorageConfigured()) {
      throw new Error(
        'Supabase Storage is not configured: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for DataMart uploads',
      );
    }
    adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    logger.info({ bucket: DATAMART_BUCKET }, 'Supabase DataMart storage client initialized');
  }
  return adminClient;
}