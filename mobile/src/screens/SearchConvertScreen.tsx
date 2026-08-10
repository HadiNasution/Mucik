import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueueStore } from '../store/queueStore';
import { ConvertQueueItem } from '../components/ConvertQueueItem';

export function SearchConvertScreen() {
  const insets = useSafeAreaInsets();
  const [url, setUrl] = useState('');
  const [resolving, setResolving] = useState(false);
  const jobs = useQueueStore(s => s.jobs);
  const resolveUrl = useQueueStore(s => s.resolveUrl);
  const enqueue = useQueueStore(s => s.enqueue);
  const retry = useQueueStore(s => s.retry);
  const remove = useQueueStore(s => s.remove);
  const clearDone = useQueueStore(s => s.clearDone);

  const handleConvert = async () => {
    if (!url.trim() || resolving) {
      return;
    }
    setResolving(true);
    const outcome = await resolveUrl(url);
    setResolving(false);
    if (!outcome.ok) {
      Alert.alert('Cannot convert', outcome.error);
      return;
    }
    const { result } = outcome;
    if (result.type === 'playlist') {
      Alert.alert(
        'Playlist detected',
        `Add ${result.entries.length} songs to the conversion queue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add all',
            onPress: () => {
              enqueue(result.entries);
              setUrl('');
            },
          },
        ],
      );
    } else {
      enqueue(result.entries);
      setUrl('');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.header}>Convert</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="Paste YouTube link..."
          placeholderTextColor="#666"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <TouchableOpacity
          style={[styles.convertButton, resolving && styles.convertButtonDisabled]}
          onPress={() => void handleConvert()}
          disabled={resolving}>
          <Text style={styles.convertText}>
            {resolving ? '...' : 'Convert'}
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={jobs}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.empty}>No conversions queued.</Text>
        }
        ListHeaderComponent={
          jobs.length > 0 ? (
            <View style={styles.queueHeader}>
              <Text style={styles.queueTitle}>Queue</Text>
              <TouchableOpacity onPress={clearDone}>
                <Text style={styles.clearText}>Clear done</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <ConvertQueueItem
            job={item}
            onRetry={() => retry(item.id)}
            onRemove={() => remove(item.id)}
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
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#1c1c20',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 15,
  },
  convertButton: {
    backgroundColor: '#4da3ff',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  convertButtonDisabled: {
    opacity: 0.6,
  },
  convertText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 24,
  },
  empty: {
    color: '#9a9aa0',
    textAlign: 'center',
    marginTop: 32,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  queueTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearText: {
    color: '#9a9aa0',
    fontSize: 13,
  },
});
