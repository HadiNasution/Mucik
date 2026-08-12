import type { QueueErrorCode } from '../../types/queue';

export class ConversionError extends Error {
  readonly code: QueueErrorCode;

  constructor(code: QueueErrorCode, message: string) {
    super(message);
    this.name = 'ConversionError';
    this.code = code;
  }
}

export function toConversionError(error: unknown): ConversionError {
  if (error instanceof ConversionError) {
    return error;
  }
  const message = error instanceof Error ? error.message : String(error);
  if (
    /unavailable|private|removed|age.?restricted|region|sign in|members-only/i.test(
      message,
    )
  ) {
    return new ConversionError('VIDEO_UNAVAILABLE', 'Video is unavailable');
  }
  if (
    /network|sock|timeout|timed out|ECONN|ETIMEDOUT|fetch|download failed|status 4/i.test(
      message,
    )
  ) {
    return new ConversionError('NETWORK_ERROR', 'Network error');
  }
  return new ConversionError('CONVERSION_FAILED', message.slice(0, 200));
}
