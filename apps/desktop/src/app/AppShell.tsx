import type { CSSProperties, MouseEvent } from "react";
import { useState } from "react";

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
  } as CSSProperties;

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

      <div className="workspace-grid">
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

        <PreviewPane
          document={builder.document}
          layout={builder.selectedLayout}
          onContextMenuOpen={openSectionMenu}
          onSelect={builder.actions.selectSection}
          selectedSectionId={builder.selectedSection?.id ?? null}
        />

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

      <ContextMenu menu={menu} onClose={() => setMenu(null)} />
    </div>
  );
};
