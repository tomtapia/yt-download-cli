import { CliError } from "../errors";

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);
const SHORT_HOSTS = new Set(["youtu.be", "www.youtu.be"]);
const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export type ParsedYouTubeUrl = {
  videoId: string;
  watchUrl: string;
};

export function parseYouTubeUrl(input: string): ParsedYouTubeUrl {
  let url: URL;

  try {
    url = new URL(input);
  } catch {
    throw new CliError("The provided value is not a valid URL.");
  }

  const host = url.hostname.toLowerCase();
  let videoId: string;

  if (YOUTUBE_HOSTS.has(host) && url.pathname === "/watch") {
    videoId = url.searchParams.get("v") ?? "";
  } else if (SHORT_HOSTS.has(host)) {
    videoId = url.pathname.split("/").filter(Boolean)[0] ?? "";
  } else {
    throw new CliError("Only youtube.com/watch and youtu.be URLs are supported in v1.");
  }

  if (!VIDEO_ID_PATTERN.test(videoId)) {
    throw new CliError("The URL does not contain a valid YouTube video ID.");
  }

  return {
    videoId,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`
  };
}
