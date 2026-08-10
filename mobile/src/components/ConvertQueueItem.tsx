import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { QueueJob } from '../types/queue';

interface Props {
  job: QueueJob;
  onRetry: () => void;
  onRemove: () => void;
}

const STATUS_LABEL: Record<QueueJob['status'], string> = {
  queued: 'Queued',
  converting: 'Converting',
  done: 'Done',
  failed: 'Failed',
};

export function ConvertQueueItem({ job, onRetry, onRemove }: Props) {
  const percent = Math.round(job.progress * 100);
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={1}>
          {job.title}
        </Text>
        <Text style={[styles.status, styles[`status_${job.status}`]]}>
          {STATUS_LABEL[job.status]}
        </Text>
      </View>
      {job.status === 'converting' && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
      )}
      {job.status === 'failed' && (
        <Text style={styles.error} numberOfLines={2}>
          {job.errorMessage}
        </Text>
      )}
      <View style={styles.actionRow}>
        {job.status === 'failed' && (
          <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <Text style={styles.removeText}>
            {job.status === 'done' ? 'Clear' : 'Remove'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1c1c20',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
  },
  status_queued: { color: '#c9a04d' },
  status_converting: { color: '#4da3ff' },
  status_done: { color: '#3ecf6e' },
  status_failed: { color: '#ff5b5b' },
  progressTrack: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#4da3ff',
  },
  error: {
    color: '#ff8a8a',
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    paddingVertical: 2,
  },
  retryText: {
    color: '#4da3ff',
    fontSize: 13,
    fontWeight: '600',
  },
  removeButton: {
    paddingVertical: 2,
  },
  removeText: {
    color: '#9a9aa0',
    fontSize: 13,
  },
});
