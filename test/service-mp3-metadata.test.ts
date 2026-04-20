import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { downloadFromYouTube } from "../src/download/service";

describe("downloadFromYouTube mp3 metadata", () => {
  it("passes title, artist, and source url metadata to ffmpeg for mp3 output", async () => {
    const spawnImpl = vi.fn(() => {
      const child = new EventEmitter() as EventEmitter & {
        stderr: EventEmitter;
      };
      child.stderr = new EventEmitter();

      queueMicrotask(() => {
        child.emit("close", 0);
      });

      return child as never;
    });

    const downloadToFileImpl = vi.fn().mockResolvedValue(undefined);

    const result = await downloadFromYouTube(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      {
        mode: "audio",
        container: "mp3",
        audioBitrate: "192k",
        outputDir: "/tmp",
        overwrite: true
      },
      {
        downloadToFileImpl,
        spawnImpl,
        innertubeFactory: async () => ({
          async getBasicInfo() {
            return {
              basic_info: {
                id: "dQw4w9WgXcQ",
                title: "Example video",
                author: "Example channel",
                duration: 123
              },
              streaming_data: {
                formats: [],
                adaptive_formats: [
                  {
                    itag: 140,
                    url: "https://example.com/audio.m4a",
                    mime_type: 'audio/mp4; codecs="mp4a.40.2"',
                    has_audio: true,
                    has_video: false,
                    bitrate: 128000,
                    average_bitrate: 128000,
                    decipher: async () => "https://example.com/audio.m4a"
                  }
                ]
              },
              actions: {
                session: {
                  player: {}
                }
              }
            };
          }
        })
      }
    );

    expect(downloadToFileImpl).toHaveBeenCalledOnce();
    expect(result.filePath.endsWith(".mp3")).toBe(true);
    expect(spawnImpl).toHaveBeenCalledWith(
      "ffmpeg",
      expect.arrayContaining([
        "-id3v2_version",
        "3",
        "-metadata",
        "title=Example video",
        "-metadata",
        "artist=Example channel",
        "-metadata",
        "comment=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      ]),
      {
        stdio: ["ignore", "ignore", "pipe"]
      }
    );
  });
});
