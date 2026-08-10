import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TrackPlayer, { RepeatMode } from 'react-native-track-player';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { formatDuration } from '../utils/format';

const REPEAT_LABEL: Record<RepeatMode, string> = {
  [RepeatMode.Off]: 'Repeat off',
  [RepeatMode.Track]: 'Repeat one',
  [RepeatMode.Queue]: 'Repeat all',
};

export function PlayerScreen() {
  const insets = useSafeAreaInsets();
  const [positionMs, setPositionMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentSongId = usePlayerStore(s => s.currentSongId);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const shuffleOn = usePlayerStore(s => s.shuffleOn);
  const repeatMode = usePlayerStore(s => s.repeatMode);
  const togglePlay = usePlayerStore(s => s.togglePlay);
  const toggleShuffle = usePlayerStore(s => s.toggleShuffle);
  const cycleRepeatMode = usePlayerStore(s => s.cycleRepeatMode);
  const skipNext = usePlayerStore(s => s.skipNext);
  const skipPrevious = usePlayerStore(s => s.skipPrevious);
  const songs = useLibraryStore(s => s.songs);

  const current = songs.find(song => song.id === currentSongId);

  useEffect(() => {
    timerRef.current = setInterval(async () => {
      const progress = await TrackPlayer.getProgress();
      setPositionMs(progress.position * 1000);
    }, 500);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const durationMs = current?.durationMs ?? 0;
  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.playingLabel}>Now Playing</Text>

      {current?.artworkPath ? (
        <Image
          source={{ uri: `file://${current.artworkPath}` }}
          style={styles.artwork}
        />
      ) : (
        <View style={[styles.artwork, styles.placeholder]}>
          <Text style={styles.placeholderText}>
            {current?.title.charAt(0) ?? '♪'}
          </Text>
        </View>
      )}

      <Text style={styles.title} numberOfLines={2}>
        {current?.title ?? 'Nothing playing'}
      </Text>
      <Text style={styles.artist} numberOfLines={1}>
        {current?.artist ?? ''}
      </Text>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.timeRow}>
        <Text style={styles.time}>{formatDuration(positionMs)}</Text>
        <Text style={styles.time}>{formatDuration(durationMs)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          onPress={() => void toggleShuffle()}
          style={styles.sideControl}>
          <Text style={[styles.shuffleText, shuffleOn && styles.active]}>
            Shuffle
          </Text>
        </TouchableOpacity>
        <View style={styles.mainControls}>
          <TouchableOpacity onPress={() => void skipPrevious()} style={styles.skip}>
            <Text style={styles.skipIcon}>⏮</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => void togglePlay()} style={styles.playButton}>
            <Text style={styles.playIcon}>{isPlaying ? '❚❚' : '▶'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => void skipNext()} style={styles.skip}>
            <Text style={styles.skipIcon}>⏭</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => void cycleRepeatMode()}
          style={styles.sideControl}>
          <Text style={styles.repeatText}>{REPEAT_LABEL[repeatMode]}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121216',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  playingLabel: {
    color: '#9a9aa0',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 24,
  },
  artwork: {
    width: 260,
    height: 260,
    borderRadius: 12,
    marginBottom: 28,
  },
  placeholder: {
    backgroundColor: '#1c1c20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#555',
    fontSize: 96,
    fontWeight: '600',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  artist: {
    color: '#9a9aa0',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  progressTrack: {
    alignSelf: 'stretch',
    height: 4,
    backgroundColor: '#26262b',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#4da3ff',
  },
  timeRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 24,
  },
  time: {
    color: '#9a9aa0',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4da3ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  skip: {
    padding: 6,
  },
  skipIcon: {
    color: '#fff',
    fontSize: 26,
  },
  sideControl: {
    width: 64,
  },
  shuffleText: {
    color: '#9a9aa0',
    fontSize: 12,
    fontWeight: '600',
  },
  active: {
    color: '#4da3ff',
  },
  repeatText: {
    color: '#9a9aa0',
    fontSize: 12,
    textAlign: 'right',
  },
});
