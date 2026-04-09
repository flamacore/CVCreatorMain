import type { CVDocument, LayoutPreset, SectionInstance } from "@cvcreator/document-model";

export interface LayoutCompatibilityResult {
  warnings: string[];
  sectionsLosingHtml: SectionInstance["id"][];
}

export const analyzeLayoutSwitch = (
  document: CVDocument,
  currentLayout: LayoutPreset,
  nextLayout: LayoutPreset,
): LayoutCompatibilityResult => {
  const sectionsWithCustomHtml = document.sections.filter(
    (section) => section.visible && section.html && section.html.trim().length > 0,
  );

  if (sectionsWithCustomHtml.length === 0) {
    return {
      warnings: [],
      sectionsLosingHtml: [],
    };
  }

  const sectionsLosingHtml = sectionsWithCustomHtml
    .filter((section) => currentLayout.columns !== nextLayout.columns && section.placement === "sidebar")
    .map((section) => section.id);

  const warnings: string[] = [];

  if (sectionsLosingHtml.length > 0) {
    warnings.push(
      "Switching between one and two columns may discard custom HTML attached to sidebar sections.",
    );
  }

  if (currentLayout.sidebarPosition !== nextLayout.sidebarPosition && sectionsWithCustomHtml.length > 0) {
    warnings.push("The sidebar anchor is changing. Review custom HTML after applying the new layout.");
  }

  return {
    warnings,
    sectionsLosingHtml,
  };
};
