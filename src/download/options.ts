import { resolve } from "node:path";
import { CliError } from "../errors";
import {
  type AudioBitrate,
  type DownloadCommandOptions,
  type DownloadContainer,
  type DownloadMode,
  type DownloadRequest,
  type QualityPreset
} from "./types";

const VALID_MODES: DownloadMode[] = ["video", "audio"];
const VALID_CONTAINERS: DownloadContainer[] = ["mp4", "webm", "m4a", "mp3"];
const VALID_QUALITIES: QualityPreset[] = ["best", "1080p", "720p", "480p"];
const VALID_AUDIO_BITRATES: AudioBitrate[] = ["128k", "192k", "256k", "320k"];

export function normalizeDownloadOptions(
  url: string,
  options: DownloadCommandOptions,
  cwd: string
): DownloadRequest {
  const mode = options.mode ?? "video";

  if (!VALID_MODES.includes(mode)) {
    throw new CliError(`Unsupported mode '${String(mode)}'.`);
  }

  const container = options.container ?? getDefaultContainer(mode);

  if (!VALID_CONTAINERS.includes(container)) {
    throw new CliError(`Unsupported container '${String(container)}'.`);
  }

  if (mode === "audio" && container === "mp4") {
    throw new CliError("Container 'mp4' is not valid for audio mode. Use 'm4a', 'webm', or 'mp3'.");
  }

  if (mode === "video" && (container === "m4a" || container === "mp3")) {
    throw new CliError(`Container '${container}' is only valid for audio mode.`);
  }

  const quality = options.quality ?? "best";

  if (!VALID_QUALITIES.includes(quality)) {
    throw new CliError(`Unsupported quality preset '${String(quality)}'.`);
  }

  const audioBitrate = options.audioBitrate ?? (container === "mp3" ? "192k" : undefined);

  if (audioBitrate && !VALID_AUDIO_BITRATES.includes(audioBitrate)) {
    throw new CliError(`Unsupported audio bitrate '${String(audioBitrate)}'.`);
  }

  if (audioBitrate && container !== "mp3") {
    throw new CliError("Option '--audio-bitrate' is only valid when '--container mp3' is selected.");
  }

  return {
    url,
    mode,
    container,
    quality,
    audioBitrate,
    outputDir: resolve(cwd, options.outputDir ?? "."),
    overwrite: options.overwrite ?? false
  };
}

function getDefaultContainer(mode: DownloadMode): DownloadContainer {
  return mode === "audio" ? "m4a" : "mp4";
}
