import type { CSSProperties } from "react";

import type { CVDocument, LayoutPreset, SectionInstance } from "@cvcreator/document-model";

import { renderDocumentSections } from "@cvcreator/rendering";

interface PreviewPaneProps {
  document: CVDocument;
  layout: LayoutPreset;
  selectedSectionId: string | null;
  onSelect: (sectionId: string) => void;
  onContextMenuOpen: (event: React.MouseEvent<HTMLDivElement>, sectionId: string) => void;
}

const getStructuredFieldValue = (section: SectionInstance, index: number, fallback = "") => {
  const field = section.items[0]?.fields[index];

  if (!field || field.visible === false || !field.value.trim()) {
    return fallback;
  }

  return field.value;
};

const renderTitleBlock = (section: SectionInstance, fallbackName: string) => {
  const name = getStructuredFieldValue(section, 0, fallbackName);
  const role = getStructuredFieldValue(section, 1, "");
  const summary = section.markdown || section.items[0]?.markdown || "";

  return {
    name,
    role,
    summary,
  };
};

const getRadius = (cornerStyle: CVDocument["layoutSettings"]["surfaceStyle"]["cornerStyle"], zoom: number) => {
  switch (cornerStyle) {
    case "square":
      return 0;
    case "soft":
      return 10 * zoom;
    case "rounded":
    default:
      return 20 * zoom;
  }
};

const getShadow = (shadowStyle: CVDocument["layoutSettings"]["surfaceStyle"]["shadowStyle"], zoom: number) => {
  switch (shadowStyle) {
    case "lifted":
      return `0 ${12 * zoom}px ${28 * zoom}px rgba(15, 23, 42, 0.16)`;
    case "soft":
      return `0 ${6 * zoom}px ${16 * zoom}px rgba(15, 23, 42, 0.1)`;
    case "none":
    default:
      return "none";
  }
};

const getBorderStyle = (
  borderMode: CVDocument["layoutSettings"]["surfaceStyle"]["borderMode"],
  zoom: number,
): CSSProperties => {
  const stroke = `${Math.max(1, Math.round(zoom))}px solid var(--cv-border)`;

  switch (borderMode) {
    case "frameless":
      return { border: "none" };
    case "top":
      return { border: "none", borderTop: stroke };
    case "bottom":
      return { border: "none", borderBottom: stroke };
    case "left":
      return { border: "none", borderLeft: stroke };
    case "right":
      return { border: "none", borderRight: stroke };
    case "full":
    default:
      return { border: stroke };
  }
};

export const PreviewPane = ({
  document,
  layout,
  selectedSectionId,
  onSelect,
  onContextMenuOpen,
}: PreviewPaneProps) => {
  const layoutSettings = document.layoutSettings;
  const titleSection = document.sections.find(
    (section) => section.visible && section.type === "title-summary",
  );
  const photoSection = document.sections.find(
    (section) => section.visible && section.type === "photo" && section.photoUrl,
  );
  const titleBlock = titleSection ? renderTitleBlock(titleSection, document.title || "Your name") : null;
  const renderedSections = renderDocumentSections(document).filter(
    (section) =>
      section.type !== "title-summary" && !(photoSection && layoutSettings.heroPhotoMode !== "hidden" && section.type === "photo"),
  );

  const mainSections =
    layoutSettings.columns === 1
      ? renderedSections
      : renderedSections.filter((section) => section.placement === "main");
  const sidebarSections =
    layoutSettings.columns === 1 ? [] : renderedSections.filter((section) => section.placement === "sidebar");
  const pageStyle = {
    width: `${210 * document.page.zoom}mm`,
    minHeight: `${297 * document.page.zoom}mm`,
    padding: `${document.page.padding * document.page.zoom}px`,
    background: document.page.backgroundColorOverride ?? "var(--cv-preview-background)",
    color: "var(--cv-text-strong)",
    fontFamily: document.typography.bodyFontFamily,
    fontSize: `${document.typography.baseFontSize * document.page.zoom}px`,
    lineHeight: String(document.typography.lineHeight),
    ["--structured-field-gap" as string]: `${layoutSettings.structuredFieldGap * document.page.zoom}px`,
    ["--paragraph-space-before" as string]: `${layoutSettings.paragraphSpacingBefore * document.page.zoom}px`,
    ["--paragraph-space-after" as string]: `${layoutSettings.paragraphSpacingAfter * document.page.zoom}px`,
  } as CSSProperties;
  const heroTitleStyle = {
    fontFamily: document.typography.headingFontFamily,
    fontSize: `${document.typography.titleFontSize * document.page.zoom}px`,
  };
  const sectionTitleStyle = {
    fontFamily: document.typography.headingFontFamily,
    fontSize: `${document.typography.sectionTitleFontSize * document.page.zoom}px`,
  };
  const previewName = document.layoutId === "custom-layout" ? "Custom Layout" : layout.name;
  const sidebarFraction = Math.min(Math.max(layoutSettings.sidebarWidth, 0.18), 0.48);
  const mainFraction = Math.max(0.52, 1 - sidebarFraction);
  const gridStyle: CSSProperties =
    layoutSettings.columns === 1
      ? { gap: `${layoutSettings.sectionGap * document.page.zoom}px` }
      : {
          gap: `${layoutSettings.sectionGap * document.page.zoom}px`,
          gridTemplateColumns:
            layoutSettings.sidebarPosition === "left"
              ? `minmax(0, ${sidebarFraction.toFixed(2)}fr) minmax(0, ${mainFraction.toFixed(2)}fr)`
              : `minmax(0, ${mainFraction.toFixed(2)}fr) minmax(0, ${sidebarFraction.toFixed(2)}fr)`,
        };

  const heroPhotoSize = layoutSettings.heroPhotoSize * document.page.zoom;
  const heroHasPhoto = Boolean(photoSection?.photoUrl) && layoutSettings.heroPhotoMode !== "hidden";
  const heroStyle: CSSProperties = {
    display: "flex",
    flexDirection: layoutSettings.heroPhotoMode === "stacked" ? "column" : "row",
    alignItems: layoutSettings.heroPhotoMode === "inline" ? "center" : "flex-start",
    justifyContent: "space-between",
    gap: `${Math.max(12, layoutSettings.sectionGap * document.page.zoom)}px`,
  };

  const heroContentStyle: CSSProperties = {
    flex: "1 1 auto",
    minWidth: 0,
    lineHeight: String(document.typography.lineHeight * (titleSection?.frame.lineHeightMultiplier ?? 1)),
  };

  const heroPhotoFrameStyle: CSSProperties = {
    width: `${heroPhotoSize}px`,
    minWidth: `${heroPhotoSize}px`,
    maxWidth: layoutSettings.heroPhotoMode === "stacked" ? `${heroPhotoSize * 1.2}px` : `${heroPhotoSize}px`,
  };

  const sectionSurfaceBase: CSSProperties = {
    ...getBorderStyle(layoutSettings.surfaceStyle.borderMode, document.page.zoom),
    borderRadius: `${getRadius(layoutSettings.surfaceStyle.cornerStyle, document.page.zoom)}px`,
    boxShadow: getShadow(layoutSettings.surfaceStyle.shadowStyle, document.page.zoom),
    background: "color-mix(in srgb, var(--cv-surface) 90%, white)",
  };

  const renderSection = (section: (typeof renderedSections)[number]) => (
    <div
      key={section.id}
      className={`preview-section${selectedSectionId === section.id ? " selected" : ""}`}
      style={{
        ...sectionSurfaceBase,
        minHeight: `${section.frame.minHeight * document.page.zoom}px`,
        padding: `${section.frame.padding * document.page.zoom}px`,
        fontSize: `${document.typography.baseFontSize * section.frame.fontScale * document.page.zoom}px`,
        lineHeight: String(document.typography.lineHeight * section.frame.lineHeightMultiplier),
      }}
      onClick={() => onSelect(section.id)}
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenuOpen(event, section.id);
      }}
      role="button"
      tabIndex={0}
    >
      <h3 style={sectionTitleStyle}>{section.title}</h3>
      <div dangerouslySetInnerHTML={{ __html: section.html }} />
    </div>
  );

  return (
    <section className="panel preview-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Preview</p>
          <h2>{previewName} · A4</h2>
        </div>
      </div>

      <div className="preview-stage">
        <div className="preview-page" style={pageStyle}>
          {titleBlock ? (
            <header className={`preview-hero preview-hero-${layoutSettings.heroPhotoMode}`} style={heroStyle}>
              <div className="preview-hero-copy" style={heroContentStyle}>
                <h1 style={heroTitleStyle}>{titleBlock.name}</h1>
                {titleBlock.role ? <p className="preview-role">{titleBlock.role}</p> : null}
                {titleBlock.summary ? <p className="preview-summary">{titleBlock.summary}</p> : null}
              </div>

              {heroHasPhoto && photoSection?.photoUrl ? (
                <div className="preview-photo-frame preview-hero-photo" style={heroPhotoFrameStyle}>
                  <img className="preview-photo" src={photoSection.photoUrl} alt="Profile" />
                </div>
              ) : null}
            </header>
          ) : null}

          <div
            className={`preview-grid columns-${layoutSettings.columns} sidebar-${layoutSettings.sidebarPosition}`}
            style={gridStyle}
          >
            {layoutSettings.columns === 2 && layoutSettings.sidebarPosition === "left" ? (
              <div className="preview-column sidebar-column">
                {sidebarSections.map(renderSection)}
              </div>
            ) : null}

            <div className="preview-column main-column">
              {mainSections.map(renderSection)}
            </div>

            {layoutSettings.columns === 2 && layoutSettings.sidebarPosition === "right" ? (
              <div className="preview-column sidebar-column">
                {sidebarSections.map(renderSection)}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};
