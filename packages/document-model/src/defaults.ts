import {
  type CVDocument,
  type DocumentLayoutSettings,
  type DocumentPage,
  type DocumentTypography,
  type LayoutPreset,
  type SurfaceStyle,
  type SectionBlueprint,
  type SectionField,
  type SectionFrame,
  type SectionInstance,
  type SectionItem,
  type SectionType,
  type ThemePreset,
} from "./schema";

const createId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

const cloneFields = (fields: SectionField[]) =>
  fields.map((field) => ({ ...field, id: createId("field") }));

const cloneItems = (items: SectionItem[]) =>
  items.map((item) => ({
    ...item,
    id: createId("item"),
    fields: cloneFields(item.fields),
  }));

export const defaultSectionFrame: SectionFrame = {
  minHeight: 88,
  padding: 12,
  fontScale: 1,
  lineHeightMultiplier: 1,
  columns: 1,
};

export const defaultSurfaceStyle: SurfaceStyle = {
  cornerStyle: "rounded",
  shadowStyle: "soft",
  borderMode: "full",
};

export const defaultTypography: DocumentTypography = {
  uiFontFamily: "'Dosis', 'Segoe UI', sans-serif",
  bodyFontFamily: "'Source Sans 3', 'Segoe UI', sans-serif",
  headingFontFamily: "'Bitter', 'Times New Roman', serif",
  baseFontSize: 16,
  titleFontSize: 46,
  roleFontSize: 22,
  sectionTitleFontSize: 14,
  lineHeight: 1.55,
};

export const defaultPage: DocumentPage = {
  zoom: 0.8,
  padding: 32,
  backgroundColorOverride: null,
};

export const defaultLayoutSettings: DocumentLayoutSettings = {
  columns: 2,
  sidebarPosition: "left",
  sidebarWidth: 0.34,
  sectionGap: 18,
  structuredFieldGap: 6,
  paragraphSpacingBefore: 0,
  paragraphSpacingAfter: 12,
  heroPhotoMode: "inline",
  heroPhotoSize: 96,
  surfaceStyle: { ...defaultSurfaceStyle },
};

type LegacySectionInstance = Omit<SectionInstance, "frame"> & {
  items: Array<
    Omit<SectionItem, "fields"> & {
      fields: Array<
        Omit<SectionField, "visible" | "showLabel"> &
          Partial<Pick<SectionField, "visible" | "showLabel">>
      >;
    }
  >;
  frame?: Partial<SectionFrame>;
};

type LegacyDocument = Omit<CVDocument, "typography" | "page" | "layoutSettings" | "sections"> & {
  appThemeId?: string;
  typography?: Partial<DocumentTypography>;
  page?: Partial<DocumentPage>;
  layoutSettings?: Partial<DocumentLayoutSettings> & {
    surfaceStyle?: Partial<SurfaceStyle>;
  };
  sections: LegacySectionInstance[];
};

export const appThemePresets: ThemePreset[] = [
  {
    id: "midnight-ui",
    name: "Midnight UI",
    description: "Dark by default with cool contrast and crisp chrome.",
    tokens: {
      canvasBackground: "#0b1016",
      surface: "#121923",
      surfaceAlt: "#1a2430",
      previewBackground: "#121923",
      textStrong: "#eef4ff",
      textMuted: "#93a4bb",
      accent: "#7cc2ff",
      border: "#28384a",
    },
  },
  {
    id: "graphite-ui",
    name: "Graphite UI",
    description: "Low-glare graphite with a warmer accent.",
    tokens: {
      canvasBackground: "#111317",
      surface: "#181c21",
      surfaceAlt: "#20262d",
      previewBackground: "#181c21",
      textStrong: "#f2f0ea",
      textMuted: "#a5a097",
      accent: "#d1ad72",
      border: "#333a43",
    },
  },
  {
    id: "paper-ui",
    name: "Paper UI",
    description: "A lighter shell for when you do want a bright workspace.",
    tokens: {
      canvasBackground: "#ebe6db",
      surface: "#f7f3eb",
      surfaceAlt: "#efe8dd",
      previewBackground: "#f7f3eb",
      textStrong: "#241f1a",
      textMuted: "#6e6458",
      accent: "#9a5d3c",
      border: "#d4c5b5",
    },
  },
];

export const themePresets: ThemePreset[] = [
  {
    id: "linen-editorial",
    name: "Linen Editorial",
    description: "Warm paper tones with restrained editorial contrast.",
    tokens: {
      canvasBackground: "#efe7dc",
      surface: "#fffaf2",
      surfaceAlt: "#f7efdf",
      previewBackground: "#fffdf8",
      textStrong: "#22201c",
      textMuted: "#6d6458",
      accent: "#8b4d31",
      border: "#d9cbb8",
    },
  },
  {
    id: "studio-slate",
    name: "Studio Slate",
    description: "Cool neutrals with sharp contrast and a slate accent.",
    tokens: {
      canvasBackground: "#dce2e7",
      surface: "#f7fafc",
      surfaceAlt: "#edf3f6",
      previewBackground: "#ffffff",
      textStrong: "#182028",
      textMuted: "#55606c",
      accent: "#275e77",
      border: "#ccd6dd",
    },
  },
  {
    id: "apricot-grid",
    name: "Apricot Grid",
    description: "Bright but readable with a warm accent and structured spacing.",
    tokens: {
      canvasBackground: "#f7e8df",
      surface: "#fff9f5",
      surfaceAlt: "#fff0e5",
      previewBackground: "#fffdfc",
      textStrong: "#261d18",
      textMuted: "#6f5d51",
      accent: "#c1582a",
      border: "#e4c7b8",
    },
  },
];

const layoutFamilies = [
  { slug: "atelier", name: "Atelier" },
  { slug: "harbor", name: "Harbor" },
  { slug: "ledger", name: "Ledger" },
  { slug: "signal", name: "Signal" },
  { slug: "north", name: "North" },
  { slug: "monograph", name: "Monograph" },
  { slug: "stature", name: "Stature" },
  { slug: "metric", name: "Metric" },
  { slug: "canvas", name: "Canvas" },
  { slug: "orbit", name: "Orbit" },
];

const layoutVariants: Array<{
  slug: string;
  name: string;
  description: string;
  columns: 1 | 2;
  sidebarPosition: "left" | "right";
  heroPhotoMode: LayoutPreset["heroPhotoMode"];
}> = [
  {
    slug: "column",
    name: "Column",
    description: "Single-column reading flow with the photo next to the heading when available.",
    columns: 1,
    sidebarPosition: "left",
    heroPhotoMode: "inline",
  },
  {
    slug: "rail-left",
    name: "Rail Left",
    description: "Two-column layout with a left supporting rail.",
    columns: 2,
    sidebarPosition: "left",
    heroPhotoMode: "inline",
  },
  {
    slug: "rail-right",
    name: "Rail Right",
    description: "Two-column layout with a right supporting rail.",
    columns: 2,
    sidebarPosition: "right",
    heroPhotoMode: "inline",
  },
  {
    slug: "stacked",
    name: "Stacked",
    description: "Stacked hero with photo and denser section spacing.",
    columns: 2,
    sidebarPosition: "left",
    heroPhotoMode: "stacked",
  },
  {
    slug: "minimal",
    name: "Minimal",
    description: "Cleaner framing with lighter chrome and a quieter hero.",
    columns: 2,
    sidebarPosition: "right",
    heroPhotoMode: "inline",
  },
];

const cornerStyles: SurfaceStyle["cornerStyle"][] = ["rounded", "soft", "square"];
const shadowStyles: SurfaceStyle["shadowStyle"][] = ["soft", "lifted", "none"];
const borderModes: SurfaceStyle["borderMode"][] = ["full", "frameless", "top", "bottom", "left", "right"];

export const layoutPresets: LayoutPreset[] = [
  ...layoutFamilies.flatMap((family, familyIndex) =>
    layoutVariants.map((variant, variantIndex) => ({
      id: `${family.slug}-${variant.slug}`,
      name: `${family.name} ${variant.name}`,
      description: variant.description,
      columns: variant.columns,
      sidebarPosition: variant.sidebarPosition,
      sidebarWidth: [0.26, 0.3, 0.34, 0.38, 0.42][(familyIndex + variantIndex) % 5],
      sectionGap: [10, 12, 14, 16, 18, 20][(familyIndex * 2 + variantIndex) % 6],
      structuredFieldGap: 6,
      paragraphSpacingBefore: 0,
      paragraphSpacingAfter: 12,
      heroPhotoMode: variant.heroPhotoMode,
      heroPhotoSize: [72, 84, 96, 112, 128][(familyIndex + variantIndex) % 5],
      surfaceStyle: {
        cornerStyle: cornerStyles[(familyIndex + variantIndex) % cornerStyles.length],
        shadowStyle: shadowStyles[(familyIndex + variantIndex) % shadowStyles.length],
        borderMode: borderModes[(familyIndex * 2 + variantIndex) % borderModes.length],
      },
    })),
  ),
  {
    id: "custom-layout",
    name: "Custom Layout",
    description: "User-authored layout settings applied directly in the studio.",
    ...defaultLayoutSettings,
  },
];

export const coreSectionBlueprints: SectionBlueprint[] = [
  {
    type: "title-summary",
    title: "Title & Summary",
    placement: "main",
    allowMarkdown: true,
    allowHtml: true,
    summary: "Name, role, summary, and profile positioning.",
  },
  {
    type: "contact",
    title: "Contact Info",
    placement: "sidebar",
    allowMarkdown: true,
    allowHtml: true,
    summary: "Email, phone, website, location, and other channels.",
  },
  {
    type: "photo",
    title: "Photo",
    placement: "sidebar",
    allowMarkdown: false,
    allowHtml: true,
    summary: "Profile photo with controlled sizing and placement.",
  },
  {
    type: "experience",
    title: "Work Experience",
    placement: "main",
    allowMarkdown: true,
    allowHtml: true,
    summary: "Roles, employers, dates, and measurable impact.",
  },
  {
    type: "education",
    title: "Education",
    placement: "main",
    allowMarkdown: true,
    allowHtml: true,
    summary: "Schools, degrees, programs, and certifications.",
  },
  {
    type: "hard-skills",
    title: "Hard Skills",
    placement: "sidebar",
    allowMarkdown: true,
    allowHtml: true,
    summary: "Tools, stacks, methods, and technical capabilities.",
  },
  {
    type: "soft-skills",
    title: "Soft Skills",
    placement: "sidebar",
    allowMarkdown: true,
    allowHtml: true,
    summary: "Collaboration, leadership, communication, and operating style.",
  },
  {
    type: "languages",
    title: "Languages Spoken",
    placement: "sidebar",
    allowMarkdown: true,
    allowHtml: true,
    summary: "Languages with fluency or working proficiency.",
  },
];

const customSectionBlueprint: SectionBlueprint = {
  type: "custom",
  title: "Custom Section",
  placement: "main",
  allowMarkdown: true,
  allowHtml: true,
  summary: "User-defined section with custom entry structure.",
};

const createFields = (entries: Array<[string, string]>) =>
  entries.map(([label, value]) => ({
    id: createId("field"),
    label,
    value,
    visible: true,
    showLabel: true,
  }));

const createItems = (type: SectionType): SectionItem[] => {
  switch (type) {
    case "title-summary":
      return [
        {
          id: createId("item"),
          fields: createFields([
            ["Full Name", "Alex Mercer"],
            ["Professional Title", "Principal Product Designer"],
          ]),
          markdown:
            "Designing high-clarity products for ambitious teams, with a focus on readable systems, premium UX, and measurable outcomes.",
          html: null,
        },
      ];
    case "contact":
      return [
        {
          id: createId("item"),
          fields: createFields([
            ["Email", "alex@example.com"],
            ["Phone", "+44 20 1234 5678"],
            ["Website", "alexmercer.design"],
            ["Location", "London, UK"],
          ]),
          markdown: "",
          html: null,
        },
      ];
    case "experience":
      return [
        {
          id: createId("item"),
          fields: createFields([
            ["Role", "Lead Product Designer"],
            ["Company", "Northshore Labs"],
            ["Dates", "2021 - Present"],
          ]),
          markdown:
            "- Led a redesign of the core publishing workflow\n- Reduced time to publish by 37%\n- Introduced a reusable design system adopted by four product lines",
          html: null,
        },
      ];
    case "education":
      return [
        {
          id: createId("item"),
          fields: createFields([
            ["Degree", "BA, Graphic Communication Design"],
            ["School", "University of the Arts London"],
            ["Dates", "2014 - 2017"],
          ]),
          markdown: "Graduated with distinction and specialized in editorial systems.",
          html: null,
        },
      ];
    case "hard-skills":
      return [
        {
          id: createId("item"),
          fields: createFields([
            ["Primary Stack", "Figma, Framer, Adobe CC, TypeScript"],
          ]),
          markdown: "- Design systems\n- Interface prototyping\n- Front-end collaboration",
          html: null,
        },
      ];
    case "soft-skills":
      return [
        {
          id: createId("item"),
          fields: createFields([
            ["Core Strengths", "Facilitation, mentoring, stakeholder communication"],
          ]),
          markdown: "- Calm decision-making\n- Workshop leadership\n- Cross-functional clarity",
          html: null,
        },
      ];
    case "languages":
      return [
        {
          id: createId("item"),
          fields: createFields([
            ["English", "Native"],
            ["French", "Professional working proficiency"],
          ]),
          markdown: "",
          html: null,
        },
      ];
    case "custom":
      return [
        {
          id: createId("item"),
          fields: createFields([["Label", ""]]),
          markdown: "",
          html: null,
        },
      ];
    case "photo":
      return [];
  }
};

const getSectionBlueprint = (type: SectionType) =>
  type === "custom"
    ? customSectionBlueprint
    : coreSectionBlueprints.find((entry) => entry.type === type);

export const createSectionInstance = (type: SectionType): SectionInstance => {
  const blueprint = getSectionBlueprint(type);

  if (!blueprint) {
    throw new Error(`Unknown section blueprint: ${type}`);
  }

  return {
    id: createId("section"),
    type,
    title: blueprint.title,
    visible: true,
    placement: blueprint.placement,
    allowMarkdown: blueprint.allowMarkdown,
    allowHtml: blueprint.allowHtml,
    summary: blueprint.summary,
    items: createItems(type),
    markdown: type === "title-summary" ? "" : "",
    html: null,
    photoUrl: null,
    frame: { ...defaultSectionFrame },
  };
};

export const cloneSectionInstance = (section: SectionInstance): SectionInstance => ({
  ...section,
  id: createId("section"),
  title: `${section.title} Copy`,
  items: cloneItems(section.items),
  frame: { ...section.frame },
});

export const createStarterDocument = (): CVDocument => ({
  id: createId("document"),
  title: "Primary CV",
  appThemeId: appThemePresets[0].id,
  themeId: themePresets[0].id,
  layoutId: layoutPresets[1].id,
  density: 1,
  accentColorOverride: null,
  typography: { ...defaultTypography },
  page: { ...defaultPage },
  layoutSettings: {
    ...layoutPresets[1],
    surfaceStyle: { ...layoutPresets[1].surfaceStyle },
  },
  sections: coreSectionBlueprints.map((blueprint) => createSectionInstance(blueprint.type)),
  updatedAt: new Date().toISOString(),
});

const getLayoutPreset = (layoutId: string | undefined) =>
  layoutPresets.find((preset) => preset.id === layoutId) ?? layoutPresets[0];

export const normalizeDocument = (document: LegacyDocument): CVDocument => {
  const preset = getLayoutPreset(document.layoutId);

  return {
    ...document,
    appThemeId: document.appThemeId ?? appThemePresets[0].id,
    density: document.density ?? 1,
    accentColorOverride: document.accentColorOverride ?? null,
    typography: {
      ...defaultTypography,
      ...document.typography,
    },
    page: {
      ...defaultPage,
      ...document.page,
    },
    layoutSettings: {
      ...defaultLayoutSettings,
      ...preset,
      ...document.layoutSettings,
      surfaceStyle: {
        ...defaultSurfaceStyle,
        ...preset.surfaceStyle,
        ...document.layoutSettings?.surfaceStyle,
      },
    },
    sections: document.sections.map((section) => ({
      ...section,
      photoUrl: section.photoUrl ?? null,
      items: section.items.map((item) => ({
        ...item,
        fields: item.fields.map((field) => ({
          ...field,
          visible: field.visible ?? true,
          showLabel: field.showLabel ?? true,
        })),
      })),
      frame: {
        ...defaultSectionFrame,
        ...section.frame,
      },
    })),
  };
};
