import { formatDuration } from '../src/utils/format';

describe('formatDuration', () => {
  it('formats zero', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(213000)).toBe('3:33');
  });

  it('pads seconds below ten', () => {
    expect(formatDuration(61000)).toBe('1:01');
  });

  it('handles durations over an hour as total minutes', () => {
    expect(formatDuration(3661000)).toBe('61:01');
  });

  it('rounds sub-second values down', () => {
    expect(formatDuration(1500)).toBe('0:01');
  });
});
