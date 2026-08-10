import { FFmpegKit, ReturnCode } from '@wokcito/ffmpeg-kit-react-native';

export async function convertToMp3(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  const command = `-i ${inputPath} -vn -codec:a libmp3lame -qscale:a 2 ${outputPath}`;
  const session = await FFmpegKit.execute(command);
  const returnCode = await session.getReturnCode();
  if (ReturnCode.isSuccess(returnCode)) {
    return;
  }
  if (ReturnCode.isCancel(returnCode)) {
    throw new Error('Conversion cancelled');
  }
  const output = (await session.getOutput()) ?? '';
  const tail = output.split('\n').filter(Boolean).slice(-5).join(' ');
  throw new Error(`Conversion failed: ${tail || 'unknown ffmpeg error'}`);
}
