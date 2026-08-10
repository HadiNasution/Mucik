import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';

interface Props {
  onOpen: () => void;
}

export function PlayerBar({ onOpen }: Props) {
  const currentSongId = usePlayerStore(s => s.currentSongId);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const togglePlay = usePlayerStore(s => s.togglePlay);
  const songs = useLibraryStore(s => s.songs);

  if (currentSongId === null) {
    return null;
  }
  const current = songs.find(song => song.id === currentSongId);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.info} onPress={onOpen} activeOpacity={0.7}>
        <Text style={styles.title} numberOfLines={1}>
          {current?.title ?? 'Playing...'}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {current?.artist ?? ''}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => void togglePlay()} style={styles.playButton}>
        <Text style={styles.playIcon}>{isPlaying ? '❚❚' : '▶'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c20',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  artist: {
    color: '#9a9aa0',
    fontSize: 12,
  },
  playButton: {
    padding: 8,
  },
  playIcon: {
    color: '#fff',
    fontSize: 14,
  },
});
