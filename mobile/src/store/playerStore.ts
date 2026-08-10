import { create } from 'zustand';
import TrackPlayer, { RepeatMode } from 'react-native-track-player';
import {
  playQueue,
  rebuildQueue,
  songToTrack,
} from '../services/playback/playbackService';
import type { Song } from '../types/song';

interface PlayerState {
  currentSongId: number | null;
  isPlaying: boolean;
  shuffleOn: boolean;
  repeatMode: RepeatMode;
  queueSongIds: number[];
  baseOrder: number[];
  baseSongs: Song[];
  play: (songs: Song[], startIndex: number) => Promise<void>;
  togglePlay: () => Promise<void>;
  toggleShuffle: () => Promise<void>;
  cycleRepeatMode: () => Promise<void>;
  skipNext: () => Promise<void>;
  skipPrevious: () => Promise<void>;
}

function shuffleKeepingFirst(songs: Song[], startIndex: number): Song[] {
  const first = songs[startIndex];
  const rest = songs.filter((_, index) => index !== startIndex);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = rest[i];
    rest[i] = rest[j];
    rest[j] = tmp;
  }
  return [first, ...rest];
}

function orderSongs(songs: Song[], startIndex: number, shuffle: boolean): Song[] {
  if (!shuffle) {
    return songs;
  }
  return shuffleKeepingFirst(songs, startIndex);
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSongId: null,
  isPlaying: false,
  shuffleOn: false,
  repeatMode: RepeatMode.Off,
  queueSongIds: [],
  baseOrder: [],
  baseSongs: [],

  play: async (songs, startIndex) => {
    const ordered = orderSongs(songs, startIndex, get().shuffleOn);
    await playQueue(ordered.map(songToTrack), 0);
    set({
      currentSongId: ordered[0]?.id ?? null,
      isPlaying: true,
      queueSongIds: ordered.map(s => s.id),
      baseOrder: songs.map(s => s.id),
      baseSongs: songs,
    });
  },

  togglePlay: async () => {
    if (get().isPlaying) {
      await TrackPlayer.pause();
      set({ isPlaying: false });
    } else {
      await TrackPlayer.play();
      set({ isPlaying: true });
    }
  },

  toggleShuffle: async () => {
    const { shuffleOn, baseSongs, baseOrder, currentSongId } = get();
    const nextShuffle = !shuffleOn;
    const currentIndex = baseOrder.indexOf(currentSongId ?? -1);
    const ordered = orderSongs(baseSongs, Math.max(0, currentIndex), nextShuffle);
    const startIndex = ordered.findIndex(s => s.id === currentSongId);
    await rebuildQueue(ordered.map(songToTrack), Math.max(0, startIndex));
    set({
      shuffleOn: nextShuffle,
      queueSongIds: ordered.map(s => s.id),
    });
  },

  cycleRepeatMode: async () => {
    const next: Record<RepeatMode, RepeatMode> = {
      [RepeatMode.Off]: RepeatMode.Track,
      [RepeatMode.Track]: RepeatMode.Queue,
      [RepeatMode.Queue]: RepeatMode.Off,
    };
    const repeatMode = next[get().repeatMode];
    await TrackPlayer.setRepeatMode(repeatMode);
    set({ repeatMode });
  },

  skipNext: async () => {
    await TrackPlayer.skipToNext();
  },

  skipPrevious: async () => {
    await TrackPlayer.skipToPrevious();
  },
}));
