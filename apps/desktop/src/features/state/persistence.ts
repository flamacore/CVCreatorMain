import type { CVDocument } from "@cvcreator/document-model";

export interface PersistedResumeSnapshot {
  document: CVDocument;
  selectedSectionId: string | null;
}

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

export const isTauriRuntime = () => typeof window !== "undefined" && Boolean(window.__TAURI_INTERNALS__);
