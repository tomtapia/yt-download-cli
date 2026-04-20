# Repository Guidelines

## Project Structure & Module Organization
Source lives in `src/`. `src/cli.ts` and `src/app.ts` define the CLI surface. Download orchestration, validation, selection, and `ffmpeg` integration live under `src/download/`. YouTube-specific extraction and evaluator logic live under `src/youtube/`. Tests live in `test/`. Product specs and implementation plans live in `specs/`. Build output goes to `dist/` and must be treated as generated code.

## Build, Test, and Development Commands
Use `pnpm` only.

- `pnpm install`: install dependencies.
- `pnpm dev --help`: run the CLI from source.
- `pnpm dev download "<youtube-url>"`: exercise the downloader during development.
- `pnpm build`: clean `dist/` and compile TypeScript.
- `pnpm test`: run the Vitest suite.
- `pnpm pack --dry-run`: verify the publishable tarball contents.

`ffmpeg` on `PATH` is required for real downloads, MP3 transcoding, and ID3 metadata writing.

## Coding Style & Naming Conventions
Write TypeScript with 2-space indentation and keep modules focused. Use `camelCase` for functions and variables, `PascalCase` for types, and clear filenames under `src/download/` and `src/youtube/` that match their responsibility. Prefer user-facing error messages that explain invalid CLI combinations directly.

## Testing Guidelines
Tests use Vitest and live in `test/*.test.ts`. Add coverage for CLI parsing, option validation, format selection, extractor behavior, `ffmpeg` invocation details, and MP3 metadata handling. When changing packaging or release behavior, validate with `pnpm pack --dry-run` in addition to `pnpm test`.

## Commit & Pull Request Guidelines
Use Conventional Commits such as `feat: add mp3 metadata support and quality fixes` or `fix: retry innertube initialization after transient failures`. Keep commits scoped. PRs should include a short summary, commands run locally, and terminal output when CLI behavior changed materially.

## Security & Configuration Tips
Do not commit downloaded media, cookies, tokens, or local debug artifacts. The published package should contain runtime files only; keep source, tests, specs, and local assets out of the tarball. Treat YouTube extraction behavior as unstable over time and prefer explicit tests around regressions in format selection and metadata generation.
