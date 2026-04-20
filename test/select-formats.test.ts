import { describe, expect, it } from "vitest";
import { selectDownloadPlan } from "../src/download/select-formats";
import type { DownloadRequest, StreamFormat } from "../src/download/types";

const baseRequest: DownloadRequest = {
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  mode: "video",
  container: "mp4",
  quality: "best",
  outputDir: "/tmp",
  overwrite: false
};

const formats: StreamFormat[] = [
  {
    itag: 18,
    url: "https://example.com/progressive.mp4",
    mimeType: 'video/mp4; codecs="avc1.42001E, mp4a.40.2"',
    container: "mp4",
    fileExtension: "mp4",
    codecs: ["avc1.42001E", "mp4a.40.2"],
    bitrate: 800000,
    height: 360,
    width: 640,
    isProgressive: true,
    hasVideo: true,
    hasAudio: true
  },
  {
    itag: 137,
    url: "https://example.com/video.mp4",
    mimeType: 'video/mp4; codecs="avc1.640028"',
    container: "mp4",
    fileExtension: "mp4",
    codecs: ["avc1.640028"],
    bitrate: 3500000,
    height: 1080,
    width: 1920,
    isProgressive: false,
    hasVideo: true,
    hasAudio: false
  },
  {
    itag: 140,
    url: "https://example.com/audio.m4a",
    mimeType: 'audio/mp4; codecs="mp4a.40.2"',
    container: "mp4",
    fileExtension: "m4a",
    codecs: ["mp4a.40.2"],
    bitrate: 128000,
    audioBitrate: 128000,
    isProgressive: false,
    hasVideo: false,
    hasAudio: true
  }
];

describe("selectDownloadPlan", () => {
  it("prefers adaptive muxing when it provides better video quality", () => {
    const plan = selectDownloadPlan(formats, baseRequest);

    expect(plan.strategy).toBe("mux");
    expect(plan.videoFormat.itag).toBe(137);
    expect(plan.audioFormat.itag).toBe(140);
  });

  it("selects an audio-only plan for audio mode", () => {
    const plan = selectDownloadPlan(formats, {
      ...baseRequest,
      mode: "audio",
      container: "m4a"
    });

    expect(plan.strategy).toBe("single");
    expect(plan.format.itag).toBe(140);
  });

  it("falls back to a progressive stream for audio mode when no audio-only stream exists", () => {
    const plan = selectDownloadPlan([formats[0]], {
      ...baseRequest,
      mode: "audio",
      container: "m4a"
    });

    expect(plan.strategy).toBe("single");
    expect(plan.format.itag).toBe(18);
  });

  it("falls back to a progressive webm stream for audio mode when no audio-only stream exists", () => {
    const plan = selectDownloadPlan(
      [
        {
          itag: 43,
          url: "https://example.com/progressive.webm",
          mimeType: 'video/webm; codecs="vp8, vorbis"',
          container: "webm",
          fileExtension: "webm",
          codecs: ["vp8", "vorbis"],
          bitrate: 900000,
          isProgressive: true,
          hasVideo: true,
          hasAudio: true
        }
      ],
      {
        ...baseRequest,
        mode: "audio",
        container: "webm"
      }
    );

    expect(plan.strategy).toBe("single");
    expect(plan.format.itag).toBe(43);
  });

  it("fails when audio mode has no compatible stream with audio", () => {
    expect(() =>
      selectDownloadPlan(
        [formats[1]],
        {
          ...baseRequest,
          mode: "audio",
          container: "m4a"
        }
      )
    ).toThrow("No downloadable audio format is available for container 'm4a'.");
  });

  it("prefers the highest bitrate audio source for mp3 output", () => {
    const plan = selectDownloadPlan(
      [
        {
          itag: 251,
          url: "https://example.com/audio.webm",
          mimeType: 'audio/webm; codecs="opus"',
          container: "webm",
          fileExtension: "webm",
          codecs: ["opus"],
          bitrate: 160000,
          audioBitrate: 160000,
          isProgressive: false,
          hasVideo: false,
          hasAudio: true
        },
        formats[2]
      ],
      {
        ...baseRequest,
        mode: "audio",
        container: "mp3"
      }
    );

    expect(plan.strategy).toBe("single");
    expect(plan.format.itag).toBe(251);
    expect(plan.extension).toBe("mp3");
  });

  it("uses mp4 as a tiebreaker for mp3 output when audio bitrate is equivalent", () => {
    const plan = selectDownloadPlan(
      [
        {
          itag: 251,
          url: "https://example.com/audio.webm",
          mimeType: 'audio/webm; codecs="opus"',
          container: "webm",
          fileExtension: "webm",
          codecs: ["opus"],
          bitrate: 128000,
          audioBitrate: 128000,
          isProgressive: false,
          hasVideo: false,
          hasAudio: true
        },
        formats[2]
      ],
      {
        ...baseRequest,
        mode: "audio",
        container: "mp3"
      }
    );

    expect(plan.strategy).toBe("single");
    expect(plan.format.itag).toBe(140);
    expect(plan.extension).toBe("mp3");
  });

  it("respects the requested quality ceiling", () => {
    const plan = selectDownloadPlan(formats, {
      ...baseRequest,
      quality: "480p"
    });

    expect(plan.strategy).toBe("single");
    expect(plan.format.itag).toBe(18);
  });
});
