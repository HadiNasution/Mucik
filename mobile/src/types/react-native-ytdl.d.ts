declare module 'react-native-ytdl' {
  export interface YtdlFormat {
    url?: string;
    container?: string;
    audioBitrate?: number;
    mimeType?: string;
  }

  export interface Thumbnail {
    url?: string;
  }

  export interface VideoAuthor {
    name?: string;
    id?: string;
  }

  export interface VideoDetails {
    videoId?: string;
    title: string;
    lengthSeconds: string | number;
    author?: VideoAuthor | string;
    thumbnails?: Thumbnail[];
  }

  export interface videoInfo {
    videoDetails: VideoDetails;
    formats: YtdlFormat[];
  }

  interface ChooseFormatOptions {
    quality?: 'lowest' | 'highest' | 'lowestaudio' | 'highestaudio';
  }

  interface Ytdl {
    getInfo(id: string): Promise<videoInfo>;
    chooseFormat(
      formats: YtdlFormat[],
      options: ChooseFormatOptions,
    ): YtdlFormat | undefined;
  }

  const ytdl: Ytdl;
  export default ytdl;
}
