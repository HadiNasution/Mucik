import { create } from 'zustand';
import { songRepository } from '../db/repositories/songRepository';
import type { Song, SongFields } from '../types/song';

interface SongGroup {
  key: string;
  songs: Song[];
}

export function groupByArtist(songs: Song[]): SongGroup[] {
  const map = new Map<string, Song[]>();
  for (const song of songs) {
    const key = song.artist || 'Unknown Artist';
    const list = map.get(key) ?? [];
    list.push(song);
    map.set(key, list);
  }
  return [...map.entries()]
    .map(([key, list]) => ({ key, songs: list }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function groupByAlbum(songs: Song[]): SongGroup[] {
  const map = new Map<string, Song[]>();
  for (const song of songs) {
    const key = song.album || 'Unknown Album';
    const list = map.get(key) ?? [];
    list.push(song);
    map.set(key, list);
  }
  return [...map.entries()]
    .map(([key, list]) => ({ key, songs: list }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

interface LibraryState {
  songs: Song[];
  load: () => Promise<void>;
  updateSong: (id: number, fields: SongFields) => Promise<void>;
  removeSong: (id: number) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>(set => ({
  songs: [],

  load: async () => {
    const songs = await songRepository.findAll();
    set({ songs });
  },

  updateSong: async (id, fields) => {
    await songRepository.update(id, fields);
    set(state => ({
      songs: state.songs.map(song =>
        song.id === id ? { ...song, ...fields } : song,
      ),
    }));
  },

  removeSong: async id => {
    await songRepository.remove(id);
    set(state => ({ songs: state.songs.filter(song => song.id !== id) }));
  },
}));
