export type DownloadMode = "video" | "audio";
export type DownloadContainer = "mp4" | "webm" | "m4a";
export type QualityPreset = "best" | "1080p" | "720p" | "480p";

export type DownloadCommandOptions = {
  mode?: DownloadMode;
  container?: DownloadContainer;
  quality?: QualityPreset;
  outputDir?: string;
  overwrite?: boolean;
};

export type DownloadRequest = {
  url: string;
  mode: DownloadMode;
  container: DownloadContainer;
  quality: QualityPreset;
  outputDir: string;
  overwrite: boolean;
};

export type VideoMetadata = {
  videoId: string;
  title: string;
  description?: string;
  author?: string;
  lengthSeconds?: number;
};

export type StreamFormat = {
  itag: number;
  url: string;
  mimeType: string;
  container: "mp4" | "webm";
  fileExtension: "mp4" | "webm" | "m4a";
  codecs: string[];
  bitrate?: number;
  contentLength?: number;
  width?: number;
  height?: number;
  fps?: number;
  audioBitrate?: number;
  audioChannels?: number;
  qualityLabel?: string;
  isProgressive: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
};

export type DownloadPlan =
  | {
      strategy: "single";
      container: DownloadContainer;
      extension: string;
      format: StreamFormat;
    }
  | {
      strategy: "mux";
      container: Extract<DownloadContainer, "mp4" | "webm">;
      extension: string;
      videoFormat: StreamFormat;
      audioFormat: StreamFormat;
    };

export type DownloadResult = {
  filePath: string;
  metadata: VideoMetadata;
  plan: DownloadPlan;
};

export type ExtractedVideoInfo = {
  metadata: VideoMetadata;
  formats: StreamFormat[];
  playerUrl?: string;
};
