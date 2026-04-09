export type SectionType =
  | "title-summary"
  | "contact"
  | "photo"
  | "experience"
  | "education"
  | "hard-skills"
  | "soft-skills"
  | "languages"
  | "custom";

export type SectionPlacement = "main" | "sidebar";

export interface SectionField {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  showLabel: boolean;
}

export interface SectionItem {
  id: string;
  fields: SectionField[];
  markdown: string;
  html: string | null;
}

export interface SectionFrame {
  minHeight: number;
  padding: number;
  fontScale: number;
  lineHeightMultiplier: number;
}

export type HeroPhotoMode = "inline" | "stacked" | "hidden";
export type CornerStyle = "rounded" | "soft" | "square";
export type ShadowStyle = "none" | "soft" | "lifted";
export type BorderMode = "full" | "frameless" | "top" | "bottom" | "left" | "right";

export interface SurfaceStyle {
  cornerStyle: CornerStyle;
  shadowStyle: ShadowStyle;
  borderMode: BorderMode;
}

export interface SectionInstance {
  id: string;
  type: SectionType;
  title: string;
  visible: boolean;
  placement: SectionPlacement;
  allowMarkdown: boolean;
  allowHtml: boolean;
  summary: string;
  items: SectionItem[];
  markdown: string;
  html: string | null;
  photoUrl: string | null;
  frame: SectionFrame;
}

export interface ThemeTokens {
  canvasBackground: string;
  surface: string;
  surfaceAlt: string;
  previewBackground: string;
  textStrong: string;
  textMuted: string;
  accent: string;
  border: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  tokens: ThemeTokens;
}

export interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  columns: 1 | 2;
  sidebarPosition: "left" | "right";
  sidebarWidth: number;
  sectionGap: number;
  structuredFieldGap: number;
  paragraphSpacingBefore: number;
  paragraphSpacingAfter: number;
  heroPhotoMode: HeroPhotoMode;
  heroPhotoSize: number;
  surfaceStyle: SurfaceStyle;
}

export interface DocumentTypography {
  uiFontFamily: string;
  bodyFontFamily: string;
  headingFontFamily: string;
  baseFontSize: number;
  titleFontSize: number;
  roleFontSize: number;
  sectionTitleFontSize: number;
  lineHeight: number;
}

export interface DocumentPage {
  zoom: number;
  padding: number;
  backgroundColorOverride: string | null;
}

export interface DocumentLayoutSettings {
  columns: 1 | 2;
  sidebarPosition: "left" | "right";
  sidebarWidth: number;
  sectionGap: number;
  structuredFieldGap: number;
  paragraphSpacingBefore: number;
  paragraphSpacingAfter: number;
  heroPhotoMode: HeroPhotoMode;
  heroPhotoSize: number;
  surfaceStyle: SurfaceStyle;
}

export interface SectionBlueprint {
  type: SectionType;
  title: string;
  placement: SectionPlacement;
  allowMarkdown: boolean;
  allowHtml: boolean;
  summary: string;
}

export interface CVDocument {
  id: string;
  title: string;
  appThemeId: string;
  themeId: string;
  layoutId: string;
  density: number;
  accentColorOverride: string | null;
  typography: DocumentTypography;
  page: DocumentPage;
  layoutSettings: DocumentLayoutSettings;
  sections: SectionInstance[];
  updatedAt: string;
}
