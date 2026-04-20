import { describe, expect, it } from "vitest";
import { sanitizeTitle } from "../src/download/sanitize-title";

describe("sanitizeTitle", () => {
  it("removes invalid filesystem characters", () => {
    expect(sanitizeTitle('An <invalid>: title?*', "fallback")).toBe("An -invalid-- title--");
  });

  it("falls back when the title becomes empty", () => {
    expect(sanitizeTitle('   ', "fallback")).toBe("fallback");
  });

  it("avoids Windows reserved basenames", () => {
    expect(sanitizeTitle("CON", "fallback")).toBe("CON-file");
    expect(sanitizeTitle("aux", "fallback")).toBe("aux-file");
    expect(sanitizeTitle("Lpt9", "fallback")).toBe("Lpt9-file");
  });

  it("handles reserved names after trimming trailing spaces and dots", () => {
    expect(sanitizeTitle("PRN.   ", "fallback")).toBe("PRN-file");
  });

  it("keeps normal titles unchanged", () => {
    expect(sanitizeTitle("Normal title", "fallback")).toBe("Normal title");
  });
});
