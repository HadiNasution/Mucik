import { create } from 'zustand';
import { playlistRepository } from '../db/repositories/playlistRepository';
import type { Playlist } from '../types/playlist';

interface PlaylistState {
  playlists: Playlist[];
  playlistSongIds: Record<number, number[]>;
  load: () => Promise<void>;
  createPlaylist: (name: string) => Promise<void>;
  renamePlaylist: (id: number, name: string) => Promise<void>;
  deletePlaylist: (id: number) => Promise<void>;
  addSong: (playlistId: number, songId: number) => Promise<void>;
  removeSong: (playlistId: number, songId: number) => Promise<void>;
  reorder: (playlistId: number, songIds: number[]) => Promise<void>;
}

export const usePlaylistStore = create<PlaylistState>(set => ({
  playlists: [],
  playlistSongIds: {},

  load: async () => {
    const playlists = await playlistRepository.findAll();
    const playlistSongIds: Record<number, number[]> = {};
    for (const playlist of playlists) {
      playlistSongIds[playlist.id] = await playlistRepository.getSongIds(
        playlist.id,
      );
    }
    set({ playlists, playlistSongIds });
  },

  createPlaylist: async name => {
    const playlist = await playlistRepository.create(name);
    set(state => ({
      playlists: [...state.playlists, playlist],
      playlistSongIds: { ...state.playlistSongIds, [playlist.id]: [] },
    }));
  },

  renamePlaylist: async (id, name) => {
    await playlistRepository.rename(id, name);
    set(state => ({
      playlists: state.playlists.map(p =>
        p.id === id ? { ...p, name } : p,
      ),
    }));
  },

  deletePlaylist: async id => {
    await playlistRepository.remove(id);
    set(state => {
      const playlistSongIds = { ...state.playlistSongIds };
      delete playlistSongIds[id];
      return {
        playlists: state.playlists.filter(p => p.id !== id),
        playlistSongIds,
      };
    });
  },

  addSong: async (playlistId, songId) => {
    await playlistRepository.addSong(playlistId, songId);
    const songIds = await playlistRepository.getSongIds(playlistId);
    set(state => ({
      playlistSongIds: { ...state.playlistSongIds, [playlistId]: songIds },
    }));
  },

  removeSong: async (playlistId, songId) => {
    await playlistRepository.removeSong(playlistId, songId);
    const songIds = await playlistRepository.getSongIds(playlistId);
    set(state => ({
      playlistSongIds: { ...state.playlistSongIds, [playlistId]: songIds },
    }));
  },

  reorder: async (playlistId, songIds) => {
    await playlistRepository.reorder(playlistId, songIds);
    set(state => ({
      playlistSongIds: { ...state.playlistSongIds, [playlistId]: songIds },
    }));
  },
}));
