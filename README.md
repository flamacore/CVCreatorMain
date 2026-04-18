# CVCreator

<img width="3840" alt="image" src="https://github.com/user-attachments/assets/61b32aea-c0f6-4eb6-9586-49353edf026c" />

***


>Author's note: This app is completely free and will always be. Just as a service to the community where sometimes job searching can be daunting & hard where even a single cent matters. Therefore, I don't see any ethical justification behind putting a price tag on high quality CV creation. That's my exact reason for creating this application.
_______________

Desktop-first, local-first CV creator built as a Tauri + React + TypeScript monorepo.

Use it to build CVs with a live preview, explicit file save/load, theme and layout controls, custom sections, and HTML/PDF export.

## Getting Started
Easiest install from [Releases](https://github.com/flamacore/CVCreatorMain/releases)
Just download, install and launch.

## Requirements

- Node.js 20+ with npm
- Rust toolchain for the Tauri desktop runtime
- Tauri system dependencies for your platform if you want to run the native shell
- Windows if you want to produce the current installer target

## Install

```bash
npm install
```

## Run In Browser Dev Mode

```bash
npm run dev
```

## Run As Desktop App

```bash
npm run tauri:dev
```

## Build Desktop Installer

```bash
npm run tauri:build
```

That writes the Windows NSIS installer to `apps/desktop/src-tauri/target/release/bundle/nsis`.

## Validation

Run the workspace checks from the repository root:

```bash
npm run typecheck
npm run build
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml
```

## Release & Installer

Windows installer creation follows the same overall pattern as UniGit:

- semantic-release runs from `.github/workflows/release.yml` on pushes to `main`
- a Windows release job checks out the new tag, imports a PFX certificate, builds the signed NSIS installer, and uploads the installer assets to the GitHub release
- local Windows packaging uses the PowerShell helpers in `scripts/windows`

Useful local commands:

```bash
npm run release:windows:cert -- -Password "choose-a-password"
npm run release:windows
```

The local release build emits installer artifacts under `apps/desktop/src-tauri/target/release/bundle/nsis`.

GitHub Actions expects these secrets:

- `WINDOWS_CERTIFICATE`: base64-encoded `.pfx` file
- `WINDOWS_CERTIFICATE_PASSWORD`: password for the `.pfx`
- `CVCREATOR_TIMESTAMP_URL`: optional RFC 3161 timestamp URL used during signing

## Save / Load Behavior

- `Save CV` and `Load CV` manage any number of explicit document files.
- Document files are stored as `.cvcreator.json`.
- In Tauri, save/load uses native dialogs and Rust file IO.
- In browser dev mode, the app uses browser file APIs when available and falls back to upload/download behavior.

## Export

- `Export HTML` writes the rendered document HTML.
- `Export PDF` uses the same rendering path as preview/export HTML, then captures it for a real PDF download.

## Disclaimer

This project is mostly vibe-coded with GPT-5.4 via GitHub Copilot, with human oversight, iteration, and manual fixes around the core flows. Use it at your own discretion.
