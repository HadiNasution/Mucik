import React from 'react';
import {
  createBottomTabNavigator,
  BottomTabBar,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LibraryScreen } from '../screens/LibraryScreen';
import { PlaylistsScreen } from '../screens/PlaylistsScreen';
import { SearchConvertScreen } from '../screens/SearchConvertScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { PlayerBar } from '../components/PlayerBar';
import type { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const SCREEN_OPTIONS = {
  headerShown: false,
  tabBarStyle: { backgroundColor: '#1c1c20', borderTopColor: '#26262b' },
  tabBarActiveTintColor: '#4da3ff',
  tabBarInactiveTintColor: '#9a9aa0',
};

function PlayerTabBar(props: BottomTabBarProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <>
      <PlayerBar onOpen={() => navigation.navigate('Player')} />
      <BottomTabBar {...props} />
    </>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={SCREEN_OPTIONS} tabBar={PlayerTabBar}>
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Playlists" component={PlaylistsScreen} />
      <Tab.Screen name="Convert" component={SearchConvertScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
