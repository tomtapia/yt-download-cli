import { describe, expect, it, vi } from "vitest";
import { resolveDownloadPlan } from "../src/youtube/extractor";
import type { DownloadRequest } from "../src/download/types";

type FakeFormat = {
  itag: number;
  url?: string;
  signature_cipher?: string;
  cipher?: string;
  mime_type: string;
  has_audio: boolean;
  has_video: boolean;
  bitrate: number;
  average_bitrate?: number;
  quality_label?: string;
  width?: number;
  height?: number;
  decipher: () => Promise<string>;
};

const baseRequest: DownloadRequest = {
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  mode: "video",
  container: "mp4",
  quality: "best",
  outputDir: "/tmp",
  overwrite: false
};

describe("resolveDownloadPlan", () => {
  it("prefers adaptive mux for video downloads when separate streams are available", async () => {
    const result = await resolveDownloadPlan(baseRequest.url, baseRequest, {
      innertubeFactory: async () =>
        createFakeClient([
          createProgressiveFormat(),
          createVideoOnlyFormat(),
          createAudioOnlyFormat()
        ])
    });

    expect(result.plan.strategy).toBe("mux");
    expect(result.plan.videoFormat.url).toContain("video.mp4");
    expect(result.plan.audioFormat.fileExtension).toBe("m4a");
  });

  it("falls back to progressive streams for audio mode when no audio-only stream exists", async () => {
    const result = await resolveDownloadPlan(
      baseRequest.url,
      {
        ...baseRequest,
        mode: "audio",
        container: "m4a"
      },
      {
        innertubeFactory: async () => createFakeClient([createProgressiveFormat()])
      }
    );

    expect(result.plan.strategy).toBe("single");
    expect(result.plan.format.hasAudio).toBe(true);
    expect(result.plan.format.fileExtension).toBe("mp4");
  });

  it("ignores formats that cannot be deciphered into a valid URL", async () => {
    const result = await resolveDownloadPlan(baseRequest.url, baseRequest, {
      innertubeFactory: async () =>
        createFakeClient([
          createBrokenFormat(),
          createVideoOnlyFormat(),
          createAudioOnlyFormat()
        ])
    });

    expect(result.plan.strategy).toBe("mux");
  });

  it("throws a clear error when no compatible format exists", async () => {
    await expect(
      resolveDownloadPlan(baseRequest.url, baseRequest, {
        innertubeFactory: async () => createFakeClient([])
      })
    ).rejects.toThrow("No supported downloadable formats were returned by the YouTube extraction backend.");
  });

  it("retries Innertube initialization after a transient creation failure", async () => {
    const createInnertubeImpl = vi
      .fn<typeof import("youtubei.js").Innertube.create>()
      .mockRejectedValueOnce(new Error("temporary network error"))
      .mockResolvedValueOnce(createFakeClient([createProgressiveFormat()]) as never);

    await expect(
      resolveDownloadPlan(baseRequest.url, baseRequest, {
        createInnertubeImpl
      })
    ).rejects.toThrow("temporary network error");

    const result = await resolveDownloadPlan(baseRequest.url, baseRequest, {
      createInnertubeImpl
    });

    expect(createInnertubeImpl).toHaveBeenCalledTimes(2);
    expect(result.plan.strategy).toBe("single");
  });
});

function createFakeClient(formats: FakeFormat[]) {
  return {
    async getBasicInfo() {
      return {
        basic_info: {
          id: "dQw4w9WgXcQ",
          title: "Example video",
          short_description: "Fixture",
          author: "Example channel",
          duration: 123
        },
        streaming_data: {
          formats: formats.filter((format) => format.has_audio && format.has_video),
          adaptive_formats: formats.filter((format) => format.has_audio !== format.has_video)
        },
        actions: {
          session: {
            player: {}
          }
        }
      };
    }
  };
}

function createProgressiveFormat(): FakeFormat {
  return {
    itag: 18,
    url: "https://example.com/progressive.mp4",
    mime_type: 'video/mp4; codecs="avc1.42001E, mp4a.40.2"',
    has_audio: true,
    has_video: true,
    bitrate: 1000,
    quality_label: "360p",
    width: 640,
    height: 360,
    decipher: async () => "https://example.com/progressive.mp4"
  };
}

function createVideoOnlyFormat(): FakeFormat {
  return {
    itag: 137,
    url: "https://example.com/video.mp4",
    mime_type: 'video/mp4; codecs="avc1.640028"',
    has_audio: false,
    has_video: true,
    bitrate: 2000,
    quality_label: "1080p",
    width: 1920,
    height: 1080,
    decipher: async () => "https://example.com/video.mp4"
  };
}

function createAudioOnlyFormat(): FakeFormat {
  return {
    itag: 140,
    url: "https://example.com/audio.m4a",
    mime_type: 'audio/mp4; codecs="mp4a.40.2"',
    has_audio: true,
    has_video: false,
    bitrate: 128000,
    average_bitrate: 128000,
    decipher: async () => "https://example.com/audio.m4a"
  };
}

function createBrokenFormat(): FakeFormat {
  return {
    itag: 999,
    signature_cipher: "s=abc",
    mime_type: 'video/mp4; codecs="avc1.42001E, mp4a.40.2"',
    has_audio: true,
    has_video: true,
    bitrate: 999999,
    quality_label: "2160p",
    width: 3840,
    height: 2160,
    decipher: async () => {
      throw new Error("No valid URL to decipher");
    }
  };
}
