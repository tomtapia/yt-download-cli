import { resolve } from "node:path";
import { CliError } from "../errors";
import {
  type DownloadCommandOptions,
  type DownloadContainer,
  type DownloadMode,
  type DownloadRequest,
  type QualityPreset
} from "./types";

const VALID_MODES: DownloadMode[] = ["video", "audio"];
const VALID_CONTAINERS: DownloadContainer[] = ["mp4", "webm", "m4a"];
const VALID_QUALITIES: QualityPreset[] = ["best", "1080p", "720p", "480p"];

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
    throw new CliError("Container 'mp4' is not valid for audio mode. Use 'm4a' or 'webm'.");
  }

  if (mode === "video" && container === "m4a") {
    throw new CliError("Container 'm4a' is only valid for audio mode.");
  }

  const quality = options.quality ?? "best";

  if (!VALID_QUALITIES.includes(quality)) {
    throw new CliError(`Unsupported quality preset '${String(quality)}'.`);
  }

  return {
    url,
    mode,
    container,
    quality,
    outputDir: resolve(cwd, options.outputDir ?? "."),
    overwrite: options.overwrite ?? false
  };
}

function getDefaultContainer(mode: DownloadMode): DownloadContainer {
  return mode === "audio" ? "m4a" : "mp4";
}
