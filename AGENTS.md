# Repository Guidelines

## Project Structure & Module Organization

Keep the root limited to project-wide configuration and documentation. The current layout is:

- `src/core/` for deterministic voting logic: player validation, tallying, vote budgets, and the hot-seat session flow. It must not import React or touch browser APIs.
- `src/ui/` for React screens, styles, and browser storage.
- `tests/core/` for Vitest coverage of `src/core/`.
- `README.md` for player-facing setup and usage; `FEATURES.md` for planned work.

Document any new top-level directory here (for example `src-tauri/` if a desktop wrapper is added), and avoid committing generated output (`dist/`) or dependency caches (`node_modules/`).

## Build, Test, and Development Commands

The app uses React, TypeScript, and Vite, and requires Node.js 20+. Run commands from the repository root:

- `npm run dev` starts the local dev server.
- `npm test` runs all tests once; `npm run test:watch` re-runs on change.
- `npm run typecheck` type-checks the project.
- `npm run build` type-checks and builds into `dist/`.

Commands should work from the repository root and must not depend on undocumented global tools.

## Coding Style & Naming Conventions

Use strict TypeScript with two-space indentation and double quotes. Use `camelCase` for functions and variables, `PascalCase` for types and React components, and name component files after their component. Keep state transitions in `src/core/session.ts` as pure functions that return a new state or throw an `Error`; screens call them and display error messages. Do not log or persist secret ballots: only player names may be stored, in `localStorage`. Keep `autoComplete="off"` on ballot inputs so the browser never suggests earlier players' entries.

## Testing Guidelines

Every behavior change should include Vitest tests under `tests/core/`, named `*.test.ts`. Cover successful behavior, validation failures, zero votes, cross-agenda vote budgets, and important edge cases. Bug fixes should include a regression test. Ensure `npm test` and `npm run typecheck` pass before opening a pull request.

## Commit & Pull Request Guidelines

Use short, imperative commit subjects such as `Add ballot validation`; keep unrelated changes in separate commits. Pull requests should explain the problem and solution, list verification performed, and link relevant issues. Include screenshots or recordings for visible UI changes and call out migrations, configuration changes, or follow-up work.
