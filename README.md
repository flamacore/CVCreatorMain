# CVCreator

Desktop-first CV creator foundation for a highly flexible resume editor with drag and drop, right-click context menus, optional sections, theming, layout presets, per-area Markdown and HTML editing, photo support, and PDF-focused preview architecture.

## Current Slice

This repository now contains the initial implementation foundation:

- npm workspaces for the desktop app and shared packages
- typed document model for all required resume sections
- template compatibility service for layout switching and HTML discard warnings
- rendering utilities for Markdown and sanitized HTML preview
- a working React editor shell with section library, editor canvas, inspector, preview, theme/layout controls, drag and drop, and context menus

## Run

1. `npm install`
2. `npm run dev`
3. `npm run tauri:dev` for the desktop runtime once the Rust toolchain dependencies are available

## Validate

1. `npm run typecheck`
2. `npm run build`
3. `cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml`

## Plan

The detailed implementation plan is in `docs/IMPLEMENTATION_PLAN.md`.
