import { spawn } from "node:child_process";
import { CliError } from "../errors";
import type { Mp3TagMetadata } from "./types";

export type FfmpegDependencies = {
  spawnImpl?: typeof spawn;
};

export async function ensureFfmpegInstalled(dependencies: FfmpegDependencies = {}): Promise<void> {
  try {
    await runProcess(["-version"], dependencies);
  } catch (error) {
    throw new CliError(
      error instanceof Error && error.message
        ? `ffmpeg is required for this command: ${error.message}`
        : "ffmpeg is required for this command."
    );
  }
}

export async function remuxSingleInput(
  inputPath: string,
  outputPath: string,
  mode: "video" | "audio",
  options: {
    container?: "mp4" | "webm" | "m4a" | "mp3";
    audioBitrate?: "128k" | "192k" | "256k" | "320k";
    metadata?: Mp3TagMetadata;
  } = {},
  dependencies: FfmpegDependencies = {}
): Promise<void> {
  const args =
    mode === "audio"
      ? options.container === "mp3"
        ? [
            "-loglevel",
            "error",
            "-y",
            "-i",
            inputPath,
            "-vn",
            "-c:a",
            "libmp3lame",
            "-b:a",
            options.audioBitrate ?? "192k",
            "-id3v2_version",
            "3",
            ...buildMp3MetadataArgs(options.metadata),
            outputPath
          ]
        : ["-loglevel", "error", "-y", "-i", inputPath, "-vn", "-c:a", "copy", outputPath]
      : ["-loglevel", "error", "-y", "-i", inputPath, "-c", "copy", outputPath];

  await runProcess(args, dependencies);
}

function buildMp3MetadataArgs(metadata?: Mp3TagMetadata): string[] {
  if (!metadata) {
    return [];
  }

  const args: string[] = [];

  if (metadata.title) {
    args.push("-metadata", `title=${metadata.title}`);
  }

  if (metadata.artist) {
    args.push("-metadata", `artist=${metadata.artist}`);
  }

  if (metadata.comment) {
    args.push("-metadata", `comment=${metadata.comment}`);
  }

  return args;
}

export async function muxVideoAndAudio(
  videoPath: string,
  audioPath: string,
  outputPath: string,
  dependencies: FfmpegDependencies = {}
): Promise<void> {
  await runProcess(
    [
      "-loglevel",
      "error",
      "-y",
      "-i",
      videoPath,
      "-i",
      audioPath,
      "-map",
      "0:v:0",
      "-map",
      "1:a:0",
      "-c",
      "copy",
      outputPath
    ],
    dependencies
  );
}

async function runProcess(args: string[], dependencies: FfmpegDependencies): Promise<void> {
  const spawnImpl = dependencies.spawnImpl ?? spawn;

  await new Promise<void>((resolve, reject) => {
    const child = spawnImpl("ffmpeg", args, {
      stdio: ["ignore", "ignore", "pipe"]
    });
    let stderr = "";

    child.stderr?.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr.trim() || `ffmpeg exited with code ${code ?? "unknown"}.`));
    });
  });
}
