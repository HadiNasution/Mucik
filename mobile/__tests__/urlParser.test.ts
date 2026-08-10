import { parseYoutubeUrl } from '../src/services/youtube/urlParser';

describe('parseYoutubeUrl', () => {
  it('parses a standard watch URL', () => {
    expect(
      parseYoutubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    ).toEqual({ type: 'video', videoId: 'dQw4w9WgXcQ' });
  });

  it('parses a youtu.be short URL', () => {
    expect(parseYoutubeUrl('https://youtu.be/dQw4w9WgXcQ')).toEqual({
      type: 'video',
      videoId: 'dQw4w9WgXcQ',
    });
  });

  it('parses a shorts URL', () => {
    expect(parseYoutubeUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toEqual({
      type: 'video',
      videoId: 'dQw4w9WgXcQ',
    });
  });

  it('parses a playlist URL', () => {
    expect(
      parseYoutubeUrl('https://www.youtube.com/playlist?list=PL1234567890abcdef'),
    ).toEqual({ type: 'playlist', playlistId: 'PL1234567890abcdef' });
  });

  it('prefers the video id when both video and list are present', () => {
    expect(
      parseYoutubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL123'),
    ).toEqual({ type: 'video', videoId: 'dQw4w9WgXcQ' });
  });

  it('trims surrounding whitespace', () => {
    expect(
      parseYoutubeUrl('  https://youtu.be/dQw4w9WgXcQ  '),
    ).toEqual({ type: 'video', videoId: 'dQw4w9WgXcQ' });
  });

  it('returns invalid for empty input', () => {
    expect(parseYoutubeUrl('')).toEqual({ type: 'invalid' });
    expect(parseYoutubeUrl('   ')).toEqual({ type: 'invalid' });
  });

  it('returns invalid for garbage input', () => {
    expect(parseYoutubeUrl('not a youtube url')).toEqual({ type: 'invalid' });
    expect(parseYoutubeUrl('https://example.com/watch?v=xxxx')).toEqual({
      type: 'invalid',
    });
  });
});
