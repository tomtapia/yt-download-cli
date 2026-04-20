import { Command, CommanderError, Option } from "commander";
import { formatAboutText, getAppMetadata } from "./about";
import { downloadFromYouTube } from "./download/service";
import type { DownloadCommandOptions } from "./download/types";
import { isCliError } from "./errors";

export type CliDependencies = {
  stdout?: Pick<NodeJS.WriteStream, "write">;
  stderr?: Pick<NodeJS.WriteStream, "write">;
  cwd?: string;
  downloadFromYouTubeImpl?: typeof downloadFromYouTube;
};

export async function runCli(argv: string[], dependencies: CliDependencies = {}): Promise<number> {
  const stdout = dependencies.stdout ?? process.stdout;
  const stderr = dependencies.stderr ?? process.stderr;
  const metadata = getAppMetadata();
  const program = new Command();

  program
    .name(metadata.name)
    .description(metadata.description)
    .version(metadata.version, "-V, --version", "Display the current version")
    .helpOption("-h, --help", "Display help information")
    .showHelpAfterError("(run with --help for usage)")
    .addOption(new Option("--about", "Display information about this tool"))
    .configureOutput({
      writeOut: (value) => {
        stdout.write(value);
      },
      writeErr: (value) => {
        stderr.write(value);
      }
    })
    .exitOverride();

  registerDownloadCommand(program, dependencies);

  const args = argv.slice(2);

  if (args.length === 0) {
    program.outputHelp();
    return 0;
  }

  if (args.length === 1 && args[0] === "--about") {
    stdout.write(`${formatAboutText(metadata)}\n`);
    return 0;
  }

  try {
    await program.parseAsync(argv);
  } catch (error) {
    if (error instanceof CommanderError) {
      return error.exitCode;
    }

    const message = error instanceof Error ? error.message : String(error);
    stderr.write(`${message}\n`);
    return isCliError(error) ? error.exitCode : 1;
  }

  const options = program.opts<{ about?: boolean }>();

  if (options.about) {
    stdout.write(`${formatAboutText(metadata)}\n`);
  }

  return 0;
}

function registerDownloadCommand(program: Command, dependencies: CliDependencies): void {
  const downloader = dependencies.downloadFromYouTubeImpl ?? downloadFromYouTube;

  program
    .command("download")
    .argument("<url>", "Full YouTube watch URL or youtu.be URL")
    .description("Download a public YouTube video using the built-in TypeScript downloader")
    .addOption(new Option("--mode <mode>", "Download mode").choices(["video", "audio"]).default("video"))
    .addOption(
      new Option("--container <container>", "Output container").choices(["mp4", "webm", "m4a", "mp3"])
    )
    .addOption(
      new Option("--quality <quality>", "Quality preset").choices(["best", "1080p", "720p", "480p"]).default("best")
    )
    .addOption(
      new Option("--audio-bitrate <bitrate>", "MP3 audio bitrate")
        .choices(["128k", "192k", "256k", "320k"])
    )
    .option("--output-dir <path>", "Directory where the output file will be written")
    .option("--overwrite", "Replace the output file if it already exists")
    .action(async (url: string, options: DownloadCommandOptions) => {
      const result = await downloader(url, options, {
        cwd: dependencies.cwd ?? process.cwd()
      });

      (dependencies.stdout ?? process.stdout).write(`Saved to ${result.filePath}\n`);
    });
}
