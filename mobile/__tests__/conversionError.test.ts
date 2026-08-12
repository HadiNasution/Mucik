import { ConversionError, toConversionError } from '../src/services/conversion/conversionError';

describe('toConversionError', () => {
  it('passes through an existing ConversionError unchanged', () => {
    const error = new ConversionError('INSUFFICIENT_STORAGE', 'not enough space');
    expect(toConversionError(error)).toBe(error);
  });

  it('maps unavailable/private/region errors to VIDEO_UNAVAILABLE', () => {
    const messages = [
      'This video is unavailable',
      'private video',
      'not available in your region',
      'age-restricted video',
      'Video unavailable. Sign in to confirm your age',
    ];
    for (const message of messages) {
      expect(toConversionError(new Error(message))).toMatchObject({
        code: 'VIDEO_UNAVAILABLE',
      });
    }
  });

  it('maps network errors to NETWORK_ERROR', () => {
    const messages = [
      'ECONNRESET',
      'network error',
      'request timed out',
      'Failed to fetch',
      'Download failed with status 404',
    ];
    for (const message of messages) {
      expect(toConversionError(new Error(message))).toMatchObject({
        code: 'NETWORK_ERROR',
      });
    }
  });

  it('maps unknown errors to CONVERSION_FAILED', () => {
    expect(toConversionError(new Error('some unexpected thing'))).toMatchObject({
      code: 'CONVERSION_FAILED',
    });
    expect(toConversionError('a string error')).toMatchObject({
      code: 'CONVERSION_FAILED',
    });
  });

  it('truncates long messages to 200 chars', () => {
    const long = 'x'.repeat(500);
    const error = toConversionError(new Error(long));
    expect(error.message.length).toBe(200);
  });
});
