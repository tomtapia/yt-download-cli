import { describe, expect, it, vi } from "vitest";
import { runCli } from "../src/app";

function createWriter() {
  let value = "";

  return {
    write(chunk: string) {
      value += chunk;
      return true;
    },
    toString() {
      return value;
    }
  };
}

describe("runCli", () => {
  it("runs the download command and prints the saved path", async () => {
    const stdout = createWriter();
    const stderr = createWriter();
    const downloader = vi.fn().mockResolvedValue({
      filePath: "/tmp/example.mp4",
      metadata: {
        videoId: "dQw4w9WgXcQ",
        title: "Example"
      },
      plan: {
        strategy: "single",
        container: "mp4",
        extension: "mp4",
        format: {
          itag: 18,
          url: "https://example.com",
          mimeType: 'video/mp4; codecs="avc1.42001E, mp4a.40.2"',
          container: "mp4",
          fileExtension: "mp4",
          codecs: ["avc1.42001E", "mp4a.40.2"],
          isProgressive: true,
          hasVideo: true,
          hasAudio: true
        }
      }
    });

    const exitCode = await runCli(
      ["node", "src/cli.ts", "download", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
      {
        stdout,
        stderr,
        cwd: "/work",
        downloadFromYouTubeImpl: downloader
      }
    );

    expect(exitCode).toBe(0);
    expect(downloader).toHaveBeenCalledOnce();
    expect(stdout.toString()).toContain("Saved to /tmp/example.mp4");
    expect(stderr.toString()).toBe("");
  });

  it("returns a non-zero exit code when the download command fails", async () => {
    const stdout = createWriter();
    const stderr = createWriter();
    const downloader = vi.fn().mockRejectedValue(new Error("ffmpeg is missing"));

    const exitCode = await runCli(
      ["node", "src/cli.ts", "download", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
      {
        stdout,
        stderr,
        cwd: "/work",
        downloadFromYouTubeImpl: downloader
      }
    );

    expect(exitCode).toBe(1);
    expect(stderr.toString()).toContain("ffmpeg is missing");
  });
});
