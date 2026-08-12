import { groupByAlbum, groupByArtist } from '../src/store/libraryStore';
import type { Song } from '../src/types/song';

jest.mock('../src/db/repositories/songRepository', () => ({
  songRepository: {
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

function makeSong(overrides: Partial<Song>): Song {
  return {
    id: 1,
    youtubeId: 'video1',
    title: 'Song',
    artist: 'Artist',
    album: 'Album',
    artworkPath: null,
    filePath: '/songs/1.mp3',
    durationMs: 1000,
    sourceUrl: '',
    createdAt: 0,
    ...overrides,
  };
}

describe('groupByArtist', () => {
  it('groups songs by artist', () => {
    const songs = [
      makeSong({ id: 1, artist: 'Zed' }),
      makeSong({ id: 2, artist: 'Alpha' }),
      makeSong({ id: 3, artist: 'Zed' }),
    ];
    const groups = groupByArtist(songs);
    expect(groups.map(g => g.key)).toEqual(['Alpha', 'Zed']);
    expect(groups.find(g => g.key === 'Zed')?.songs).toHaveLength(2);
  });

  it('groups empty-artist songs under Unknown Artist', () => {
    const groups = groupByArtist([makeSong({ id: 1, artist: '' })]);
    expect(groups).toEqual([{ key: 'Unknown Artist', songs: [expect.any(Object)] }]);
  });

  it('returns an empty array for no songs', () => {
    expect(groupByArtist([])).toEqual([]);
  });

  it('sorts groups case-insensitively', () => {
    const songs = [
      makeSong({ id: 1, artist: 'bob' }),
      makeSong({ id: 2, artist: 'Alice' }),
    ];
    const groups = groupByArtist(songs);
    expect(groups.map(g => g.key)).toEqual(['Alice', 'bob']);
  });
});

describe('groupByAlbum', () => {
  it('groups songs by album', () => {
    const songs = [
      makeSong({ id: 1, album: 'Album B' }),
      makeSong({ id: 2, album: 'Album A' }),
      makeSong({ id: 3, album: 'Album B' }),
    ];
    const groups = groupByAlbum(songs);
    expect(groups.map(g => g.key)).toEqual(['Album A', 'Album B']);
    expect(groups.find(g => g.key === 'Album B')?.songs).toHaveLength(2);
  });

  it('groups empty-album songs under Unknown Album', () => {
    const groups = groupByAlbum([makeSong({ id: 1, album: '' })]);
    expect(groups).toEqual([{ key: 'Unknown Album', songs: [expect.any(Object)] }]);
  });

  it('returns an empty array for no songs', () => {
    expect(groupByAlbum([])).toEqual([]);
  });
});
