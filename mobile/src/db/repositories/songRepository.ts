import { getDatabase } from '../database';
import type { Scalar } from '@op-engineering/op-sqlite';
import type { Song, SongFields, SongInput } from '../../types/song';

interface SongRow {
  id: number;
  youtube_id: string;
  title: string;
  artist: string;
  album: string;
  artwork_path: string | null;
  file_path: string;
  duration_ms: number;
  source_url: string;
  created_at: number;
}

function mapRow(row: SongRow): Song {
  return {
    id: row.id,
    youtubeId: row.youtube_id,
    title: row.title,
    artist: row.artist,
    album: row.album,
    artworkPath: row.artwork_path,
    filePath: row.file_path,
    durationMs: row.duration_ms,
    sourceUrl: row.source_url,
    createdAt: row.created_at,
  };
}

function asSongRow(row: Record<string, Scalar>): SongRow {
  return {
    id: row.id as number,
    youtube_id: row.youtube_id as string,
    title: row.title as string,
    artist: row.artist as string,
    album: row.album as string,
    artwork_path: row.artwork_path as string | null,
    file_path: row.file_path as string,
    duration_ms: row.duration_ms as number,
    source_url: row.source_url as string,
    created_at: row.created_at as number,
  };
}

export const songRepository = {
  async findAll(): Promise<Song[]> {
    const db = await getDatabase();
    const result = await db.execute('SELECT * FROM songs ORDER BY created_at DESC');
    return result.rows.map(row => mapRow(asSongRow(row)));
  },

  async findByYoutubeId(youtubeId: string): Promise<Song | null> {
    const db = await getDatabase();
    const result = await db.execute(
      'SELECT * FROM songs WHERE youtube_id = ? LIMIT 1',
      [youtubeId],
    );
    if (result.rows.length === 0) {
      return null;
    }
    return mapRow(asSongRow(result.rows[0]));
  },

  async findByIds(ids: number[]): Promise<Song[]> {
    if (ids.length === 0) {
      return [];
    }
    const db = await getDatabase();
    const placeholders = ids.map(() => '?').join(', ');
    const result = await db.execute(
      `SELECT * FROM songs WHERE id IN (${placeholders})`,
      ids,
    );
    return result.rows.map(row => mapRow(asSongRow(row)));
  },

  async insert(input: SongInput): Promise<Song> {
    const db = await getDatabase();
    const createdAt = Date.now();
    const result = await db.execute(
      `INSERT INTO songs (
        youtube_id, title, artist, album, artwork_path, file_path,
        duration_ms, source_url, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.youtubeId,
        input.title,
        input.artist,
        input.album,
        input.artworkPath,
        input.filePath,
        input.durationMs,
        input.sourceUrl,
        createdAt,
      ],
    );
    return {
      id: result.insertId as number,
      youtubeId: input.youtubeId,
      title: input.title,
      artist: input.artist,
      album: input.album,
      artworkPath: input.artworkPath,
      filePath: input.filePath,
      durationMs: input.durationMs,
      sourceUrl: input.sourceUrl,
      createdAt,
    };
  },

  async update(id: number, fields: SongFields): Promise<void> {
    const sets: string[] = [];
    const params: Scalar[] = [];
    if (fields.title !== undefined) {
      sets.push('title = ?');
      params.push(fields.title);
    }
    if (fields.artist !== undefined) {
      sets.push('artist = ?');
      params.push(fields.artist);
    }
    if (fields.album !== undefined) {
      sets.push('album = ?');
      params.push(fields.album);
    }
    if (fields.artworkPath !== undefined) {
      sets.push('artwork_path = ?');
      params.push(fields.artworkPath);
    }
    if (sets.length === 0) {
      return;
    }
    const db = await getDatabase();
    params.push(id);
    await db.execute(`UPDATE songs SET ${sets.join(', ')} WHERE id = ?`, params);
  },

  async remove(id: number): Promise<void> {
    const db = await getDatabase();
    await db.execute('DELETE FROM songs WHERE id = ?', [id]);
    await db.execute('DELETE FROM playlist_songs WHERE song_id = ?', [id]);
  },

  async count(): Promise<number> {
    const db = await getDatabase();
    const result = await db.execute('SELECT COUNT(*) AS c FROM songs');
    return result.rows[0].c as number;
  },
};
