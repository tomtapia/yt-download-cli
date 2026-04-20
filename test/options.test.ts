import { describe, expect, it } from "vitest";
import { normalizeDownloadOptions } from "../src/download/options";

describe("normalizeDownloadOptions", () => {
  it("defaults mp3 bitrate to 192k", () => {
    const request = normalizeDownloadOptions(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      {
        mode: "audio",
        container: "mp3"
      },
      "/work"
    );

    expect(request.audioBitrate).toBe("192k");
  });

  it("rejects mp3 for video mode", () => {
    expect(() =>
      normalizeDownloadOptions(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        {
          mode: "video",
          container: "mp3"
        },
        "/work"
      )
    ).toThrow("Container 'mp3' is only valid for audio mode.");
  });

  it("rejects audio bitrate when container is not mp3", () => {
    expect(() =>
      normalizeDownloadOptions(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        {
          mode: "audio",
          container: "m4a",
          audioBitrate: "256k"
        },
        "/work"
      )
    ).toThrow("Option '--audio-bitrate' is only valid when '--container mp3' is selected.");
  });
});
