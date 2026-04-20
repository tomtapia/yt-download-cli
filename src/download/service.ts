import { mkdir, mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { CliError } from "../errors";
import { downloadToFile } from "./http";
import { normalizeDownloadOptions } from "./options";
import { remuxSingleInput, muxVideoAndAudio, ensureFfmpegInstalled, type FfmpegDependencies } from "./ffmpeg";
import { sanitizeTitle } from "./sanitize-title";
import type { DownloadCommandOptions, DownloadRequest, DownloadResult } from "./types";
import { resolveDownloadPlan, type ResolveDownloadPlanDependencies } from "../youtube/extractor";

export type DownloadServiceDependencies = ResolveDownloadPlanDependencies &
  FfmpegDependencies & {
    cwd?: string;
    fetchImpl?: typeof fetch;
    downloadToFileImpl?: typeof downloadToFile;
  };

export async function downloadFromYouTube(
  url: string,
  options: DownloadCommandOptions,
  dependencies: DownloadServiceDependencies = {}
): Promise<DownloadResult> {
  const request = normalizeDownloadOptions(url, options, dependencies.cwd ?? process.cwd());
  return downloadResolvedRequest(request, dependencies);
}

async function downloadResolvedRequest(
  request: DownloadRequest,
  dependencies: DownloadServiceDependencies
): Promise<DownloadResult> {
  await mkdir(request.outputDir, { recursive: true });
  await ensureFfmpegInstalled(dependencies);

  const resolved = await resolveDownloadPlan(request.url, request, dependencies);
  const safeBaseName = sanitizeTitle(resolved.metadata.title, resolved.metadata.videoId);
  const plan = resolved.plan;
  const finalPath = join(request.outputDir, `${safeBaseName}.${plan.extension}`);

  if (!request.overwrite) {
    await assertDoesNotExist(finalPath);
  }

  const temporaryDir = await mkdtemp(join(tmpdir(), "yt-download-cli-"));
  const downloadImpl = dependencies.downloadToFileImpl ?? downloadToFile;

  try {
    if (plan.strategy === "single") {
      const inputPath = join(temporaryDir, `input.${plan.format.fileExtension}`);
      await downloadImpl(plan.format.url, inputPath, dependencies.fetchImpl ?? fetch);
      await remuxSingleInput(inputPath, finalPath, request.mode, dependencies);
    } else {
      const videoPath = join(temporaryDir, `video.${plan.videoFormat.fileExtension}`);
      const audioPath = join(temporaryDir, `audio.${plan.audioFormat.fileExtension}`);
      await downloadImpl(plan.videoFormat.url, videoPath, dependencies.fetchImpl ?? fetch);
      await downloadImpl(plan.audioFormat.url, audioPath, dependencies.fetchImpl ?? fetch);
      await muxVideoAndAudio(videoPath, audioPath, finalPath, dependencies);
    }
  } finally {
    await rm(temporaryDir, { recursive: true, force: true });
  }

  return {
    filePath: finalPath,
    metadata: resolved.metadata,
    plan
  };
}

async function assertDoesNotExist(filePath: string): Promise<void> {
  try {
    await stat(filePath);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? (error as { code?: string }).code : undefined;

    if (code === "ENOENT") {
      return;
    }

    throw error;
  }

  throw new CliError(`The output file '${basename(filePath)}' already exists. Use --overwrite to replace it.`);
}
