import type { CVDocument, LayoutPreset, SectionField, SectionInstance, SectionItem, ThemePreset } from "@cvcreator/document-model";

import { renderMarkdownToHtml, sanitizeHtml } from "./SanitizationService";

const normalizeHexColor = (value: string) => {
  const hex = value.trim().replace(/^#/, "");

  if (hex.length === 3) {
    return hex
      .split("")
      .map((character) => character + character)
      .join("");
  }

  return hex.length === 6 ? hex : "ffffff";
};

const mixHexColors = (primary: string, secondary: string, primaryWeight: number) => {
  const primaryHex = normalizeHexColor(primary);
  const secondaryHex = normalizeHexColor(secondary);
  const secondaryWeight = 1 - primaryWeight;

  const channels = [0, 2, 4].map((offset) => {
    const primaryChannel = Number.parseInt(primaryHex.slice(offset, offset + 2), 16);
    const secondaryChannel = Number.parseInt(secondaryHex.slice(offset, offset + 2), 16);
    const mixedChannel = Math.round(primaryChannel * primaryWeight + secondaryChannel * secondaryWeight);
    return mixedChannel.toString(16).padStart(2, "0");
  });

  return `#${channels.join("")}`;
};

const isFieldRenderable = (field: SectionField) => field.visible !== false && field.value.trim().length > 0;

const getStructuredFieldValue = (section: SectionInstance | undefined, index: number, fallback = "") => {
  const field = section?.items[0]?.fields[index];

  if (!field || field.visible === false || !field.value.trim()) {
    return fallback;
  }

  return field.value;
};

const renderFields = (item: SectionItem) =>
  item.fields
    .filter(isFieldRenderable)
    .map(
      (field) => {
        const labelMarkup = field.showLabel !== false && field.label.trim()
          ? `<span class="preview-field-label">${field.label}</span>`
          : "";

        return `<div class="preview-field">${labelMarkup}<span class="preview-field-value">${field.value}</span></div>`;
      },
    )
    .join("");

const renderItems = (section: SectionInstance) =>
  section.items
    .map((item) => {
      const fieldsMarkup = renderFields(item);
      const markdownBody = item.markdown.trim() ? renderMarkdownToHtml(item.markdown) : "";
      const htmlBody = item.html?.trim() ? sanitizeHtml(item.html) : "";
      const body = htmlBody || markdownBody;

      if (!fieldsMarkup && !body) {
        return "";
      }

      return `<article class="preview-item">${fieldsMarkup}${body ? `<div class="preview-rich-text">${body}</div>` : ""}</article>`;
    })
    .filter(Boolean)
    .join("");

export const renderSectionBody = (section: SectionInstance) => {
  if (section.type === "photo" && section.photoUrl) {
    return `<div class="preview-photo-frame"><img class="preview-photo" src="${section.photoUrl}" alt="Profile" /></div>`;
  }

  if (section.html?.trim()) {
    return sanitizeHtml(section.html);
  }

  if (section.markdown.trim()) {
    return renderMarkdownToHtml(section.markdown);
  }

  if (section.items.length > 0) {
    const itemsMarkup = renderItems(section);

    if (itemsMarkup) {
      return itemsMarkup;
    }
  }

  return `<p class="preview-empty">No content yet.</p>`;
};

export const renderDocumentSections = (document: CVDocument) =>
  document.sections.filter((section) => section.visible).map((section) => ({
    id: section.id,
    title: section.title,
    placement: section.placement,
    html: renderSectionBody(section),
    type: section.type,
    frame: section.frame,
  }));

const renderExportPreviewSections = (sections: Array<ReturnType<typeof renderDocumentSections>[number]>) =>
  sections
    .map(
      (section) => `<section class="cv-section cv-section-${section.type} cv-section-${section.id}">
  <h3>${section.title}</h3>
  <div class="cv-section-body">${section.html}</div>
</section>`,
    )
    .join("");

const renderExportSectionStyles = (
  sections: Array<ReturnType<typeof renderDocumentSections>[number]>,
  baseLineHeight: number,
) =>
  sections
    .map(
      (section) =>
        `.cv-section-${section.id} { min-height: ${section.frame.minHeight}px; padding: ${section.frame.padding}px; font-size: ${section.frame.fontScale}em; line-height: ${(baseLineHeight * section.frame.lineHeightMultiplier).toFixed(3)}; }`,
    )
    .join("\n");

const getSectionRadius = (cornerStyle: CVDocument["layoutSettings"]["surfaceStyle"]["cornerStyle"]) => {
  switch (cornerStyle) {
    case "square":
      return "0px";
    case "soft":
      return "10px";
    case "rounded":
    default:
      return "20px";
  }
};

const getSectionShadow = (shadowStyle: CVDocument["layoutSettings"]["surfaceStyle"]["shadowStyle"]) => {
  switch (shadowStyle) {
    case "lifted":
      return "0 14px 30px rgba(15, 23, 42, 0.16)";
    case "soft":
      return "0 8px 18px rgba(15, 23, 42, 0.1)";
    case "none":
    default:
      return "none";
  }
};

const getSectionBorderCss = (borderMode: CVDocument["layoutSettings"]["surfaceStyle"]["borderMode"]) => {
  switch (borderMode) {
    case "frameless":
      return "border: none;";
    case "top":
      return "border: none; border-top: 1px solid var(--border);";
    case "bottom":
      return "border: none; border-bottom: 1px solid var(--border);";
    case "left":
      return "border: none; border-left: 1px solid var(--border);";
    case "right":
      return "border: none; border-right: 1px solid var(--border);";
    case "full":
    default:
      return "border: 1px solid var(--border);";
  }
};

export const renderExportDocument = (
  document: CVDocument,
  theme: ThemePreset,
  layout: LayoutPreset,
) => {
  const layoutSettings = document.layoutSettings;
  const layoutName = document.layoutId === "custom-layout" ? "Custom Layout" : layout.name;
  const titleSection = document.sections.find((section) => section.visible && section.type === "title-summary");
  const photoSection = document.sections.find((section) => section.visible && section.type === "photo" && section.photoUrl);
  const sections = renderDocumentSections(document).filter(
    (section) =>
      !(photoSection && layoutSettings.heroPhotoMode !== "hidden" && section.type === "photo"),
  );
  const name = getStructuredFieldValue(titleSection, 0, document.title);
  const role = getStructuredFieldValue(titleSection, 1, "");
  const summary = titleSection?.markdown || titleSection?.items[0]?.markdown || "";
  const summaryHtml = summary ? renderMarkdownToHtml(summary) : "";
  const titleLineHeight = document.typography.lineHeight * (titleSection?.frame.lineHeightMultiplier ?? 1);
  const photoMarkup =
    photoSection?.photoUrl && layoutSettings.heroPhotoMode !== "hidden"
      ? `<div class="cv-hero-photo-frame"><img class="cv-hero-photo" src="${photoSection.photoUrl}" alt="Profile" /></div>`
      : "";
  const mainSections =
    layoutSettings.columns === 1
      ? sections.filter((section) => section.type !== "title-summary")
      : sections.filter((section) => section.type !== "title-summary" && section.placement === "main");
  const sidebarSections =
    layoutSettings.columns === 1
      ? []
      : sections.filter((section) => section.type !== "title-summary" && section.placement === "sidebar");
  const effectiveColumns = layoutSettings.columns === 2 && sidebarSections.length > 0 ? 2 : 1;
  const accent = document.accentColorOverride ?? theme.tokens.accent;
  const pageBackground = document.page.backgroundColorOverride ?? theme.tokens.previewBackground;
  const heroPhotoSurface = mixHexColors(theme.tokens.surface, "#ffffff", 0.85);
  const sectionSurface = mixHexColors(theme.tokens.surface, "#ffffff", 0.88);
  const sidebarMarkup = sidebarSections.length > 0 ? `<aside class="cv-column cv-sidebar">${renderExportPreviewSections(sidebarSections)}</aside>` : "";
  const mainMarkup = `<main class="cv-column cv-main">${renderExportPreviewSections(mainSections)}</main>`;
  const sectionStyles = renderExportSectionStyles([...sidebarSections, ...mainSections], document.typography.lineHeight);
  const gridMarkup =
    effectiveColumns === 1
      ? `<div class="cv-grid columns-1">${mainMarkup}</div>`
      : layoutSettings.sidebarPosition === "left"
        ? `<div class="cv-grid columns-2 sidebar-left">${sidebarMarkup}${mainMarkup}</div>`
        : `<div class="cv-grid columns-2 sidebar-right">${mainMarkup}${sidebarMarkup}</div>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${name} · ${layoutName}</title>
    <style>
      :root {
        --surface: ${theme.tokens.surface};
        --preview: ${pageBackground};
        --text-strong: ${theme.tokens.textStrong};
        --text-muted: ${theme.tokens.textMuted};
        --accent: ${accent};
        --border: ${theme.tokens.border};
        --section-gap: ${layoutSettings.sectionGap}px;
        --structured-field-gap: ${layoutSettings.structuredFieldGap}px;
        --paragraph-space-before: ${layoutSettings.paragraphSpacingBefore}px;
        --paragraph-space-after: ${layoutSettings.paragraphSpacingAfter}px;
        --sidebar-width: ${layoutSettings.sidebarWidth.toFixed(2)}fr;
        --main-width: ${(1 - layoutSettings.sidebarWidth).toFixed(2)}fr;
        --section-radius: ${getSectionRadius(layoutSettings.surfaceStyle.cornerStyle)};
        --section-shadow: ${getSectionShadow(layoutSettings.surfaceStyle.shadowStyle)};
        --hero-photo-size: ${layoutSettings.heroPhotoSize}px;
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 32px;
        background: #f2efe8;
        color: var(--text-strong);
        font-family: ${document.typography.bodyFontFamily};
        font-size: ${document.typography.baseFontSize}px;
        line-height: ${document.typography.lineHeight};
      }

      .cv-page {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        padding: ${document.page.padding}px;
        border: none;
        border-radius: 0;
        background: var(--preview);
      }

      .cv-header {
        display: flex;
        flex-direction: ${layoutSettings.heroPhotoMode === "inline" ? "row" : "column"};
        justify-content: space-between;
        align-items: ${layoutSettings.heroPhotoMode === "inline" ? "center" : "flex-start"};
        gap: ${Math.max(12, layoutSettings.sectionGap)}px;
        margin-bottom: 24px;
        padding-bottom: 18px;
        border-bottom: 1px solid var(--border);
      }

      .cv-header-copy {
        flex: 1 1 auto;
        min-width: 0;
        line-height: ${titleLineHeight.toFixed(3)};
      }

      .cv-header h1 {
        margin: 0;
        font-family: ${document.typography.headingFontFamily};
        font-size: ${document.typography.titleFontSize}px;
        line-height: 1;
      }

      .cv-role {
        margin: 8px 0 0;
        color: var(--accent);
        font-weight: 700;
        font-size: ${document.typography.roleFontSize}px;
      }

      .cv-summary {
        margin: 12px 0 0;
        color: var(--text-muted);
        max-width: 72ch;
      }

      .cv-summary > *:first-child {
        margin-top: 0;
      }

      .cv-summary > *:last-child {
        margin-bottom: 0;
      }

      .cv-hero-photo-frame {
        width: var(--hero-photo-size);
        min-width: var(--hero-photo-size);
        overflow: hidden;
        border-radius: calc(var(--section-radius) - 2px);
        border: 1px solid var(--border);
        background: ${heroPhotoSurface};
        box-shadow: 0 10px 26px rgba(15, 23, 42, 0.08);
      }

      .cv-hero-photo {
        display: block;
        width: 100%;
        aspect-ratio: 3 / 4;
        object-fit: cover;
      }

      .cv-grid {
        display: grid;
        gap: var(--section-gap);
      }

      .columns-2.sidebar-left,
      .columns-2.sidebar-right {
        grid-template-columns: minmax(0, var(--sidebar-width)) minmax(0, var(--main-width));
      }

      .columns-2.sidebar-right {
        grid-template-columns: minmax(0, var(--main-width)) minmax(0, var(--sidebar-width));
      }

      .cv-column {
        display: flex;
        flex-direction: column;
        gap: calc(var(--section-gap) * 0.8);
      }

      .cv-section {
        ${getSectionBorderCss(layoutSettings.surfaceStyle.borderMode)}
        border-radius: var(--section-radius);
        padding: 16px;
        background: ${sectionSurface};
        box-shadow: var(--section-shadow);
      }

      .cv-section h3 {
        margin: 0 0 12px;
        color: var(--accent);
        font-family: ${document.typography.headingFontFamily};
        font-size: ${document.typography.sectionTitleFontSize}px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      ${sectionStyles}

      .preview-item {
        display: grid;
        gap: var(--structured-field-gap);
        margin-top: 0;
        margin-bottom: 12px;
      }

      .preview-item,
      .preview-rich-text ul,
      .cv-section ul {
        margin-top: 0;
        margin-bottom: 12px;
      }

      .preview-field {
        margin-top: 0;
        margin-bottom: 0;
      }

      .preview-rich-text p,
      .preview-empty,
      .cv-section p {
        margin-top: var(--paragraph-space-before);
        margin-bottom: var(--paragraph-space-after);
      }

      .preview-field-label {
        display: block;
        margin-bottom: 2px;
        color: var(--text-muted);
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .preview-field-value {
        font-weight: 600;
      }

      .preview-photo {
        display: block;
        width: 100%;
        aspect-ratio: 3 / 4;
        object-fit: cover;
        border-radius: 14px;
      }

      @media print {
        body {
          background: white;
          padding: 0;
        }

        .cv-page {
          border: none;
          box-shadow: none;
          border-radius: 0;
          max-width: none;
          padding: 0;
        }
      }
    </style>
  </head>
  <body>
    <article class="cv-page">
      <header class="cv-header">
        <div class="cv-header-copy">
          <h1>${name}</h1>
          ${role ? `<p class="cv-role">${role}</p>` : ""}
          ${summaryHtml ? `<div class="cv-summary">${summaryHtml}</div>` : ""}
        </div>
        ${photoMarkup}
      </header>
      ${gridMarkup}
    </article>
  </body>
</html>`;
};
