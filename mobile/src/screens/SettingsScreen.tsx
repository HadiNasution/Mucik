import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLibraryStore } from '../store/libraryStore';
import { SongListItem } from '../components/SongListItem';
import type { Song } from '../types/song';

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const songs = useLibraryStore(s => s.songs);
  const load = useLibraryStore(s => s.load);
  const updateSong = useLibraryStore(s => s.updateSong);
  const removeSong = useLibraryStore(s => s.removeSong);
  const [editing, setEditing] = useState<Song | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');

  useEffect(() => {
    void load();
  }, [load]);

  const openEdit = (song: Song) => {
    setEditing(song);
    setTitle(song.title);
    setArtist(song.artist);
    setAlbum(song.album);
  };

  const save = async () => {
    if (!editing) {
      return;
    }
    await updateSong(editing.id, {
      title: title.trim() || editing.title,
      artist: artist.trim(),
      album: album.trim(),
    });
    setEditing(null);
  };

  const confirmDelete = (song: Song) => {
    Alert.alert('Delete song', `Remove "${song.title}" from your library?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void removeSong(song.id),
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.header}>Settings</Text>
      <Text style={styles.subheader}>Tap a song to edit its metadata</Text>
      <FlatList
        data={songs}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <SongListItem
            song={item}
            isCurrent={false}
            onPress={() => openEdit(item)}
            onLongPress={() => confirmDelete(item)}
          />
        )}
      />

      <Modal visible={editing !== null} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Edit Metadata</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor="#666"
            />
            <TextInput
              style={styles.input}
              value={artist}
              onChangeText={setArtist}
              placeholder="Artist"
              placeholderTextColor="#666"
            />
            <TextInput
              style={styles.input}
              value={album}
              onChangeText={setAlbum}
              placeholder="Album"
              placeholderTextColor="#666"
            />
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => setEditing(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => void save()}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  subheader: {
    color: '#9a9aa0',
    fontSize: 13,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1c1c20',
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#26262b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 4,
  },
  cancelText: {
    color: '#9a9aa0',
    fontSize: 15,
  },
  saveText: {
    color: '#4da3ff',
    fontSize: 15,
    fontWeight: '600',
  },
});
