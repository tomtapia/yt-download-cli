import { describe, expect, it } from "vitest";
import { parseYouTubeUrl } from "../src/youtube/url";

describe("parseYouTubeUrl", () => {
  it("parses a standard youtube watch URL", () => {
    expect(parseYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      videoId: "dQw4w9WgXcQ",
      watchUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    });
  });

  it("parses a youtu.be short URL", () => {
    expect(parseYouTubeUrl("https://youtu.be/dQw4w9WgXcQ")).toEqual({
      videoId: "dQw4w9WgXcQ",
      watchUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    });
  });

  it("rejects unsupported hosts", () => {
    expect(() => parseYouTubeUrl("https://example.com/watch?v=dQw4w9WgXcQ")).toThrow(
      "Only youtube.com/watch and youtu.be URLs are supported in v1."
    );
  });
});
