# CVCreator

Desktop-first, local-first CV creator built as a Tauri + React + TypeScript monorepo. The app is no longer just a scaffold: the current repo contains a working editor with live preview, explicit save/load, theming and layout controls, custom sections, rich content overrides, and real PDF export.

## Current State

The current app supports:

- studio / preview / inspector workflow with a centered A4 preview
- drag and drop for sections and entries, plus right-click context menus
- built-in resume sections and user-created custom sections
- optional structured entry parts with per-part title visibility and value visibility
- photo support with layout-aware hero placement
- per-area Markdown and HTML overrides
- typography and layout controls including per-area line-height, paragraph spacing, and structured field gap
- theme presets, app-shell theme presets, and layout presets with a custom layout mode
- local autosave plus explicit `Save CV` / `Load CV`
- HTML export and real PDF export driven from the same rendering pipeline used by preview

Document files are currently saved as `.cvcreator.json`.

## Workspace Layout

- `apps/desktop`: React/Vite editor UI and Tauri desktop shell
- `packages/document-model`: canonical CV schema, defaults, presets, and normalization
- `packages/rendering`: HTML / Markdown rendering helpers used by preview and export
- `packages/template-engine`: layout/template compatibility analysis
- `docs/IMPLEMENTATION_PLAN.md`: implementation roadmap and product rules

## Getting Started

### Prerequisites

- Node.js with npm
- Rust toolchain for the Tauri desktop runtime
- Tauri system dependencies for your platform if you want to run the native shell

### Run In Browser Dev Mode

```bash
npm install
npm run dev
```

### Run As Desktop App

```bash
npm install
npm run tauri:dev
```

## Validation

Run the workspace checks from the repository root:

```bash
npm run typecheck
npm run build
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml
```

## Save / Load Behavior

- The app keeps a local autosave while you work.
- `Save CV` and `Load CV` manage any number of explicit document files.
- In Tauri, save/load uses native dialogs and Rust file IO.
- In browser dev mode, the app uses browser file APIs when available and falls back to upload/download behavior.

## Export

- `Export HTML` writes the rendered document HTML.
- `Export PDF` uses the same rendering path as preview/export HTML, then captures it for a real PDF download.

## Notes

- This repository is desktop-first, but browser dev mode is useful for fast iteration.
- The project is designed to keep preview and export visually aligned by sharing a single rendering system.

## Plan

The detailed implementation plan lives in `docs/IMPLEMENTATION_PLAN.md`.
