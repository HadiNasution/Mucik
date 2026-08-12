import React, { useMemo, useState } from 'react';
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
  const [reorderVisible, setReorderVisible] = useState(false);
  const songs = useLibraryStore(s => s.songs);
  const playlistSongIds = usePlaylistStore(s => s.playlistSongIds);
  const removeSong = usePlaylistStore(s => s.removeSong);
  const addSong = usePlaylistStore(s => s.addSong);
  const reorder = usePlaylistStore(s => s.reorder);
  const play = usePlayerStore(s => s.play);
  const currentSongId = usePlayerStore(s => s.currentSongId);

  const songIds = useMemo(
    () => playlistSongIds[playlistId] ?? [],
    [playlistSongIds, playlistId],
  );
  const playlistSongs = useMemo(() => {
    const map = new Map(songs.map(s => [s.id, s]));
    return songIds.map(id => map.get(id)).filter((s): s is Song => !!s);
  }, [songIds, songs]);

  const addableSongs = useMemo(
    () => songs.filter(s => !songIds.includes(s.id)),
    [songs, songIds],
  );

  const move = (index: number, delta: number) => {
    const next = [...songIds];
    const target = index + delta;
    if (target < 0 || target >= next.length) {
      return;
    }
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    void reorder(playlistId, next);
  };

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
        <TouchableOpacity
          style={[styles.actionButton, reorderVisible && styles.actionButtonActive]}
          onPress={() => setReorderVisible(v => !v)}>
          <Text style={styles.actionText}>Reorder</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={playlistSongs}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={
          <Text style={styles.empty}>Playlist is empty.</Text>
        }
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            {reorderVisible && (
              <View style={styles.reorderControls}>
                <TouchableOpacity
                  disabled={index === 0}
                  onPress={() => move(index, -1)}
                  style={styles.reorderButton}>
                  <Text style={[styles.reorderIcon, index === 0 && styles.reorderDisabled]}>
                    ▲
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={index === playlistSongs.length - 1}
                  onPress={() => move(index, 1)}
                  style={styles.reorderButton}>
                  <Text
                    style={[
                      styles.reorderIcon,
                      index === playlistSongs.length - 1 && styles.reorderDisabled,
                    ]}>
                    ▼
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            <SongListItem
              song={item}
              isCurrent={item.id === currentSongId}
              onPress={() => {
                if (!reorderVisible) {
                  void play(playlistSongs, index);
                }
              }}
              onLongPress={() => {
                if (!reorderVisible) {
                  void removeSong(playlistId, item.id);
                }
              }}
            />
          </View>
        )}
      />

      <Modal visible={addVisible} animationType="slide">
        <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAddVisible(false)}>
              <Text style={styles.cancelText}>Done</Text>
            </TouchableOpacity>
            <Text style={styles.header}>Add Songs</Text>
            <View style={styles.spacer} />
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
  actionButtonActive: {
    backgroundColor: '#2a6bbd',
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reorderControls: {
    paddingLeft: 12,
    gap: 4,
  },
  reorderButton: {
    padding: 4,
  },
  reorderIcon: {
    color: '#4da3ff',
    fontSize: 12,
    fontWeight: '700',
  },
  reorderDisabled: {
    color: '#3a3a40',
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
  spacer: {
    width: 44,
  },
  empty: {
    color: '#9a9aa0',
    textAlign: 'center',
    marginTop: 32,
  },
});
