import { spawnSync } from "node:child_process";
import { beforeAll, describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function runSourceCli(...args: string[]) {
  return spawnSync("pnpm", ["exec", "tsx", "src/cli.ts", ...args], {
    cwd: projectRoot,
    encoding: "utf8"
  });
}

function runBuiltCli(...args: string[]) {
  return spawnSync(process.execPath, ["dist/cli.js", ...args], {
    cwd: projectRoot,
    encoding: "utf8"
  });
}

beforeAll(() => {
  const result = spawnSync("pnpm", ["build"], {
    cwd: projectRoot,
    encoding: "utf8"
  });

  expect(result.status, result.stderr || result.stdout).toBe(0);
});

describe("CLI integration", () => {
  it("prints help when invoked without arguments", () => {
    const result = runSourceCli();

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Usage:");
    expect(result.stdout).toContain("download");
  });

  it("prints help with --help", () => {
    const result = runSourceCli("--help");

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Usage:");
    expect(result.stdout).toContain("download");
  });

  it("prints project information with --about", () => {
    const result = runSourceCli("--about");

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("yt-download-cli v0.1.0");
    expect(result.stdout).toContain("downloading YouTube content");
  });

  it("fails for an unknown option", () => {
    const result = runSourceCli("--missing");

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("error: unknown option '--missing'");
  });

  it("runs successfully from the compiled output", () => {
    const result = runBuiltCli("--about");

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("yt-download-cli v0.1.0");
  });
});
