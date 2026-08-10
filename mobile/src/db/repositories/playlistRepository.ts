import { getDatabase } from '../database';
import type { Playlist } from '../../types/playlist';

interface PlaylistRow {
  id: number;
  name: string;
  created_at: number;
}

function mapRow(row: PlaylistRow): Playlist {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}

function asPlaylistRow(row: Record<string, unknown>): PlaylistRow {
  return {
    id: row.id as number,
    name: row.name as string,
    created_at: row.created_at as number,
  };
}

export const playlistRepository = {
  async findAll(): Promise<Playlist[]> {
    const db = await getDatabase();
    const result = await db.execute('SELECT * FROM playlists ORDER BY name COLLATE NOCASE');
    return result.rows.map(row => mapRow(asPlaylistRow(row)));
  },

  async create(name: string): Promise<Playlist> {
    const db = await getDatabase();
    const createdAt = Date.now();
    const result = await db.execute(
      'INSERT INTO playlists (name, created_at) VALUES (?, ?)',
      [name, createdAt],
    );
    return { id: result.insertId as number, name, createdAt };
  },

  async rename(id: number, name: string): Promise<void> {
    const db = await getDatabase();
    await db.execute('UPDATE playlists SET name = ? WHERE id = ?', [name, id]);
  },

  async remove(id: number): Promise<void> {
    const db = await getDatabase();
    await db.execute('DELETE FROM playlist_songs WHERE playlist_id = ?', [id]);
    await db.execute('DELETE FROM playlists WHERE id = ?', [id]);
  },

  async getSongIds(playlistId: number): Promise<number[]> {
    const db = await getDatabase();
    const result = await db.execute(
      'SELECT song_id FROM playlist_songs WHERE playlist_id = ? ORDER BY position ASC',
      [playlistId],
    );
    return result.rows.map(row => row.song_id as number);
  },

  async addSong(playlistId: number, songId: number): Promise<void> {
    const db = await getDatabase();
    const maxResult = await db.execute(
      'SELECT COALESCE(MAX(position), 0) + 1 AS next FROM playlist_songs WHERE playlist_id = ?',
      [playlistId],
    );
    const position = maxResult.rows[0].next as number;
    await db.execute(
      'INSERT OR IGNORE INTO playlist_songs (playlist_id, song_id, position) VALUES (?, ?, ?)',
      [playlistId, songId, position],
    );
  },

  async removeSong(playlistId: number, songId: number): Promise<void> {
    const db = await getDatabase();
    await db.execute(
      'DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?',
      [playlistId, songId],
    );
  },

  async reorder(playlistId: number, songIds: number[]): Promise<void> {
    const db = await getDatabase();
    await db.transaction(async tx => {
      for (let i = 0; i < songIds.length; i++) {
        await tx.execute(
          'UPDATE playlist_songs SET position = ? WHERE playlist_id = ? AND song_id = ?',
          [i, playlistId, songIds[i]],
        );
      }
    });
  },
};
