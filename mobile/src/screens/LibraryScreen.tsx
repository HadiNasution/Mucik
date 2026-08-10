import React, { useEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import { SongListItem } from '../components/SongListItem';

export function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const songs = useLibraryStore(s => s.songs);
  const load = useLibraryStore(s => s.load);
  const play = usePlayerStore(s => s.play);
  const currentSongId = usePlayerStore(s => s.currentSongId);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.header}>Library</Text>
      <FlatList
        data={songs}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={songs.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No songs yet</Text>
            <Text style={styles.emptySubtitle}>
              Paste a YouTube link in the Convert tab to get started.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <SongListItem
            song={item}
            isCurrent={item.id === currentSongId}
            onPress={() => void play(songs, index)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121216',
  },
  header: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: '#9a9aa0',
    fontSize: 14,
    textAlign: 'center',
  },
});
