import { Innertube } from "youtubei.js";
import { CliError } from "../errors";
import { selectDownloadPlan } from "../download/select-formats";
import type { DownloadPlan, DownloadRequest, StreamFormat, VideoMetadata } from "../download/types";
import { ensureYouTubeJsEvaluator } from "./evaluator";
import { parseYouTubeUrl } from "./url";

type YouTubeFormatLike = {
  itag: number;
  url?: string;
  signature_cipher?: string;
  cipher?: string;
  width?: number;
  height?: number;
  content_length?: number;
  quality_label?: string;
  average_bitrate?: number;
  bitrate: number;
  audio_channels?: number;
  fps?: number;
  mime_type: string;
  has_audio: boolean;
  has_video: boolean;
  decipher(player?: unknown): Promise<string>;
};

type YouTubeInfoLike = {
  basic_info: {
    id?: string;
    title?: string;
    short_description?: string;
    author?: string;
    duration?: number;
    is_private?: boolean;
    is_live?: boolean;
    is_live_content?: boolean;
  };
  streaming_data?: {
    formats?: YouTubeFormatLike[];
    adaptive_formats?: YouTubeFormatLike[];
  };
  actions?: {
    session?: {
      player?: unknown;
    };
  };
};

type YouTubeClientLike = {
  getBasicInfo(target: string, options?: { client?: "WEB" | "ANDROID" }): Promise<YouTubeInfoLike>;
};

export type ResolveDownloadPlanDependencies = {
  innertubeFactory?: () => Promise<YouTubeClientLike>;
  createInnertubeImpl?: typeof Innertube.create;
};

export type ResolvedYouTubeDownload = {
  metadata: VideoMetadata;
  plan: DownloadPlan;
};

let sharedInnertube: Promise<YouTubeClientLike> | undefined;

export async function resolveDownloadPlan(
  inputUrl: string,
  request: DownloadRequest,
  dependencies: ResolveDownloadPlanDependencies = {}
): Promise<ResolvedYouTubeDownload> {
  const parsedUrl = parseYouTubeUrl(inputUrl);
  const client = await getInnertubeClient(dependencies);
  const info = await getVideoInfo(client, parsedUrl.videoId);
  const metadata = getMetadata(info.basic_info, parsedUrl.videoId);

  if (info.basic_info.is_private) {
    throw new CliError("This video is private and cannot be downloaded in v1.");
  }

  if (info.basic_info.is_live || info.basic_info.is_live_content) {
    throw new CliError("Live streams are not supported in v1.");
  }

  const formats = await extractFormats(info);

  if (formats.length === 0) {
    throw new CliError("No supported downloadable formats were returned by the YouTube extraction backend.");
  }

  return {
    metadata,
    plan: selectDownloadPlan(formats, request)
  };
}

async function getInnertubeClient(
  dependencies: ResolveDownloadPlanDependencies
): Promise<YouTubeClientLike> {
  if (dependencies.innertubeFactory) {
    return dependencies.innertubeFactory();
  }

  ensureYouTubeJsEvaluator();
  const createInnertube = dependencies.createInnertubeImpl ?? Innertube.create;

  if (!sharedInnertube) {
    sharedInnertube = createInnertube({
      lang: "en",
      retrieve_player: true,
      generate_session_locally: true
    }).catch((error) => {
      sharedInnertube = undefined;
      throw error;
    });
  }

  return sharedInnertube;
}

async function getVideoInfo(client: YouTubeClientLike, videoId: string): Promise<YouTubeInfoLike> {
  try {
    return await client.getBasicInfo(videoId, { client: "WEB" });
  } catch (error) {
    throw normalizeBackendError(error, "Unable to retrieve video information from YouTube.");
  }
}

async function extractFormats(info: YouTubeInfoLike): Promise<StreamFormat[]> {
  const formats = [...(info.streaming_data?.formats ?? []), ...(info.streaming_data?.adaptive_formats ?? [])];
  const player = info.actions?.session?.player;
  const resolvedFormats = await Promise.all(
    formats.map(async (format) => {
      try {
        return await mapFormat(format, player);
      } catch (error) {
        if (shouldSkipFormatError(error)) {
          return null;
        }

        throw error;
      }
    })
  );

  return resolvedFormats.filter((format): format is StreamFormat => Boolean(format));
}

function getMetadata(details: YouTubeInfoLike["basic_info"], fallbackVideoId: string): VideoMetadata {
  return {
    videoId: details.id ?? fallbackVideoId,
    title: details.title ?? fallbackVideoId,
    description: details.short_description,
    author: details.author,
    lengthSeconds: details.duration
  };
}

async function mapFormat(format: YouTubeFormatLike, player?: unknown): Promise<StreamFormat> {
  const mime = parseMimeType(format.mime_type);
  const url = await resolveDownloadUrl(format, player);
  const bitrate = format.average_bitrate ?? format.bitrate;

  return {
    itag: format.itag,
    url: addRateBypass(url),
    mimeType: format.mime_type,
    container: mime.container,
    fileExtension: !format.has_video && format.has_audio && mime.container === "mp4" ? "m4a" : mime.container,
    codecs: mime.codecs,
    bitrate,
    contentLength: format.content_length,
    width: format.width,
    height: format.height,
    fps: format.fps,
    audioBitrate: format.has_audio ? bitrate : undefined,
    audioChannels: format.audio_channels,
    qualityLabel: format.quality_label,
    isProgressive: format.has_video && format.has_audio,
    hasVideo: format.has_video,
    hasAudio: format.has_audio
  };
}

function parseMimeType(mimeType: string): {
  container: "mp4" | "webm";
  codecs: string[];
} {
  const match = mimeType.match(/^(audio|video)\/([a-z0-9]+);\s*codecs="([^"]+)"/i);

  if (!match) {
    throw new CliError(`Unsupported YouTube mime type '${mimeType}'.`);
  }

  const rawContainer = match[2].toLowerCase();

  if (rawContainer !== "mp4" && rawContainer !== "webm") {
    throw new CliError(`Unsupported YouTube container '${rawContainer}'.`);
  }

  return {
    container: rawContainer,
    codecs: match[3].split(",").map((codec) => codec.trim())
  };
}

async function resolveDownloadUrl(format: YouTubeFormatLike, player?: unknown): Promise<string> {
  if (format.url) {
    return format.url;
  }

  if (!format.signature_cipher && !format.cipher) {
    throw new CliError("The selected stream format does not expose a downloadable URL.");
  }

  try {
    const url = await format.decipher(player);

    if (!url) {
      throw new CliError("The selected stream format does not expose a downloadable URL.");
    }

    return url;
  } catch (error) {
    throw normalizeBackendError(error, "YouTube.js could not decipher a downloadable stream URL.");
  }
}

function shouldSkipFormatError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return [
    "Unsupported YouTube mime type",
    "Unsupported YouTube container",
    "The selected stream format does not expose a downloadable URL.",
    "No valid URL to decipher"
  ].some((message) => error.message.includes(message));
}

function normalizeBackendError(error: unknown, fallbackMessage: string): CliError {
  if (error instanceof CliError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("private")) {
      return new CliError("This video is private and cannot be downloaded in v1.");
    }

    if (message.includes("live")) {
      return new CliError("Live streams are not supported in v1.");
    }

    if (message.includes("unavailable") || message.includes("playability")) {
      return new CliError(`This video is not available for download: ${error.message}`);
    }

    return new CliError(error.message || fallbackMessage);
  }

  return new CliError(fallbackMessage);
}

function addRateBypass(url: string): string {
  const parsedUrl = new URL(url);

  if (!parsedUrl.searchParams.has("ratebypass")) {
    parsedUrl.searchParams.set("ratebypass", "yes");
  }

  return parsedUrl.toString();
}
