# Repository Guidelines

## Project Structure & Module Organization
This repository is currently a small Node.js CLI scaffold. Root files include `package.json`, `pnpm-lock.yaml`, and [README.md](/Users/tomas/Dev/MyProject/yt-download-cli/README.md). Product and implementation notes live in `specs/`, currently `specs/cli-scaffold-spec.md`, which describes the intended TypeScript CLI shape. There is no `src/` or `tests/` directory yet; when adding implementation, place CLI source under `src/` and mirror tests under `tests/` or alongside source as `*.test.ts`.

## Build, Test, and Development Commands
Use `pnpm` as the package manager because the repo is pinned to `pnpm@10.33.0`.

- `pnpm install`: install dependencies from `package.json`.
- `pnpm test`: current placeholder script; it exits with an error until a real test runner is added.
- `pnpm run pi`: runs the existing `pi` script defined in `package.json`.

If you add TypeScript tooling, keep standard lifecycle scripts at the root, for example `pnpm build`, `pnpm lint`, and `pnpm dev`.

## Coding Style & Naming Conventions
Write new code in TypeScript, matching the existing scaffold spec in `specs/cli-scaffold-spec.md`. Use 2-space indentation, keep files ASCII unless there is a clear reason not to, and prefer small modules with one clear responsibility. Use `kebab-case` for file names (`about-command.ts`), `camelCase` for variables/functions, and `PascalCase` for types and classes. If you introduce formatting or linting, prefer project-level scripts such as `pnpm lint` and `pnpm format`.

## Testing Guidelines
There is no test framework configured yet. Add one before shipping behavior changes. Favor fast unit tests for argument parsing and command handlers, and name tests `*.test.ts`. A good starting point is to verify `--help`, `--about`, and exit codes from the CLI entry point.

## Commit & Pull Request Guidelines
The repository has no commit history yet, so use short imperative commit messages such as `Add TypeScript CLI entrypoint` or `Set up help command tests`. Keep commits focused. For pull requests, include:

- a concise summary of the change
- linked issue or spec when relevant
- commands run locally, such as `pnpm test`
- terminal output or screenshots only when CLI behavior changed materially

## Security & Configuration Tips
Do not commit secrets, cookies, or downloaded media. Keep local environment details out of source control, and document new configuration in `README.md` when adding runtime dependencies or external APIs.
