import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TrackPlayer, { Event, State } from 'react-native-track-player';
import { RootNavigator } from './src/navigation/RootNavigator';
import { setupPlayer } from './src/services/playback/playbackService';
import { usePlayerStore } from './src/store/playerStore';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#121216',
    card: '#1c1c20',
    text: '#ffffff',
    border: '#26262b',
    primary: '#4da3ff',
  },
};

function App() {
  useEffect(() => {
    void (async () => {
      try {
        await setupPlayer();
      } catch {
        // playback unavailable (e.g. missing service on emulator); UI still works
      }
    })();

    const activeTrackSub = TrackPlayer.addEventListener(
      Event.PlaybackActiveTrackChanged,
      event => {
        const songId = event.track?.id
          ? Number(event.track.id)
          : null;
        usePlayerStore.setState({ currentSongId: songId });
      },
    );
    const stateSub = TrackPlayer.addEventListener(
      Event.PlaybackState,
      event => {
        usePlayerStore.setState({ isPlaying: event.state === State.Playing });
      },
    );
    return () => {
      activeTrackSub.remove();
      stateSub.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <NavigationContainer theme={theme}>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
