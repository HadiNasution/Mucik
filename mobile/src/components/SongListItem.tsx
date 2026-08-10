import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Song } from '../types/song';
import { formatDuration } from '../utils/format';

interface Props {
  song: Song;
  isCurrent: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

export function SongListItem({ song, isCurrent, onPress, onLongPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}>
      {song.artworkPath ? (
        <Image source={{ uri: `file://${song.artworkPath}` }} style={styles.artwork} />
      ) : (
        <View style={[styles.artwork, styles.placeholder]}>
          <Text style={styles.placeholderText}>{song.title.charAt(0)}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={[styles.title, isCurrent && styles.currentTitle]} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {song.artist}
        </Text>
      </View>
      <Text style={styles.duration}>{formatDuration(song.durationMs)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  placeholder: {
    backgroundColor: '#2a2a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#aaa',
    fontSize: 18,
    fontWeight: '600',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  currentTitle: {
    color: '#4da3ff',
  },
  artist: {
    color: '#9a9aa0',
    fontSize: 13,
  },
  duration: {
    color: '#9a9aa0',
    fontSize: 13,
  },
});
