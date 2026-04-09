# Desktop CV Creator Implementation Plan

Build a desktop-first, local-only CV creator as a Tauri + React + TypeScript workspace with a canonical document model, a capability-driven interaction system, a versioned preset and template engine, and a single HTML rendering pipeline that powers both live preview and PDF export.

## Phases

1. Foundation. Scaffold the monorepo, lock the interaction contract, and define the shared design token system.
2. Canonical document model. Model optional sections, assets, Markdown content, and custom HTML overrides.
3. Local persistence and safety. Add local `.cv` storage, autosave, revisions, migrations, and archive-on-risky-change flows.
4. Editor workspace and interaction substrate. Build the section library, editor canvas, preview, inspector, and command surface.
5. Content editors. Implement rich section editors for experience, education, skills, languages, contact, photo, title, and summary.
6. Themes, layouts, and template studio. Ship built-in presets and a full custom template authoring surface.
7. Rendering and PDF pipeline. Keep preview and export on the same HTML and CSS path for deterministic PDF output.
8. UX layering and polish. Maintain an intuitive surface for guided users while exposing deep controls for power users.
9. Quality gates. Enforce drag and drop coverage, context menu coverage, layout switch safety, accessibility, and PDF fidelity.

## Non-Negotiable Product Rules

- Photos are first-class content.
- Work experience, education, hard skills, soft skills, languages, contact info, photo, title, and summary are all optional sections.
- Theme presets and layout presets are mandatory.
- Every area must support Markdown and custom HTML editing.
- Layout changes may discard incompatible custom HTML only after a warning and archive step.
- Everything feasible must support drag and drop.
- Everything feasible must support right-click context menus.
- The app must generate PDFs from the same rendering system used for on-screen preview.

## Initial Repository Targets

- `apps/desktop` for the editor shell and interaction layer
- `packages/document-model` for resume schema and default content
- `packages/template-engine` for preset compatibility checks and future template manifests
- `packages/rendering` for sanitized HTML and Markdown preview helpers
