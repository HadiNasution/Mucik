import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePlaylistStore } from '../store/playlistStore';
import { useLibraryStore, groupByAlbum, groupByArtist } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import { PromptModal } from '../components/PromptModal';
import { SongListItem } from '../components/SongListItem';
import type { RootStackParamList } from '../navigation/types';
import type { Song } from '../types/song';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Tab = 'playlists' | 'artists' | 'albums';

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'playlists', label: 'Playlists' },
  { key: 'artists', label: 'Artists' },
  { key: 'albums', label: 'Albums' },
];

interface Group {
  key: string;
  songs: Song[];
}

function GroupRow({ group, onPress }: { group: Group; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.groupRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.groupName}>{group.key}</Text>
      <Text style={styles.groupCount}>{group.songs.length} songs</Text>
    </TouchableOpacity>
  );
}

export function PlaylistsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [tab, setTab] = useState<Tab>('playlists');
  const [promptVisible, setPromptVisible] = useState(false);
  const playlists = usePlaylistStore(s => s.playlists);
  const playlistSongIds = usePlaylistStore(s => s.playlistSongIds);
  const loadPlaylists = usePlaylistStore(s => s.load);
  const createPlaylist = usePlaylistStore(s => s.createPlaylist);
  const songs = useLibraryStore(s => s.songs);
  const play = usePlayerStore(s => s.play);
  const currentSongId = usePlayerStore(s => s.currentSongId);

  useEffect(() => {
    void loadPlaylists();
  }, [loadPlaylists]);

  const playGroup = (group: Group) => {
    void play(group.songs, 0);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.header}>Playlists</Text>
      <View style={styles.tabs}>
        {TABS.map(item => (
          <TouchableOpacity
            key={item.key}
            style={[styles.tab, tab === item.key && styles.tabActive]}
            onPress={() => setTab(item.key)}>
            <Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'playlists' && (
        <>
          <FlatList
            data={playlists}
            keyExtractor={item => String(item.id)}
            ListEmptyComponent={
              <Text style={styles.empty}>No playlists yet.</Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.groupRow}
                onPress={() =>
                  navigation.navigate('PlaylistDetail', {
                    playlistId: item.id,
                    playlistName: item.name,
                  })
                }>
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.groupCount}>
                  {(playlistSongIds[item.id] ?? []).length} songs
                </Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setPromptVisible(true)}>
            <Text style={styles.createText}>+ New Playlist</Text>
          </TouchableOpacity>
        </>
      )}

      {tab === 'artists' && (
        <FlatList
          data={groupByArtist(songs)}
          keyExtractor={item => item.key}
          ListEmptyComponent={<Text style={styles.empty}>No songs yet.</Text>}
          renderItem={({ item }) => (
            <GroupRow group={item} onPress={() => playGroup(item)} />
          )}
        />
      )}

      {tab === 'albums' && (
        <FlatList
          data={groupByAlbum(songs)}
          keyExtractor={item => item.key}
          ListEmptyComponent={<Text style={styles.empty}>No songs yet.</Text>}
          renderItem={({ item }) => (
            <GroupRow group={item} onPress={() => playGroup(item)} />
          )}
        />
      )}

      <PromptModal
        visible={promptVisible}
        title="New Playlist"
        placeholder="Playlist name"
        onSubmit={async name => {
          setPromptVisible(false);
          await createPlaylist(name);
        }}
        onCancel={() => setPromptVisible(false)}
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1c1c20',
  },
  tabActive: {
    backgroundColor: '#4da3ff',
  },
  tabText: {
    color: '#9a9aa0',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  groupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#26262b',
  },
  groupName: {
    color: '#fff',
    fontSize: 15,
    flex: 1,
  },
  groupCount: {
    color: '#9a9aa0',
    fontSize: 13,
  },
  createButton: {
    backgroundColor: '#1c1c20',
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createText: {
    color: '#4da3ff',
    fontSize: 15,
    fontWeight: '600',
  },
  empty: {
    color: '#9a9aa0',
    textAlign: 'center',
    marginTop: 32,
  },
});
