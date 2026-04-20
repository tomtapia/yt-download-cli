# Repository Guidelines

## Project Structure & Module Organization
Source lives in `src/`. The CLI entrypoint is `src/cli.ts`, command wiring is in `src/app.ts`, download orchestration is under `src/download/`, and YouTube-specific extraction/evaluator logic is under `src/youtube/`. Tests live in `test/`. Product notes and feature specs live in `specs/`. Built output goes to `dist/` and should never be edited manually.

## Build, Test, and Development Commands
Use `pnpm` only.

- `pnpm install`: install dependencies.
- `pnpm dev --help`: run the CLI from source.
- `pnpm dev download "<youtube-url>"`: exercise the downloader in development.
- `pnpm build`: clean `dist/` and compile TypeScript.
- `pnpm test`: run the Vitest suite.
- `pnpm pack --dry-run`: verify the publishable package contents.

`ffmpeg` must be available on `PATH` for real downloads.

## Coding Style & Naming Conventions
Write TypeScript with 2-space indentation and keep modules focused. Use `camelCase` for functions/variables, `PascalCase` for types, and `kebab-case` for file names only when a file name would otherwise be ambiguous. Prefer small pure helpers for parsing/selection logic and keep CLI validation errors user-facing and explicit.

## Testing Guidelines
Tests use Vitest and live in `test/*.test.ts`. Add unit coverage for CLI parsing, download option validation, YouTube extraction, and failure handling. When changing packaging or release behavior, verify with `pnpm pack --dry-run` in addition to `pnpm test`.

## Commit & Pull Request Guidelines
Use Conventional Commits, for example `feat: add initial stable YouTube downloader CLI` or `fix: retry innertube initialization after transient failures`. Keep commits scoped. PRs should include a short summary, the commands run locally, and terminal output when CLI behavior changed.

## Security & Configuration Tips
Do not commit downloaded media, cookies, tokens, or local debug artifacts. The published package should contain runtime files only; keep `src/`, `test/`, specs, and local assets out of releases.
