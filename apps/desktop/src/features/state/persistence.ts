import type { CVDocument } from "@cvcreator/document-model";

const STORAGE_KEY = "cvcreator.persistence.current";
const HISTORY_KEY = "cvcreator.persistence.history";
const MAX_REVISIONS = 12;

export interface PersistedResumeSnapshot {
  document: CVDocument;
  selectedSectionId: string | null;
}

export interface RevisionEntry {
  id: string;
  savedAt: string;
}

export interface PersistenceMetadata {
  runtime: "tauri" | "browser";
  savedAt: string;
  revisions: RevisionEntry[];
}

interface PersistedEnvelope extends PersistedResumeSnapshot {
  savedAt: string;
  revisions: RevisionEntry[];
}

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

export const isTauriRuntime = () => typeof window !== "undefined" && Boolean(window.__TAURI_INTERNALS__);

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const normalizeEnvelope = (value: unknown): PersistedEnvelope | null => {
  if (!isObject(value)) {
    return null;
  }

  const document = value.document;

  if (!isObject(document)) {
    return null;
  }

  const normalizedDocument = document as unknown as CVDocument;

  const revisions = Array.isArray(value.revisions)
    ? value.revisions.filter(
        (revision): revision is RevisionEntry =>
          isObject(revision) && typeof revision.id === "string" && typeof revision.savedAt === "string",
      )
    : [];

  return {
    document: normalizedDocument,
    selectedSectionId: typeof value.selectedSectionId === "string" ? value.selectedSectionId : null,
    savedAt:
      typeof value.savedAt === "string"
        ? value.savedAt
        : typeof normalizedDocument.updatedAt === "string"
          ? normalizedDocument.updatedAt
          : new Date().toISOString(),
    revisions,
  };
};

const parseEnvelope = (value: string | null): PersistedEnvelope | null => {
  if (!value) {
    return null;
  }

  try {
    return normalizeEnvelope(JSON.parse(value));
  } catch {
    return null;
  }
};

const getBrowserHistory = () => parseEnvelope(localStorage.getItem(HISTORY_KEY))?.revisions ?? [];

export const loadPersistedResume = async (): Promise<(PersistedResumeSnapshot & PersistenceMetadata) | null> => {
  if (isTauriRuntime()) {
    const { invoke } = await import("@tauri-apps/api/core");
    const result = await invoke<PersistedEnvelope | null>("load_document");

    if (!result) {
      return null;
    }

    return {
      document: result.document,
      selectedSectionId: result.selectedSectionId,
      runtime: "tauri",
      savedAt: result.savedAt,
      revisions: result.revisions,
    };
  }

  const result = parseEnvelope(localStorage.getItem(STORAGE_KEY));

  if (!result) {
    return null;
  }

  return {
    document: result.document,
    selectedSectionId: result.selectedSectionId,
    runtime: "browser",
    savedAt: result.savedAt,
    revisions: result.revisions,
  };
};

export const savePersistedResume = async (
  snapshot: PersistedResumeSnapshot,
): Promise<PersistenceMetadata> => {
  const savedAt = new Date().toISOString();
  const revision: RevisionEntry = {
    id: `${savedAt}-${snapshot.document.id}`,
    savedAt,
  };

  if (isTauriRuntime()) {
    const { invoke } = await import("@tauri-apps/api/core");

    return invoke<PersistenceMetadata>("save_document", {
      payload: {
        ...snapshot,
        savedAt,
        revision,
      },
    });
  }

  const revisions = [revision, ...getBrowserHistory()].slice(0, MAX_REVISIONS);
  const envelope: PersistedEnvelope = {
    ...snapshot,
    savedAt,
    revisions,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  localStorage.setItem(HISTORY_KEY, JSON.stringify({ revisions }));

  return {
    runtime: "browser",
    savedAt,
    revisions,
  };
};
