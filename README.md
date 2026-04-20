# yt-download-cli

`yt-download-cli` is a TypeScript CLI for downloading public YouTube videos from the terminal. It uses `YouTube.js` for metadata and stream discovery and `ffmpeg` for remuxing or muxing the final output.

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
```

## Usage

```bash
pnpm dev download "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
pnpm dev download "https://youtu.be/dQw4w9WgXcQ" --mode audio --container m4a
node dist/cli.js download "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --output-dir ./downloads
```

### Download options

- `--mode video|audio`
- `--container mp4|webm|m4a`
- `--quality best|1080p|720p|480p`
- `--output-dir <path>`
- `--overwrite`

Semantic constraints are enforced at runtime:

- `--mode audio` only supports `--container m4a` or `--container webm`
- `--mode video` only supports `--container mp4` or `--container webm`
- `--quality` primarily affects video selection; in audio mode it only matters when the backend falls back to a progressive stream

## Packaging

```bash
pnpm build
pnpm pack --dry-run
```

The published package is built from `dist/` during `prepack` and excludes source files, tests, specs, and local media.

## Current scope

- Supports public `youtube.com/watch` and `youtu.be` URLs
- Supports `video` and `audio` download modes
- Uses a custom JavaScript evaluator for `YouTube.js` signature deciphering

## Current limitations

- No playlists, cookies, login-required videos, private videos, age-gated videos, or live streams
- Depends on YouTube's current InnerTube/player behavior and may require extractor updates when YouTube changes
