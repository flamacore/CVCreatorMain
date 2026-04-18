import type { CSSProperties, KeyboardEvent, MouseEvent, PointerEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { renderExportDocument } from "@cvcreator/rendering";

import { CommandBar } from "../features/command-bar/CommandBar";
import { ContextMenu, type ContextMenuState } from "../features/context-menu/ContextMenu";
import { EditorWorkspace } from "../features/editor/EditorWorkspace";
import { exportPdfFromHtml } from "../features/export/exportPdf";
import { InspectorPanel } from "../features/inspector/InspectorPanel";
import { PreviewPane } from "../features/preview/PreviewPane";
import { loadResumeDocumentFile, saveResumeDocumentFile, type ResumeDocumentFileReference } from "../features/state/documentFiles";
import type { ResumeBuilder } from "../features/state/useResumeBuilder";

interface AppShellProps {
  builder: ResumeBuilder;
}

type WorkspacePane = "studio" | "inspector";

interface WorkspacePaneWidths {
  studio: number;
  inspector: number;
}

interface ActivePaneResize {
  pane: WorkspacePane;
  startX: number;
  startStudioWidth: number;
  startInspectorWidth: number;
}

const DEFAULT_WORKSPACE_PANE_WIDTHS: WorkspacePaneWidths = {
  studio: 296,
  inspector: 368,
};

const WORKSPACE_PANE_STORAGE_KEY = "cvcreator:workspace-pane-widths";
const WORKSPACE_RESIZER_WIDTH = 12;
const WORKSPACE_PREVIEW_MIN_WIDTH = 480;
const WORKSPACE_STUDIO_MIN_WIDTH = 240;
const WORKSPACE_INSPECTOR_MIN_WIDTH = 288;

const clampValue = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const clampPaneWidths = (
  widths: WorkspacePaneWidths,
  containerWidth: number,
): WorkspacePaneWidths => {
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) {
    return widths;
  }

  const sideBudget = Math.max(
    containerWidth - WORKSPACE_PREVIEW_MIN_WIDTH - WORKSPACE_RESIZER_WIDTH * 2,
    WORKSPACE_STUDIO_MIN_WIDTH + WORKSPACE_INSPECTOR_MIN_WIDTH,
  );
  const studio = clampValue(
    widths.studio,
    WORKSPACE_STUDIO_MIN_WIDTH,
    Math.max(WORKSPACE_STUDIO_MIN_WIDTH, sideBudget - WORKSPACE_INSPECTOR_MIN_WIDTH),
  );
  const inspector = clampValue(
    widths.inspector,
    WORKSPACE_INSPECTOR_MIN_WIDTH,
    Math.max(WORKSPACE_INSPECTOR_MIN_WIDTH, sideBudget - studio),
  );

  return {
    studio,
    inspector,
  };
};

const readStoredPaneWidths = (): WorkspacePaneWidths => {
  if (typeof window === "undefined") {
    return DEFAULT_WORKSPACE_PANE_WIDTHS;
  }

  try {
    const rawValue = window.localStorage.getItem(WORKSPACE_PANE_STORAGE_KEY);

    if (!rawValue) {
      return DEFAULT_WORKSPACE_PANE_WIDTHS;
    }

    const parsed = JSON.parse(rawValue) as Partial<WorkspacePaneWidths>;

    if (typeof parsed.studio !== "number" || typeof parsed.inspector !== "number") {
      return DEFAULT_WORKSPACE_PANE_WIDTHS;
    }

    return {
      studio: parsed.studio,
      inspector: parsed.inspector,
    };
  } catch {
    return DEFAULT_WORKSPACE_PANE_WIDTHS;
  }
};

const getActionErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return fallback;
};

export const AppShell = ({ builder }: AppShellProps) => {
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const [activeFile, setActiveFile] = useState<ResumeDocumentFileReference | null>(null);
  const [paneWidths, setPaneWidths] = useState<WorkspacePaneWidths>(() => readStoredPaneWidths());
  const [activePaneResize, setActivePaneResize] = useState<WorkspacePane | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const paneResizeRef = useRef<ActivePaneResize | null>(null);

  const cvAccentColor = builder.document.accentColorOverride ?? builder.selectedTheme.tokens.accent;
  const shellStyle = {
    "--canvas-background": builder.selectedAppTheme.tokens.canvasBackground,
    "--surface": builder.selectedAppTheme.tokens.surface,
    "--surface-alt": builder.selectedAppTheme.tokens.surfaceAlt,
    "--preview-background": builder.selectedAppTheme.tokens.previewBackground,
    "--text-strong": builder.selectedAppTheme.tokens.textStrong,
    "--text-muted": builder.selectedAppTheme.tokens.textMuted,
    "--accent": builder.selectedAppTheme.tokens.accent,
    "--border": builder.selectedAppTheme.tokens.border,
    "--cv-surface": builder.selectedTheme.tokens.surface,
    "--cv-surface-alt": builder.selectedTheme.tokens.surfaceAlt,
    "--cv-preview-background": builder.selectedTheme.tokens.previewBackground,
    "--cv-text-strong": builder.selectedTheme.tokens.textStrong,
    "--cv-text-muted": builder.selectedTheme.tokens.textMuted,
    "--cv-accent": cvAccentColor,
    "--cv-border": builder.selectedTheme.tokens.border,
    "--density-scale": String(builder.document.density),
    "--app-font-family": builder.document.typography.uiFontFamily,
    "--body-font-family": builder.document.typography.bodyFontFamily,
    "--heading-font-family": builder.document.typography.headingFontFamily,
    "--body-font-size": `${builder.document.typography.baseFontSize}px`,
    "--role-font-size": `${builder.document.typography.roleFontSize}px`,
    "--title-font-size": `${builder.document.typography.titleFontSize}px`,
    "--section-title-font-size": `${builder.document.typography.sectionTitleFontSize}px`,
    "--line-height": String(builder.document.typography.lineHeight),
    "--workspace-studio-width": `${paneWidths.studio}px`,
    "--workspace-inspector-width": `${paneWidths.inspector}px`,
    "--workspace-preview-min-width": `${WORKSPACE_PREVIEW_MIN_WIDTH}px`,
    "--workspace-resizer-width": `${WORKSPACE_RESIZER_WIDTH}px`,
  } as CSSProperties;

  useEffect(() => {
    const syncPaneWidths = () => {
      const containerWidth = workspaceRef.current?.clientWidth ?? 0;

      setPaneWidths((current) => {
        const next = clampPaneWidths(current, containerWidth);

        return next.studio === current.studio && next.inspector === current.inspector ? current : next;
      });
    };

    syncPaneWidths();
    window.addEventListener("resize", syncPaneWidths);

    return () => {
      window.removeEventListener("resize", syncPaneWidths);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(WORKSPACE_PANE_STORAGE_KEY, JSON.stringify(paneWidths));
  }, [paneWidths]);

  useEffect(() => {
    const finishResize = () => {
      if (!paneResizeRef.current) {
        return;
      }

      paneResizeRef.current = null;
      setActivePaneResize(null);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      const resizeState = paneResizeRef.current;
      const containerWidth = workspaceRef.current?.clientWidth ?? 0;

      if (!resizeState || containerWidth <= 0) {
        return;
      }

      const delta = event.clientX - resizeState.startX;

      setPaneWidths((current) => {
        const next =
          resizeState.pane === "studio"
            ? clampPaneWidths(
                {
                  studio: resizeState.startStudioWidth + delta,
                  inspector: resizeState.startInspectorWidth,
                },
                containerWidth,
              )
            : clampPaneWidths(
                {
                  studio: resizeState.startStudioWidth,
                  inspector: resizeState.startInspectorWidth - delta,
                },
                containerWidth,
              );

        return next.studio === current.studio && next.inspector === current.inspector ? current : next;
      });
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishResize);
    window.addEventListener("pointercancel", finishResize);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishResize);
      window.removeEventListener("pointercancel", finishResize);
    };
  }, []);

  const updatePaneWidth = (pane: WorkspacePane, delta: number) => {
    const containerWidth = workspaceRef.current?.clientWidth ?? 0;

    setPaneWidths((current) =>
      clampPaneWidths(
        {
          studio: pane === "studio" ? current.studio + delta : current.studio,
          inspector: pane === "inspector" ? current.inspector + delta : current.inspector,
        },
        containerWidth,
      ),
    );
  };

  const handlePaneResizeStart = (event: PointerEvent<HTMLDivElement>, pane: WorkspacePane) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    paneResizeRef.current = {
      pane,
      startX: event.clientX,
      startStudioWidth: paneWidths.studio,
      startInspectorWidth: paneWidths.inspector,
    };
    setActivePaneResize(pane);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handlePaneResizeKeyDown = (event: KeyboardEvent<HTMLDivElement>, pane: WorkspacePane) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();

    const step = event.shiftKey ? 48 : 24;

    if (pane === "studio") {
      updatePaneWidth("studio", event.key === "ArrowRight" ? step : -step);
      return;
    }

    updatePaneWidth("inspector", event.key === "ArrowLeft" ? step : -step);
  };

  const resetPaneWidth = (pane: WorkspacePane) => {
    const containerWidth = workspaceRef.current?.clientWidth ?? 0;

    setPaneWidths((current) =>
      clampPaneWidths(
        {
          studio: pane === "studio" ? DEFAULT_WORKSPACE_PANE_WIDTHS.studio : current.studio,
          inspector: pane === "inspector" ? DEFAULT_WORKSPACE_PANE_WIDTHS.inspector : current.inspector,
        },
        containerWidth,
      ),
    );
  };

  const openSectionMenu = (event: MouseEvent<HTMLDivElement>, sectionId: string) => {
    const visibleIndex = builder.visibleSections.findIndex((section) => section.id === sectionId);
    const section = builder.document.sections.find((entry) => entry.id === sectionId);

    if (!section) {
      return;
    }

    builder.actions.selectSection(sectionId);

    setMenu({
      x: event.clientX,
      y: event.clientY,
      items: [
        {
          label: "Move up",
          disabled: visibleIndex <= 0,
          onSelect: () => builder.actions.moveSectionByOffset(sectionId, -1),
        },
        {
          label: "Move down",
          disabled: visibleIndex < 0 || visibleIndex === builder.visibleSections.length - 1,
          onSelect: () => builder.actions.moveSectionByOffset(sectionId, 1),
        },
        {
          label: section.placement === "main" ? "Move to sidebar" : "Move to main column",
          onSelect: () => builder.actions.updatePlacement(sectionId, section.placement === "main" ? "sidebar" : "main"),
        },
        {
          label: "Duplicate section",
          onSelect: () => builder.actions.duplicateSection(sectionId),
        },
        {
          label: "Hide section",
          destructive: true,
          onSelect: () => builder.actions.hideSection(sectionId),
        },
      ],
    });
  };

  const openItemMenu = (event: MouseEvent<HTMLDivElement>, sectionId: string, itemId: string) => {
    const section = builder.document.sections.find((entry) => entry.id === sectionId);
    const itemIndex = section?.items.findIndex((item) => item.id === itemId) ?? -1;

    if (!section || itemIndex < 0) {
      return;
    }

    setMenu({
      x: event.clientX,
      y: event.clientY,
      items: [
        {
          label: "Move entry up",
          disabled: itemIndex <= 0,
          onSelect: () => builder.actions.moveItemByOffset(sectionId, itemId, -1),
        },
        {
          label: "Move entry down",
          disabled: itemIndex === section.items.length - 1,
          onSelect: () => builder.actions.moveItemByOffset(sectionId, itemId, 1),
        },
        {
          label: "Duplicate entry",
          onSelect: () => builder.actions.duplicateItem(sectionId, itemId),
        },
        {
          label: "Delete entry",
          destructive: true,
          onSelect: () => builder.actions.removeItem(sectionId, itemId),
        },
      ],
    });
  };

  const downloadFile = (filename: string, content: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    downloadFile(
      `${builder.document.title.replace(/\s+/g, "-").toLowerCase() || "resume"}.json`,
      JSON.stringify(builder.document, null, 2),
      "application/json",
    );
  };

  const exportHtml = () => {
    const html = renderExportDocument(builder.document, builder.selectedTheme, builder.selectedLayout);
    downloadFile(
      `${builder.document.title.replace(/\s+/g, "-").toLowerCase() || "resume"}.html`,
      html,
      "text/html",
    );
  };

  const exportPdf = async () => {
    try {
      const html = renderExportDocument(builder.document, builder.selectedTheme, builder.selectedLayout);
      await exportPdfFromHtml(html, builder.document.title);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "PDF export failed.");
    }
  };

  const saveDocument = async () => {
    try {
      const nextFile = await saveResumeDocumentFile(
        {
          document: builder.document,
          selectedSectionId: builder.selectedSectionId,
        },
        activeFile,
      );

      if (nextFile) {
        setActiveFile(nextFile);
      }
    } catch (error) {
      window.alert(getActionErrorMessage(error, "Could not save this CV."));
    }
  };

  const loadDocument = async () => {
    try {
      const loaded = await loadResumeDocumentFile();

      if (!loaded) {
        return;
      }

      builder.actions.loadSnapshot(loaded.snapshot);
      setActiveFile(loaded.file);
    } catch (error) {
      window.alert(getActionErrorMessage(error, "Could not load this CV."));
    }
  };

  const resetDocument = () => {
    builder.actions.resetDocument();
    setActiveFile(null);
  };

  return (
    <div className="shell" style={shellStyle}>
      <CommandBar
        accentColor={cvAccentColor}
        appThemePresets={builder.appThemePresets}
        density={builder.document.density}
        fileLabel={activeFile?.name ?? "Unsaved CV"}
        layoutPresets={builder.layoutPresets}
        onAppThemeChange={builder.actions.setAppThemeId}
        onAccentColorChange={(color) => builder.actions.setAccentColor(color)}
        onDensityChange={builder.actions.setDensity}
        onExportHtml={exportHtml}
        onExportJson={exportJson}
        onExportPdf={() => {
          void exportPdf();
        }}
        onLoadDocument={() => {
          void loadDocument();
        }}
        onLayoutChange={builder.actions.setLayoutId}
        onReset={resetDocument}
        onSaveDocument={() => {
          void saveDocument();
        }}
        onThemeChange={builder.actions.setThemeId}
        selectedAppThemeId={builder.document.appThemeId}
        selectedLayoutId={builder.document.layoutId}
        selectedThemeId={builder.document.themeId}
        themePresets={builder.themePresets}
        title={builder.document.title}
        updatedAt={builder.document.updatedAt}
      />

      {builder.compatibilityNotice ? (
        <div className="notice-banner">
          <span>{builder.compatibilityNotice.summary}</span>
          <button onClick={builder.actions.dismissCompatibilityNotice} type="button">
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="workspace-grid" ref={workspaceRef}>
        <div className="workspace-pane workspace-pane-studio">
          <EditorWorkspace
            document={builder.document}
            hiddenCustomSections={builder.hiddenCustomSections}
            hiddenSections={builder.hiddenSections}
            onAddCustomSection={builder.actions.addCustomSection}
            onContextMenuOpen={openSectionMenu}
            onDensityChange={builder.actions.setDensity}
            onHideSection={builder.actions.hideSection}
            onMoveSection={builder.actions.moveSection}
            onMoveSectionToEnd={builder.actions.moveSectionToEnd}
            onRevealSection={builder.actions.revealSection}
            onRestoreSection={builder.actions.restoreSection}
            onSelect={builder.actions.selectSection}
            onUpdateLayoutSettings={builder.actions.updateLayoutSettings}
            onUpdatePage={builder.actions.updatePage}
            onUpdateTypography={builder.actions.updateTypography}
            sections={builder.visibleSections}
            selectedSectionId={builder.selectedSection?.id ?? null}
            themePreviewBackground={builder.selectedTheme.tokens.previewBackground}
          />
        </div>

        <div
          aria-label="Resize studio panel"
          aria-orientation="vertical"
          aria-valuemax={640}
          aria-valuemin={WORKSPACE_STUDIO_MIN_WIDTH}
          aria-valuenow={Math.round(paneWidths.studio)}
          className="workspace-resizer workspace-resizer-left"
          data-active={activePaneResize === "studio"}
          onDoubleClick={() => resetPaneWidth("studio")}
          onKeyDown={(event) => handlePaneResizeKeyDown(event, "studio")}
          onPointerDown={(event) => handlePaneResizeStart(event, "studio")}
          role="separator"
          tabIndex={0}
          title="Drag to resize the studio panel. Double-click to reset."
        />

        <div className="workspace-pane workspace-pane-preview">
          <PreviewPane
            document={builder.document}
            layout={builder.selectedLayout}
            onContextMenuOpen={openSectionMenu}
            onSelect={builder.actions.selectSection}
            selectedSectionId={builder.selectedSection?.id ?? null}
          />
        </div>

        <div
          aria-label="Resize inspector panel"
          aria-orientation="vertical"
          aria-valuemax={720}
          aria-valuemin={WORKSPACE_INSPECTOR_MIN_WIDTH}
          aria-valuenow={Math.round(paneWidths.inspector)}
          className="workspace-resizer workspace-resizer-right"
          data-active={activePaneResize === "inspector"}
          onDoubleClick={() => resetPaneWidth("inspector")}
          onKeyDown={(event) => handlePaneResizeKeyDown(event, "inspector")}
          onPointerDown={(event) => handlePaneResizeStart(event, "inspector")}
          role="separator"
          tabIndex={0}
          title="Drag to resize the inspector panel. Double-click to reset."
        />

        <div className="workspace-pane workspace-pane-inspector">
          <InspectorPanel
            onAddField={builder.actions.addField}
            onAddItem={builder.actions.addItem}
            onDuplicateItem={builder.actions.duplicateItem}
            onFieldChange={builder.actions.updateFieldValue}
            onFieldLabelChange={builder.actions.updateFieldLabel}
            onFieldLabelVisibilityChange={builder.actions.setFieldLabelVisibility}
            onFieldVisibilityChange={builder.actions.setFieldVisibility}
            onItemHtmlChange={builder.actions.updateItemHtml}
            onItemContextMenuOpen={openItemMenu}
            onItemMarkdownChange={builder.actions.updateItemMarkdown}
            onMoveItem={builder.actions.moveItem}
            onPhotoUrlChange={builder.actions.updatePhotoUrl}
            onPlacementChange={builder.actions.updatePlacement}
            onRemoveField={builder.actions.removeField}
            onRemoveItem={builder.actions.removeItem}
            onSectionFrameChange={builder.actions.updateSectionFrame}
            onSectionHtmlChange={builder.actions.updateSectionHtml}
            onSectionMarkdownChange={builder.actions.updateSectionMarkdown}
            onTitleChange={builder.actions.updateTitle}
            section={builder.selectedSection}
          />
        </div>
      </div>

      <ContextMenu menu={menu} onClose={() => setMenu(null)} />
    </div>
  );
};
