import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { remuxSingleInput } from "../src/download/ffmpeg";

describe("remuxSingleInput", () => {
  it("transcodes mp3 with libmp3lame and the requested bitrate", async () => {
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

    await remuxSingleInput(
      "/tmp/input.m4a",
      "/tmp/output.mp3",
      "audio",
      {
        container: "mp3",
        audioBitrate: "256k",
        metadata: {
          title: "Track title",
          artist: "Channel name",
          comment: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        }
      },
      { spawnImpl }
    );

    expect(spawnImpl).toHaveBeenCalledWith(
      "ffmpeg",
      [
        "-loglevel",
        "error",
        "-y",
        "-i",
        "/tmp/input.m4a",
        "-vn",
        "-c:a",
        "libmp3lame",
        "-b:a",
        "256k",
        "-id3v2_version",
        "3",
        "-metadata",
        "title=Track title",
        "-metadata",
        "artist=Channel name",
        "-metadata",
        "comment=https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "/tmp/output.mp3"
      ],
      {
        stdio: ["ignore", "ignore", "pipe"]
      }
    );
  });

  it("does not add id3 metadata arguments for non-mp3 audio outputs", async () => {
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

    await remuxSingleInput(
      "/tmp/input.m4a",
      "/tmp/output.m4a",
      "audio",
      {
        container: "m4a",
        metadata: {
          title: "Track title",
          artist: "Channel name",
          comment: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        }
      },
      { spawnImpl }
    );

    expect(spawnImpl).toHaveBeenCalledWith(
      "ffmpeg",
      ["-loglevel", "error", "-y", "-i", "/tmp/input.m4a", "-vn", "-c:a", "copy", "/tmp/output.m4a"],
      {
        stdio: ["ignore", "ignore", "pipe"]
      }
    );
  });
});
