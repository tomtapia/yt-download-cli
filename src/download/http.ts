import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { pipeline } from "node:stream/promises";
import { CliError } from "../errors";

export async function downloadToFile(
  url: string,
  destinationPath: string,
  fetchImpl: typeof fetch = fetch
): Promise<void> {
  const response = await fetchImpl(url);

  if (!response.ok) {
    throw new CliError(`Failed to download '${url}' (${response.status} ${response.statusText}).`);
  }

  if (!response.body) {
    throw new CliError(`The download response for '${url}' does not contain a body.`);
  }

  const body = Readable.fromWeb(response.body as unknown as NodeReadableStream);
  await pipeline(body, createWriteStream(destinationPath));
}
