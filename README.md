# yt-download-cli

`yt-download-cli` is a TypeScript CLI for downloading public YouTube audio and video from the terminal. It uses `YouTube.js` for metadata and stream discovery, a custom JavaScript evaluator for signature deciphering, and `ffmpeg` for remuxing, muxing, MP3 transcoding, and ID3 tagging.

## Requirements

- Node.js 20+
- `pnpm`
- `ffmpeg` available on `PATH`

## Development

```bash
pnpm install
pnpm dev --help
pnpm dev --about
pnpm build
pnpm test
pnpm pack --dry-run
```

## Usage

```bash
pnpm dev download "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
pnpm dev download "https://youtu.be/dQw4w9WgXcQ" --mode audio --container m4a
pnpm dev download "https://youtu.be/dQw4w9WgXcQ" --mode audio --container mp3 --audio-bitrate 192k
node dist/cli.js download "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --output-dir ./downloads
```

### Download options

- `--mode video|audio`
- `--container mp4|webm|m4a|mp3`
- `--quality best|1080p|720p|480p`
- `--audio-bitrate 128k|192k|256k|320k`
- `--output-dir <path>`
- `--overwrite`

Runtime rules:

- `--mode audio` supports `m4a`, `webm`, and `mp3`
- `--mode video` supports `mp4` and `webm` only
- `--audio-bitrate` applies only to `--container mp3` and defaults to `192k`
- `--quality` mainly affects video selection; in audio mode it matters only if the backend falls back to a progressive stream

## Current behavior

- `m4a` and `webm` audio outputs are remuxed without audio transcoding
- `mp3` output is produced by downloading the best available source audio stream and transcoding it with `ffmpeg`
- MP3 files are written with ID3v2.3 metadata:
  - `title` from the YouTube video title
  - `artist` from the YouTube channel/author when available
  - `comment` with the original source URL
- For MP3 source selection, bitrate is the primary ranking rule and container is only a tiebreaker

## Packaging

```bash
pnpm build
pnpm pack --dry-run
```

The published package is built from `dist/` during `prepack` and excludes source files, tests, specs, and local media.

## Project layout

- `src/app.ts` and `src/cli.ts`: CLI entrypoints and command wiring
- `src/download/`: options, format selection, `ffmpeg` integration, and download orchestration
- `src/youtube/`: YouTube extraction, URL parsing, and evaluator integration
- `test/`: Vitest coverage for CLI behavior, validation, selection logic, evaluator behavior, `ffmpeg` args, and MP3 metadata handling
- `specs/`: product specs and implementation plans kept in-repo for feature work

## Current scope

- Supports public `youtube.com/watch` and `youtu.be` URLs
- Supports video download and audio download in `m4a`, `webm`, and `mp3`
- Supports MP3 bitrate selection and embedded ID3 metadata

## Current limitations

- No playlists, cookies, login-required videos, private videos, age-gated videos, or live streams
- No embedded album art, album, track number, lyrics, chapters, or richer audio metadata yet
- Depends on YouTube's current InnerTube/player behavior and may require extractor updates when YouTube changes
