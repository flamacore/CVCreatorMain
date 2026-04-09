import type { CVDocument } from "@cvcreator/document-model";
import { invoke } from "@tauri-apps/api/core";

import type { PersistedResumeSnapshot } from "./persistence";
import { isTauriRuntime } from "./persistence";

const DOCUMENT_FILE_EXTENSION = ".cvcreator.json";
const DOCUMENT_FILE_DESCRIPTION = "CVCreator documents";

interface WritableFileStreamLike {
  write: (data: string) => Promise<void>;
  close: () => Promise<void>;
}

export interface ResumeFileHandle {
  name: string;
  getFile: () => Promise<File>;
  createWritable?: () => Promise<WritableFileStreamLike>;
}

interface WindowWithFilePickers extends Window {
  showOpenFilePicker?: (options?: {
    multiple?: boolean;
    excludeAcceptAllOption?: boolean;
    types?: Array<{
      description?: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<ResumeFileHandle[]>;
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    excludeAcceptAllOption?: boolean;
    types?: Array<{
      description?: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<ResumeFileHandle>;
}

interface ResumeDocumentFileEnvelope {
  format: "cvcreator-document";
  version: 1;
  savedAt: string;
  document: CVDocument;
  selectedSectionId: string | null;
}

export interface ResumeDocumentFileReference {
  name: string;
  handle?: ResumeFileHandle;
  path?: string;
}

export interface LoadedResumeDocument {
  file: ResumeDocumentFileReference;
  snapshot: PersistedResumeSnapshot;
}

const filePickerTypes = [
  {
    description: DOCUMENT_FILE_DESCRIPTION,
    accept: {
      "application/json": [DOCUMENT_FILE_EXTENSION, ".json"],
    },
  },
];

const sanitizeFileName = (value: string) => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "resume";
};

const buildDocumentFileName = (title: string) => `${sanitizeFileName(title)}${DOCUMENT_FILE_EXTENSION}`;

const getFileNameFromPath = (value: string) => value.split(/[/\\]/).filter(Boolean).at(-1) ?? value;

const isAbortError = (error: unknown) =>
  error instanceof DOMException && (error.name === "AbortError" || error.name === "NotAllowedError");

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const looksLikeDocument = (value: unknown): value is CVDocument =>
  isObject(value) && typeof value.id === "string" && Array.isArray(value.sections);

const serializeResumeDocument = (snapshot: PersistedResumeSnapshot) =>
  JSON.stringify(
    {
      format: "cvcreator-document",
      version: 1,
      savedAt: new Date().toISOString(),
      document: snapshot.document,
      selectedSectionId: snapshot.selectedSectionId,
    } satisfies ResumeDocumentFileEnvelope,
    null,
    2,
  );

const parseResumeDocument = (content: string): PersistedResumeSnapshot => {
  const trimmed = content.trim();

  if (!trimmed) {
    throw new Error("This file is empty.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch {
    throw new Error("This file is not valid JSON. It may be incomplete or corrupted.");
  }

  if (looksLikeDocument(parsed)) {
    return {
      document: parsed,
      selectedSectionId: null,
    };
  }

  if (isObject(parsed) && looksLikeDocument(parsed.document)) {
    return {
      document: parsed.document,
      selectedSectionId: typeof parsed.selectedSectionId === "string" ? parsed.selectedSectionId : null,
    };
  }

  throw new Error("This file is not a valid CVCreator document.");
};

const parseResumeDocumentFile = async (file: File) => {
  try {
    return parseResumeDocument(await file.text());
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Could not load \"${file.name}\". ${error.message}`);
    }

    throw error;
  }
};

const promptForFile = async () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = `${DOCUMENT_FILE_EXTENSION},.json,application/json`;

  const file = await new Promise<File | null>((resolve) => {
    input.addEventListener(
      "change",
      () => {
        resolve(input.files?.[0] ?? null);
      },
      { once: true },
    );

    input.click();
  });

  return file;
};

const downloadFile = (name: string, content: string) => {
  const blob = new Blob([content], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

const writeToHandle = async (handle: ResumeFileHandle, content: string) => {
  if (!handle.createWritable) {
    throw new Error("This environment cannot write back to the selected file.");
  }

  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
};

export const loadResumeDocumentFile = async (): Promise<LoadedResumeDocument | null> => {
  if (isTauriRuntime()) {
    const result = await invoke<{ path: string; content: string } | null>("open_document_file");

    if (!result) {
      return null;
    }

    return {
      file: {
        name: getFileNameFromPath(result.path),
        path: result.path,
      },
      snapshot: parseResumeDocument(result.content),
    };
  }

  const filePickerWindow = window as WindowWithFilePickers;

  try {
    if (filePickerWindow.showOpenFilePicker) {
      const [handle] = await filePickerWindow.showOpenFilePicker({
        multiple: false,
        excludeAcceptAllOption: false,
        types: filePickerTypes,
      });

      if (!handle) {
        return null;
      }

      const file = await handle.getFile();
      const snapshot = await parseResumeDocumentFile(file);

      return {
        file: {
          name: handle.name,
          handle,
        },
        snapshot,
      };
    }
  } catch (error) {
    if (isAbortError(error)) {
      return null;
    }

    throw error;
  }

  const file = await promptForFile();

  if (!file) {
    return null;
  }

  return {
    file: {
      name: file.name,
    },
    snapshot: await parseResumeDocumentFile(file),
  };
};

export const saveResumeDocumentFile = async (
  snapshot: PersistedResumeSnapshot,
  currentFile: ResumeDocumentFileReference | null,
): Promise<ResumeDocumentFileReference | null> => {
  const content = serializeResumeDocument(snapshot);

  if (isTauriRuntime()) {
    const suggestedName = currentFile?.name ?? buildDocumentFileName(snapshot.document.title);
    const savedPath = await invoke<string | null>("save_document_file", {
      currentPath: currentFile?.path ?? null,
      suggestedName,
      content,
    });

    if (!savedPath) {
      return null;
    }

    return {
      name: getFileNameFromPath(savedPath),
      path: savedPath,
    };
  }

  if (currentFile?.handle?.createWritable) {
    await writeToHandle(currentFile.handle, content);
    return currentFile;
  }

  const filePickerWindow = window as WindowWithFilePickers;
  const suggestedName = currentFile?.name ?? buildDocumentFileName(snapshot.document.title);

  try {
    if (filePickerWindow.showSaveFilePicker) {
      const handle = await filePickerWindow.showSaveFilePicker({
        suggestedName,
        excludeAcceptAllOption: false,
        types: filePickerTypes,
      });

      await writeToHandle(handle, content);

      return {
        name: handle.name,
        handle,
      };
    }
  } catch (error) {
    if (isAbortError(error)) {
      return null;
    }

    throw error;
  }

  downloadFile(suggestedName, content);

  return {
    name: suggestedName,
  };
};