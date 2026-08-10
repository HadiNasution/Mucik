import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  type Track,
} from 'react-native-track-player';
import type { Song } from '../../types/song';

export async function setupPlayer(): Promise<void> {
  await TrackPlayer.setupPlayer();
  await TrackPlayer.updateOptions({
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.SeekTo,
      Capability.Stop,
    ],
    compactCapabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
    ],
    android: {
      appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
    },
  });
}

export function songToTrack(song: Song): Track {
  return {
    id: String(song.id),
    url: `file://${song.filePath}`,
    title: song.title,
    artist: song.artist,
    album: song.album,
    duration: song.durationMs / 1000,
    artwork: song.artworkPath ? `file://${song.artworkPath}` : undefined,
  };
}

export async function playQueue(tracks: Track[], index: number): Promise<void> {
  await TrackPlayer.reset();
  await TrackPlayer.add(tracks);
  await TrackPlayer.skip(index);
  await TrackPlayer.play();
}

export async function rebuildQueue(
  tracks: Track[],
  startIndex: number,
): Promise<void> {
  await TrackPlayer.reset();
  await TrackPlayer.add(tracks);
  await TrackPlayer.skip(startIndex);
}
