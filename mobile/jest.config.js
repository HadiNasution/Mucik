module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!(?:.pnpm/)?((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-track-player|react-native-ytdl|react-native-fs|@op-engineering/op-sqlite|@wokcito/ffmpeg-kit-react-native|zustand|ytpl)/)',
  ],
};
