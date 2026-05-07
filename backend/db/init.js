import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

let db = null;

export const initializeDatabase = async () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required and must be a PostgreSQL connection string (e.g. postgres://user:pass@host:5432/db)');
  }

  // Ensure the provided DATABASE_URL looks like a Postgres connection string.
  if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
    throw new Error('DATABASE_URL does not look like a PostgreSQL URL. Set DATABASE_URL to your Supabase (or other Postgres) connection string in production. For local development, use Railway/Postgres or run a local Postgres instance.');
  }

  db = new Client({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await db.connect();
    console.log('Connected to PostgreSQL database');

    // Create tables
    const schema = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        verification_code TEXT,
        verification_code_expires TIMESTAMP,
        password_reset_code TEXT,
        password_reset_code_expires TIMESTAMP,
        delete_account_code TEXT,
        delete_account_code_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        creator_id TEXT NOT NULL REFERENCES users(id),
        is_public BOOLEAN DEFAULT FALSE,
        allow_audio BOOLEAN DEFAULT FALSE,
        room_code TEXT UNIQUE,
        current_song JSONB,
        is_playing BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS room_members (
        id SERIAL PRIMARY KEY,
        room_id TEXT NOT NULL REFERENCES rooms(id),
        user_id TEXT NOT NULL REFERENCES users(id),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(room_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS room_songs (
        id SERIAL PRIMARY KEY,
        room_id TEXT NOT NULL REFERENCES rooms(id),
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        album TEXT,
        duration INTEGER,
        source TEXT,
        source_id TEXT,
        added_by TEXT NOT NULL REFERENCES users(id),
        played_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_music_accounts (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        service TEXT NOT NULL,
        account_id TEXT NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        is_premium BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, service)
      );
    `;

    await db.query(schema);
    console.log('✅ Database initialized successfully');

  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }

  return db;
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
};
