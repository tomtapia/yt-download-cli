import { CliError } from "../errors";
import type { DownloadPlan, DownloadRequest, StreamFormat } from "./types";

export function selectDownloadPlan(formats: StreamFormat[], request: DownloadRequest): DownloadPlan {
  if (request.mode === "audio") {
    return selectAudioPlan(formats, request);
  }

  return selectVideoPlan(formats, request);
}

function selectAudioPlan(formats: StreamFormat[], request: DownloadRequest): DownloadPlan {
  const audioOnlyCandidates = formats
    .filter((format) => format.hasAudio && !format.hasVideo)
    .filter((format) => matchesAudioContainer(format, request.container))
    .sort(compareByAudioQuality);

  const selectedAudioOnly = audioOnlyCandidates[0];

  if (selectedAudioOnly) {
    return {
      strategy: "single",
      container: request.container,
      extension: request.container,
      format: selectedAudioOnly
    };
  }

  const progressiveCandidates = formats
    .filter((format) => format.hasAudio && format.hasVideo)
    .filter((format) => matchesAudioContainer(format, request.container))
    .sort(compareByAudioQuality);

  const selectedProgressive = progressiveCandidates[0];

  if (selectedProgressive) {
    return {
      strategy: "single",
      container: request.container,
      extension: request.container,
      format: selectedProgressive
    };
  }

  throw new CliError(`No downloadable audio format is available for container '${request.container}'.`);
}

function selectVideoPlan(formats: StreamFormat[], request: DownloadRequest): DownloadPlan {
  const progressive = selectBestProgressive(formats, request);
  const adaptive = selectAdaptiveMux(formats, request);

  if (adaptive && (!progressive || compareVideoPreference(adaptive.videoFormat, progressive.format) >= 0)) {
    return adaptive;
  }

  if (progressive) {
    return progressive;
  }

  throw new CliError(
    `No compatible ${request.container} video format is available for quality preset '${request.quality}'.`
  );
}

function selectBestProgressive(
  formats: StreamFormat[],
  request: DownloadRequest
): Extract<DownloadPlan, { strategy: "single" }> | null {
  const candidates = formats
    .filter((format) => format.hasVideo && format.hasAudio && format.container === request.container)
    .filter((format) => matchesVideoQuality(format, request.quality))
    .sort(compareByVideoQuality);

  const selected = candidates[0];

  if (!selected) {
    return null;
  }

  return {
    strategy: "single",
    container: request.container,
    extension: request.container,
    format: selected
  };
}

function selectAdaptiveMux(
  formats: StreamFormat[],
  request: DownloadRequest
): Extract<DownloadPlan, { strategy: "mux" }> | null {
  const videoCandidates = formats
    .filter((format) => format.hasVideo && !format.hasAudio && format.container === request.container)
    .filter((format) => matchesVideoQuality(format, request.quality))
    .sort(compareByVideoQuality);
  const audioCandidates = formats
    .filter((format) => format.hasAudio && !format.hasVideo && matchesAudioContainer(format, request.container))
    .sort(compareByAudioQuality);

  const selectedVideo = videoCandidates[0];
  const selectedAudio = audioCandidates[0];

  if (!selectedVideo || !selectedAudio) {
    return null;
  }

  return {
    strategy: "mux",
    container: request.container === "webm" ? "webm" : "mp4",
    extension: request.container,
    videoFormat: selectedVideo,
    audioFormat: selectedAudio
  };
}

function matchesAudioContainer(format: StreamFormat, container: DownloadRequest["container"]): boolean {
  if (container === "m4a") {
    return format.container === "mp4";
  }

  return format.container === container;
}

function matchesVideoQuality(format: StreamFormat, quality: DownloadRequest["quality"]): boolean {
  if (quality === "best") {
    return true;
  }

  const targetHeight = Number(quality.replace("p", ""));
  return (format.height ?? 0) <= targetHeight;
}

function compareByAudioQuality(left: StreamFormat, right: StreamFormat): number {
  return (right.audioBitrate ?? right.bitrate ?? 0) - (left.audioBitrate ?? left.bitrate ?? 0);
}

function compareByVideoQuality(left: StreamFormat, right: StreamFormat): number {
  return compareVideoPreference(left, right) * -1;
}

function compareVideoPreference(left: StreamFormat, right: StreamFormat): number {
  const leftHeight = left.height ?? 0;
  const rightHeight = right.height ?? 0;

  if (leftHeight !== rightHeight) {
    return leftHeight - rightHeight;
  }

  return (left.bitrate ?? 0) - (right.bitrate ?? 0);
}
