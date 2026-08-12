import { useQueueStore } from '../src/store/queueStore';
import { listPlaylist } from '../src/services/youtube/youtubeClient';

jest.mock('../src/services/youtube/youtubeClient', () => ({
  listPlaylist: jest.fn(),
}));

jest.mock('../src/services/conversion/conversionService', () => ({
  runConversionJob: jest.fn(),
}));

const mockListPlaylist = listPlaylist as jest.MockedFunction<typeof listPlaylist>;

beforeEach(() => {
  jest.clearAllMocks();
  useQueueStore.setState({
    jobs: useQueueStore.getState().jobs,
  });
});

describe('useQueueStore.resolveUrl', () => {
  it('rejects invalid input', async () => {
    const result = await useQueueStore.getState().resolveUrl('not a url');
    expect(result).toEqual({ ok: false, error: 'Invalid YouTube URL' });
  });

  it('resolves a single video into one entry', async () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const result = await useQueueStore.getState().resolveUrl(url);
    expect(result).toEqual({
      ok: true,
      result: {
        type: 'video',
        entries: [
          { videoId: 'dQw4w9WgXcQ', title: 'Converting video...', sourceUrl: url },
        ],
      },
    });
  });

  it('resolves a playlist by listing its items', async () => {
    mockListPlaylist.mockResolvedValue([
      { videoId: 'aaa', title: 'A' },
      { videoId: 'bbb', title: 'B' },
    ]);
    const url = 'https://www.youtube.com/playlist?list=PL123456';
    const result = await useQueueStore.getState().resolveUrl(url);
    expect(mockListPlaylist).toHaveBeenCalledWith('PL123456');
    expect(result).toEqual({
      ok: true,
      result: {
        type: 'playlist',
        entries: [
          { videoId: 'aaa', title: 'A', sourceUrl: 'https://youtu.be/aaa' },
          { videoId: 'bbb', title: 'B', sourceUrl: 'https://youtu.be/bbb' },
        ],
      },
    });
  });

  it('fails when the playlist is empty', async () => {
    mockListPlaylist.mockResolvedValue([]);
    const result = await useQueueStore
      .getState()
      .resolveUrl('https://www.youtube.com/playlist?list=PL123456');
    expect(result).toEqual({ ok: false, error: 'Playlist is empty or private' });
  });

  it('surfaces playlist errors as a user-facing message', async () => {
    mockListPlaylist.mockRejectedValue(new Error('private playlist'));
    const result = await useQueueStore
      .getState()
      .resolveUrl('https://www.youtube.com/playlist?list=PL123456');
    expect(result).toEqual({ ok: false, error: 'private playlist' });
  });
});
