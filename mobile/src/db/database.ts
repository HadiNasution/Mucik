import { open, type DB } from '@op-engineering/op-sqlite';

let db: DB | null = null;

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    youtube_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL DEFAULT '',
    album TEXT NOT NULL DEFAULT '',
    artwork_path TEXT,
    file_path TEXT NOT NULL,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    source_url TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS playlist_songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playlist_id INTEGER NOT NULL,
    song_id INTEGER NOT NULL,
    position INTEGER NOT NULL,
    UNIQUE(playlist_id, song_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist)`,
  `CREATE INDEX IF NOT EXISTS idx_songs_album ON songs(album)`,
  `CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist ON playlist_songs(playlist_id)`,
];

export async function getDatabase(): Promise<DB> {
  if (!db) {
    db = open({ name: 'mucik.db' });
    for (const sql of SCHEMA_STATEMENTS) {
      await db.execute(sql);
    }
  }
  return db;
}
