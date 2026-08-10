import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLibraryStore } from '../store/libraryStore';
import { usePlaylistStore } from '../store/playlistStore';
import { usePlayerStore } from '../store/playerStore';
import { SongListItem } from '../components/SongListItem';
import type { RootStackParamList } from '../navigation/types';
import type { Song } from '../types/song';

type Props = NativeStackScreenProps<RootStackParamList, 'PlaylistDetail'>;

export function PlaylistDetailScreen({ route }: Props) {
  const insets = useSafeAreaInsets();
  const { playlistId, playlistName } = route.params;
  const [addVisible, setAddVisible] = useState(false);
  const songs = useLibraryStore(s => s.songs);
  const playlistSongIds = usePlaylistStore(s => s.playlistSongIds);
  const removeSong = usePlaylistStore(s => s.removeSong);
  const addSong = usePlaylistStore(s => s.addSong);
  const play = usePlayerStore(s => s.play);
  const currentSongId = usePlayerStore(s => s.currentSongId);

  const songIds = playlistSongIds[playlistId] ?? [];
  const playlistSongs = useMemo(() => {
    const map = new Map(songs.map(s => [s.id, s]));
    return songIds.map(id => map.get(id)).filter((s): s is Song => !!s);
  }, [songIds, songs]);

  const addableSongs = useMemo(
    () => songs.filter(s => !songIds.includes(s.id)),
    [songs, songIds],
  );

  const playList = () => {
    if (playlistSongs.length > 0) {
      void play(playlistSongs, 0);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.header}>{playlistName}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={playList}>
          <Text style={styles.actionText}>Play all</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setAddVisible(true)}>
          <Text style={styles.actionText}>Add songs</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={playlistSongs}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={
          <Text style={styles.empty}>Playlist is empty.</Text>
        }
        renderItem={({ item, index }) => (
          <SongListItem
            song={item}
            isCurrent={item.id === currentSongId}
            onPress={() => void play(playlistSongs, index)}
            onLongPress={() => void removeSong(playlistId, item.id)}
          />
        )}
      />

      <Modal visible={addVisible} animationType="slide">
        <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAddVisible(false)}>
              <Text style={styles.cancelText}>Done</Text>
            </TouchableOpacity>
            <Text style={styles.header}>Add Songs</Text>
            <View style={{ width: 44 }} />
          </View>
          <FlatList
            data={addableSongs}
            keyExtractor={item => String(item.id)}
            ListEmptyComponent={
              <Text style={styles.empty}>All songs are in this playlist.</Text>
            }
            renderItem={({ item }) => (
              <SongListItem
                song={item}
                isCurrent={false}
                onPress={() => void addSong(playlistId, item.id)}
              />
            )}
          />
        </View>
      </Modal>
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
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  actionButton: {
    backgroundColor: '#4da3ff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelText: {
    color: '#4da3ff',
    fontSize: 16,
    paddingHorizontal: 16,
  },
  empty: {
    color: '#9a9aa0',
    textAlign: 'center',
    marginTop: 32,
  },
});
