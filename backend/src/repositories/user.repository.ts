import { pool } from '../config/database';
import type { User, UserRole } from '../models/user.model';

const USER_COLUMNS = `
  id,
  name,
  email,
  password_hash,
  role,
  is_active,
  email_verified,
  created_at,
  updated_at
` as const;

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password_hash: row.password_hash,
    role: row.role,
    is_active: row.is_active,
    email_verified: row.email_verified,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const selectColumns = `SELECT ${USER_COLUMNS} FROM users`;

export async function findByEmail(email: string): Promise<User | null> {
  const result = await pool.query<UserRow>(
    `${selectColumns} WHERE lower(email) = $1`,
    [email.toLowerCase()],
  );
  const row = result.rows[0];
  return row ? mapRow(row) : null;
}

export async function findById(id: string): Promise<User | null> {
  const result = await pool.query<UserRow>(
    `${selectColumns} WHERE id = $1`,
    [id],
  );
  const row = result.rows[0];
  return row ? mapRow(row) : null;
}

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
}

export async function create(input: CreateUserInput): Promise<User> {
  const result = await pool.query<UserRow>(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING ${USER_COLUMNS}`,
    [input.name, input.email.toLowerCase(), input.passwordHash],
  );
  return mapRow(result.rows[0]!);
}
