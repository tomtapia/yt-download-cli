import { describe, expect, it } from "vitest";
import { ensureYouTubeJsEvaluator } from "../src/youtube/evaluator";
import { Platform } from "youtubei.js";

describe("ensureYouTubeJsEvaluator", () => {
  it("installs a working evaluator for extracted player scripts", async () => {
    ensureYouTubeJsEvaluator();

    const result = await Platform.shim.eval(
      {
        output: `
const exportedVars = {
  nsigFunction(url, sp, s) {
    const value = new URL(url).searchParams;
    if (s) {
      value.set(sp || "sig", s.split("").reverse().join(""));
    }
    const currentN = value.get("n");
    if (currentN) {
      value.set("n", currentN.toUpperCase());
    }
    return value;
  }
};
function process(n = "", sp = "", s = "") {
  const mockStreamingURL = "https://ytjs.googlevideo.com/videoplayback?expire=1234567890&"+"n="+encodeURIComponent(n);
  const urlCtorFunction = exportedVars.nsigFunction;
  const urlCtor = urlCtorFunction(mockStreamingURL, sp, s);
  return {
    sig: urlCtor.get(sp),
    n: urlCtor.get("n")
  };
}
return process("abc", "sig", "def");
        `
      },
      {}
    );

    expect(result).toEqual({
      sig: "fed",
      n: "ABC"
    });
  });
});
