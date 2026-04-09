import { useEffect, useMemo, useRef, useState } from "react";

import {
  appThemePresets,
  cloneSectionInstance,
  coreSectionBlueprints,
  createSectionInstance,
  createStarterDocument,
  defaultSurfaceStyle,
  type DocumentLayoutSettings,
  layoutPresets,
  normalizeDocument,
  themePresets,
  type CVDocument,
  type DocumentPage,
  type DocumentTypography,
  type LayoutPreset,
  type SectionBlueprint,
  type SectionField,
  type SectionFrame,
  type SectionInstance,
  type SectionItem,
  type SectionPlacement,
  type SectionType,
} from "@cvcreator/document-model";
import { analyzeLayoutSwitch } from "@cvcreator/template-engine";

import { loadPersistedResume, savePersistedResume, type PersistenceMetadata } from "./persistence";
import type { PersistedResumeSnapshot } from "./persistence";

interface CompatibilityNotice {
  summary: string;
}

type SaveState = "hydrating" | "idle" | "saving" | "saved" | "error";

interface PersistenceState extends PersistenceMetadata {
  status: SaveState;
  errorMessage: string | null;
}

const createId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

const stamp = (document: CVDocument): CVDocument => ({
  ...document,
  updatedAt: new Date().toISOString(),
});

const moveEntry = <T,>(entries: T[], fromIndex: number, toIndex: number) => {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
    return entries;
  }

  const nextEntries = [...entries];
  const [entry] = nextEntries.splice(fromIndex, 1);
  nextEntries.splice(toIndex, 0, entry);
  return nextEntries;
};

const createEmptyItem = (section: SectionInstance): SectionItem => {
  const templateFields = section.items[0]?.fields;
  const fields: SectionField[] = templateFields
    ? templateFields.map((field) => ({ ...field, id: createId("field"), value: "" }))
    : [
        {
          id: createId("field"),
          label: "Label",
          value: "",
          visible: true,
          showLabel: true,
        },
      ];

  return {
    id: createId("item"),
    fields,
    markdown: "",
    html: null,
  };
};

const getFallbackSelection = (sections: SectionInstance[]) => sections.find((section) => section.visible)?.id ?? null;

export const useResumeBuilder = () => {
  const [document, setDocument] = useState<CVDocument>(createStarterDocument);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(document.sections[0]?.id ?? null);
  const [compatibilityNotice, setCompatibilityNotice] = useState<CompatibilityNotice | null>(null);
  const [persistence, setPersistence] = useState<PersistenceState>({
    runtime: "browser",
    savedAt: document.updatedAt,
    revisions: [],
    status: "hydrating",
    errorMessage: null,
  });
  const [hasHydrated, setHasHydrated] = useState(false);
  const lastSavedPayloadRef = useRef<string | null>(null);

  const currentSnapshot = useMemo(
    () => ({
      document,
      selectedSectionId,
    }),
    [document, selectedSectionId],
  );
  const serializedSnapshot = useMemo(() => JSON.stringify(currentSnapshot), [currentSnapshot]);

  const selectedTheme = themePresets.find((theme) => theme.id === document.themeId) ?? themePresets[0];
  const selectedAppTheme = appThemePresets.find((theme) => theme.id === document.appThemeId) ?? appThemePresets[0];
  const selectedLayout = layoutPresets.find((layout) => layout.id === document.layoutId) ?? layoutPresets[0];
  const visibleSections = document.sections.filter((section) => section.visible);
  const selectedSection =
    document.sections.find((section) => section.id === selectedSectionId) ?? visibleSections[0] ?? null;

  const librarySections = coreSectionBlueprints.map((blueprint) => ({
    ...blueprint,
    isVisible: document.sections.some((section) => section.type === blueprint.type && section.visible),
  }));
  const hiddenSections = librarySections.filter((section) => !section.isVisible);
  const hiddenCustomSections = document.sections.filter((section) => section.type === "custom" && !section.visible);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const restored = await loadPersistedResume();

        if (!isMounted) {
          return;
        }

        if (restored) {
          const normalizedDocument = normalizeDocument(restored.document);
          const nextSelection = restored.selectedSectionId ?? normalizedDocument.sections[0]?.id ?? null;
          setDocument(normalizedDocument);
          setSelectedSectionId(nextSelection);
          lastSavedPayloadRef.current = JSON.stringify({
            document: normalizedDocument,
            selectedSectionId: nextSelection,
          });
          setPersistence({
            runtime: restored.runtime,
            savedAt: restored.savedAt,
            revisions: restored.revisions,
            status: "saved",
            errorMessage: null,
          });
        } else {
          setPersistence((current) => ({
            ...current,
            status: "idle",
            errorMessage: null,
          }));
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setPersistence((current) => ({
          ...current,
          status: "error",
          errorMessage: error instanceof Error ? error.message : "Could not load saved data.",
        }));
      } finally {
        if (isMounted) {
          setHasHydrated(true);
        }
      }
    };

    void hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (lastSavedPayloadRef.current === serializedSnapshot) {
      return;
    }

    let isCancelled = false;

    setPersistence((current) => ({
      ...current,
      status: "saving",
      errorMessage: null,
    }));

    const saveHandle = window.setTimeout(() => {
      void savePersistedResume(currentSnapshot)
        .then((result) => {
          if (isCancelled) {
            return;
          }

          lastSavedPayloadRef.current = serializedSnapshot;
          setPersistence({
            ...result,
            status: "saved",
            errorMessage: null,
          });
        })
        .catch((error) => {
          if (isCancelled) {
            return;
          }

          setPersistence((current) => ({
            ...current,
            status: "error",
            errorMessage: error instanceof Error ? error.message : "Could not save your document.",
          }));
        });
    }, 700);

    return () => {
      isCancelled = true;
      window.clearTimeout(saveHandle);
    };
  }, [currentSnapshot, hasHydrated, serializedSnapshot]);

  const resetDocument = () => {
    const starter = createStarterDocument();
    setDocument(starter);
    setSelectedSectionId(starter.sections[0]?.id ?? null);
    setCompatibilityNotice(null);
  };

  const selectSection = (sectionId: string) => {
    setSelectedSectionId(sectionId);
  };

  const loadSnapshot = (snapshot: PersistedResumeSnapshot) => {
    const normalizedDocument = normalizeDocument(snapshot.document);
    const nextSelection = snapshot.selectedSectionId ?? normalizedDocument.sections[0]?.id ?? null;

    lastSavedPayloadRef.current = null;
    setDocument(normalizedDocument);
    setSelectedSectionId(nextSelection);
    setCompatibilityNotice(null);
    setPersistence((current) => ({
      ...current,
      status: "idle",
      errorMessage: null,
    }));
  };

  const moveSection = (sectionId: string, targetSectionId: string) => {
    setDocument((current) => {
      const sourceIndex = current.sections.findIndex((section) => section.id === sectionId);
      const targetIndex = current.sections.findIndex((section) => section.id === targetSectionId);

      return stamp({
        ...current,
        sections: moveEntry(current.sections, sourceIndex, targetIndex),
      });
    });
  };

  const moveSectionToEnd = (sectionId: string) => {
    setDocument((current) => {
      const sourceIndex = current.sections.findIndex((section) => section.id === sectionId);

      return stamp({
        ...current,
        sections: moveEntry(current.sections, sourceIndex, current.sections.length - 1),
      });
    });
  };

  const revealSection = (sectionType: SectionType, beforeSectionId?: string) => {
    let nextSelected: string | null = null;

    setDocument((current) => {
      const sections = [...current.sections];
      const existingIndex = sections.findIndex((section) => section.type === sectionType && !section.visible);

      let section: SectionInstance;

      if (existingIndex >= 0) {
        section = { ...sections[existingIndex], visible: true };
        sections[existingIndex] = section;
      } else {
        section = createSectionInstance(sectionType);
        sections.push(section);
      }

      nextSelected = section.id;

      if (beforeSectionId) {
        const sourceIndex = sections.findIndex((entry) => entry.id === section.id);
        const targetIndex = sections.findIndex((entry) => entry.id === beforeSectionId);

        return stamp({
          ...current,
          sections: moveEntry(sections, sourceIndex, targetIndex),
        });
      }

      return stamp({
        ...current,
        sections,
      });
    });

    if (nextSelected) {
      setSelectedSectionId(nextSelected);
    }
  };

  const addCustomSection = (beforeSectionId?: string) => {
    let nextSelected: string | null = null;

    setDocument((current) => {
      const section = createSectionInstance("custom");
      const sections = [...current.sections, section];
      nextSelected = section.id;

      if (beforeSectionId) {
        const sourceIndex = sections.findIndex((entry) => entry.id === section.id);
        const targetIndex = sections.findIndex((entry) => entry.id === beforeSectionId);

        if (targetIndex >= 0) {
          return stamp({
            ...current,
            sections: moveEntry(sections, sourceIndex, targetIndex),
          });
        }
      }

      return stamp({
        ...current,
        sections,
      });
    });

    if (nextSelected) {
      setSelectedSectionId(nextSelected);
    }
  };

  const restoreSection = (sectionId: string) => {
    setDocument((current) =>
      stamp({
        ...current,
        sections: current.sections.map((section) =>
          section.id === sectionId ? { ...section, visible: true } : section,
        ),
      }),
    );

    setSelectedSectionId(sectionId);
  };

  const hideSection = (sectionId: string) => {
    let nextSelection: string | null = null;

    setDocument((current) => {
      const sections = current.sections.map((section) =>
        section.id === sectionId ? { ...section, visible: false } : section,
      );

      nextSelection = getFallbackSelection(sections);

      return stamp({
        ...current,
        sections,
      });
    });

    setSelectedSectionId(nextSelection);
  };

  const duplicateSection = (sectionId: string) => {
    let nextSelected: string | null = null;

    setDocument((current) => {
      const sourceIndex = current.sections.findIndex((section) => section.id === sectionId);

      if (sourceIndex < 0) {
        return current;
      }

      const clone = cloneSectionInstance(current.sections[sourceIndex]);
      nextSelected = clone.id;

      const sections = [...current.sections];
      sections.splice(sourceIndex + 1, 0, clone);

      return stamp({
        ...current,
        sections,
      });
    });

    if (nextSelected) {
      setSelectedSectionId(nextSelected);
    }
  };

  const moveSectionByOffset = (sectionId: string, offset: number) => {
    const visibleIndex = visibleSections.findIndex((section) => section.id === sectionId);
    const target = visibleSections[visibleIndex + offset];

    if (!target) {
      return;
    }

    moveSection(sectionId, target.id);
  };

  const updateTitle = (sectionId: string, title: string) => {
    setDocument((current) =>
      stamp({
        ...current,
        sections: current.sections.map((section) =>
          section.id === sectionId ? { ...section, title } : section,
        ),
      }),
    );
  };

  const updatePlacement = (sectionId: string, placement: SectionPlacement) => {
    setDocument((current) =>
      stamp({
        ...current,
        sections: current.sections.map((section) =>
          section.id === sectionId ? { ...section, placement } : section,
        ),
      }),
    );
  };

  const updateSectionMarkdown = (sectionId: string, markdown: string) => {
    setDocument((current) =>
      stamp({
        ...current,
        sections: current.sections.map((section) =>
          section.id === sectionId ? { ...section, markdown } : section,
        ),
      }),
    );
  };

  const updateSectionHtml = (sectionId: string, html: string) => {
    setDocument((current) =>
      stamp({
        ...current,
        sections: current.sections.map((section) =>
          section.id === sectionId ? { ...section, html } : section,
        ),
      }),
    );
  };

  const updatePhotoUrl = (sectionId: string, photoUrl: string | null) => {
    setDocument((current) =>
      stamp({
        ...current,
        sections: current.sections.map((section) =>
          section.id === sectionId ? { ...section, photoUrl } : section,
        ),
      }),
    );
  };

  const addItem = (sectionId: string) => {
    setDocument((current) =>
      stamp({
        ...current,
        sections: current.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                items: [...section.items, createEmptyItem(section)],
              }
            : section,
        ),
      }),
    );
  };

  const removeItem = (sectionId: string, itemId: string) => {
    setDocument((current) =>
      stamp({
        ...current,
        sections: current.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                items: section.items.filter((item) => item.id !== itemId),
              }
            : section,
        ),
      }),
    );
  };

  const duplicateItem = (sectionId: string, itemId: string) => {
    setDocument((current) =>
      stamp({
        ...current,
        sections: current.sections.map((section) => {
          if (section.id !== sectionId) {
            return section;
          }

          const sourceIndex = section.items.findIndex((item) => item.id === itemId);

          if (sourceIndex < 0) {
            return section;
          }

          const sourceItem = section.items[sourceIndex];
          const clone: SectionItem = {
            ...sourceItem,
            id: createId("item"),
            fields: sourceItem.fields.map((field) => ({ ...field, id: createId("field") })),
          };
          const items = [...section.items];
          items.splice(sourceIndex + 1, 0, clone);

          return {
            ...section,
            items,
          };
        }),
      }),
    );
  };

  const moveItem = (sectionId: string, itemId: string, targetItemId: string) => {
    setDocument((current) =>
      stamp({
        ...current,
        sections: current.sections.map((section) => {
          if (section.id !== sectionId) {
            return section;
          }

          const sourceIndex = section.items.findIndex((item) => item.id === itemId);
          const targetIndex = section.items.findIndex((item) => item.id === targetItemId);

          return {
            ...section,
            items: moveEntry(section.items, sourceIndex, targetIndex),
          };
        }),
      }),
    );
  };

  const moveItemByOffset = (sectionId: string, itemId: string, offset: number) => {
    const section = document.sections.find((entry) => entry.id === sectionId);
    const sourceIndex = section?.items.findIndex((item) => item.id === itemId) ?? -1;
    const targetItem = sourceIndex >= 0 ? section?.items[sourceIndex + offset] : undefined;

    if (!targetItem) {
      return;
    }

    moveItem(sectionId, itemId, targetItem.id);
  };

  const updateItem = (sectionId: string, itemId: string, apply: (item: SectionItem) => SectionItem) => {
    setDocument((current) =>
      stamp({
        ...current,
        sections: current.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                items: section.items.map((item) => (item.id === itemId ? apply(item) : item)),
              }
            : section,
        ),
      }),
    );
  };

  const updateFieldValue = (sectionId: string, itemId: string, fieldId: string, value: string) => {
    updateItem(sectionId, itemId, (item) => ({
      ...item,
      fields: item.fields.map((field) => (field.id === fieldId ? { ...field, value } : field)),
    }));
  };

  const updateFieldLabel = (sectionId: string, itemId: string, fieldId: string, label: string) => {
    updateItem(sectionId, itemId, (item) => ({
      ...item,
      fields: item.fields.map((field) => (field.id === fieldId ? { ...field, label } : field)),
    }));
  };

  const setFieldVisibility = (sectionId: string, itemId: string, fieldId: string, visible: boolean) => {
    updateItem(sectionId, itemId, (item) => ({
      ...item,
      fields: item.fields.map((field) => (field.id === fieldId ? { ...field, visible } : field)),
    }));
  };

  const setFieldLabelVisibility = (
    sectionId: string,
    itemId: string,
    fieldId: string,
    showLabel: boolean,
  ) => {
    updateItem(sectionId, itemId, (item) => ({
      ...item,
      fields: item.fields.map((field) => (field.id === fieldId ? { ...field, showLabel } : field)),
    }));
  };

  const addField = (sectionId: string, itemId: string) => {
    updateItem(sectionId, itemId, (item) => ({
      ...item,
      fields: [
        ...item.fields,
        {
          id: createId("field"),
          label: "Label",
          value: "",
          visible: true,
          showLabel: true,
        },
      ],
    }));
  };

  const removeField = (sectionId: string, itemId: string, fieldId: string) => {
    updateItem(sectionId, itemId, (item) => ({
      ...item,
      fields: item.fields.filter((field) => field.id !== fieldId),
    }));
  };

  const updateItemMarkdown = (sectionId: string, itemId: string, markdown: string) => {
    setDocument((current) =>
      stamp({
        ...current,
        sections: current.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                items: section.items.map((item) => (item.id === itemId ? { ...item, markdown } : item)),
              }
            : section,
        ),
      }),
    );
  };

  const updateItemHtml = (sectionId: string, itemId: string, html: string) => {
    setDocument((current) =>
      stamp({
        ...current,
        sections: current.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                items: section.items.map((item) => (item.id === itemId ? { ...item, html } : item)),
              }
            : section,
        ),
      }),
    );
  };

  const setThemeId = (themeId: string) => {
    setDocument((current) => stamp({ ...current, themeId }));
  };

  const setAppThemeId = (appThemeId: string) => {
    setDocument((current) => stamp({ ...current, appThemeId }));
  };

  const setDensity = (density: number) => {
    setDocument((current) => stamp({ ...current, density }));
  };

  const updateTypography = (patch: Partial<DocumentTypography>) => {
    setDocument((current) =>
      stamp({
        ...current,
        typography: {
          ...current.typography,
          ...patch,
        },
      }),
    );
  };

  const updatePage = (patch: Partial<DocumentPage>) => {
    setDocument((current) =>
      stamp({
        ...current,
        page: {
          ...current.page,
          ...patch,
        },
      }),
    );
  };

  const updateSectionFrame = (sectionId: string, patch: Partial<SectionFrame>) => {
    setDocument((current) =>
      stamp({
        ...current,
        sections: current.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                frame: {
                  ...section.frame,
                  ...patch,
                },
              }
            : section,
        ),
      }),
    );
  };

  const updateLayoutSettings = (patch: Partial<DocumentLayoutSettings>) => {
    setDocument((current) =>
      stamp({
        ...current,
        layoutId: "custom-layout",
        layoutSettings: {
          ...current.layoutSettings,
          ...patch,
          surfaceStyle: {
            ...current.layoutSettings.surfaceStyle,
            ...patch.surfaceStyle,
          },
        },
      }),
    );
  };

  const setAccentColor = (accentColorOverride: string | null) => {
    setDocument((current) => stamp({ ...current, accentColorOverride }));
  };

  const setLayoutId = (layoutId: LayoutPreset["id"]) => {
    const nextLayout = layoutPresets.find((layout) => layout.id === layoutId);

    if (!nextLayout || nextLayout.id === document.layoutId) {
      return;
    }

    const currentLayout = layoutPresets.find((layout) => layout.id === document.layoutId) ?? layoutPresets[0];
    const analysis = analyzeLayoutSwitch(document, currentLayout, nextLayout);

    if (analysis.warnings.length > 0) {
      const message = `${analysis.warnings.join(" ")} Continue and discard incompatible custom HTML?`;

      if (!window.confirm(message)) {
        return;
      }
    }

    setDocument((current) =>
      stamp({
        ...current,
        layoutId,
        layoutSettings: {
          ...current.layoutSettings,
          ...nextLayout,
          surfaceStyle: {
            ...defaultSurfaceStyle,
            ...nextLayout.surfaceStyle,
          },
        },
        sections: current.sections.map((section) =>
          analysis.sectionsLosingHtml.includes(section.id) ? { ...section, html: null } : section,
        ),
      }),
    );

    setCompatibilityNotice(
      analysis.warnings.length > 0
        ? {
            summary: analysis.warnings.join(" "),
          }
        : null,
    );
  };

  return {
    document,
    selectedSectionId,
    selectedSection,
    selectedTheme,
    selectedAppTheme,
    selectedLayout,
    visibleSections,
    librarySections,
    hiddenSections,
    hiddenCustomSections,
    appThemePresets,
    themePresets,
    layoutPresets,
    compatibilityNotice,
    persistence,
    actions: {
      addCustomSection,
      addField,
      addItem,
      dismissCompatibilityNotice: () => setCompatibilityNotice(null),
      duplicateSection,
      duplicateItem,
      hideSection,
      loadSnapshot,
      moveItem,
      moveItemByOffset,
      moveSection,
      moveSectionByOffset,
      moveSectionToEnd,
      removeField,
      removeItem,
      resetDocument,
      revealSection,
      restoreSection,
      selectSection,
      setAccentColor,
      setAppThemeId,
      setDensity,
      setFieldLabelVisibility,
      setFieldVisibility,
      setLayoutId,
      setThemeId,
      updateFieldLabel,
      updateLayoutSettings,
      updatePage,
      updateSectionFrame,
      updateTypography,
      updateFieldValue,
      updateItemHtml,
      updateItemMarkdown,
      updatePhotoUrl,
      updatePlacement,
      updateSectionHtml,
      updateSectionMarkdown,
      updateTitle,
    },
  };
};

export type ResumeBuilder = ReturnType<typeof useResumeBuilder>;
export type LibrarySection = SectionBlueprint & { isVisible: boolean };
