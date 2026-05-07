-- Schema for Music Room (Postgres)

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
  creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  allow_audio BOOLEAN DEFAULT FALSE,
  room_code TEXT UNIQUE,
  current_song JSONB,
  is_playing BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS room_members (
  id SERIAL PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(room_id, user_id)
);

CREATE TABLE IF NOT EXISTS room_songs (
  id SERIAL PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  duration INTEGER,
  source TEXT,
  source_id TEXT,
  added_by TEXT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  played_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_music_accounts (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service TEXT NOT NULL,
  account_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, service)
);
