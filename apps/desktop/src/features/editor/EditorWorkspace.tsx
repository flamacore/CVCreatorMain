import { useState } from "react";

import type {
  BorderMode,
  CornerStyle,
  CVDocument,
  HeroPhotoMode,
  SectionInstance,
  SectionType,
  ShadowStyle,
} from "@cvcreator/document-model";

import type { LibrarySection } from "../state/useResumeBuilder";

const fontChoices = [
  { label: "Dosis", value: "'Dosis', 'Segoe UI', sans-serif" },
  { label: "Source Sans 3", value: "'Source Sans 3', 'Segoe UI', sans-serif" },
  { label: "Bitter", value: "'Bitter', Georgia, serif" },
  { label: "Inter", value: "Inter, 'Segoe UI', sans-serif" },
  { label: "Manrope", value: "'Manrope', 'Segoe UI', sans-serif" },
  { label: "DM Sans", value: "'DM Sans', 'Segoe UI', sans-serif" },
  { label: "Plus Jakarta Sans", value: "'Plus Jakarta Sans', 'Segoe UI', sans-serif" },
  { label: "IBM Plex Sans", value: "'IBM Plex Sans', 'Segoe UI', sans-serif" },
  { label: "Work Sans", value: "'Work Sans', 'Segoe UI', sans-serif" },
  { label: "Public Sans", value: "'Public Sans', 'Segoe UI', sans-serif" },
  { label: "Nunito Sans", value: "'Nunito Sans', 'Segoe UI', sans-serif" },
  { label: "Figtree", value: "'Figtree', 'Segoe UI', sans-serif" },
  { label: "Outfit", value: "Outfit, 'Segoe UI', sans-serif" },
  { label: "Rubik", value: "Rubik, 'Segoe UI', sans-serif" },
  { label: "Urbanist", value: "Urbanist, 'Segoe UI', sans-serif" },
  { label: "Mulish", value: "Mulish, 'Segoe UI', sans-serif" },
  { label: "Montserrat", value: "Montserrat, 'Segoe UI', sans-serif" },
  { label: "Poppins", value: "Poppins, 'Segoe UI', sans-serif" },
  { label: "Raleway", value: "Raleway, 'Segoe UI', sans-serif" },
  { label: "Jost", value: "Jost, 'Segoe UI', sans-serif" },
  { label: "Karla", value: "Karla, 'Segoe UI', sans-serif" },
  { label: "Lato", value: "Lato, 'Segoe UI', sans-serif" },
  { label: "Barlow", value: "Barlow, 'Segoe UI', sans-serif" },
  { label: "Merriweather Sans", value: "'Merriweather Sans', 'Segoe UI', sans-serif" },
  { label: "Space Grotesk", value: "'Space Grotesk', 'Segoe UI', sans-serif" },
  { label: "Sora", value: "Sora, 'Segoe UI', sans-serif" },
  { label: "Lexend", value: "Lexend, 'Segoe UI', sans-serif" },
  { label: "Assistant", value: "Assistant, 'Segoe UI', sans-serif" },
  { label: "Libre Franklin", value: "'Libre Franklin', 'Segoe UI', sans-serif" },
  { label: "Noto Sans", value: "'Noto Sans', 'Segoe UI', sans-serif" },
  { label: "Newsreader", value: "Newsreader, Georgia, serif" },
  { label: "Playfair Display", value: "'Playfair Display', Georgia, serif" },
  { label: "Libre Baskerville", value: "'Libre Baskerville', Georgia, serif" },
  { label: "Crimson Text", value: "'Crimson Text', Georgia, serif" },
  { label: "Merriweather", value: "'Merriweather', Georgia, serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', Georgia, serif" },
  { label: "Source Serif 4", value: "'Source Serif 4', Georgia, serif" },
  { label: "Lora", value: "Lora, Georgia, serif" },
  { label: "Fraunces", value: "Fraunces, Georgia, serif" },
  { label: "PT Serif", value: "'PT Serif', Georgia, serif" },
  { label: "Noto Serif", value: "'Noto Serif', Georgia, serif" },
  { label: "Domine", value: "Domine, Georgia, serif" },
  { label: "Vollkorn", value: "Vollkorn, Georgia, serif" },
  { label: "Abril Fatface", value: "'Abril Fatface', Georgia, serif" },
  { label: "Zilla Slab", value: "'Zilla Slab', Georgia, serif" },
  { label: "Alegreya", value: "Alegreya, Georgia, serif" },
  { label: "EB Garamond", value: "'EB Garamond', Georgia, serif" },
  { label: "Spectral", value: "Spectral, Georgia, serif" },
  { label: "Arvo", value: "Arvo, Georgia, serif" },
  { label: "Cabin", value: "Cabin, 'Segoe UI', sans-serif" },
];

const heroPhotoModes: Array<{ label: string; value: HeroPhotoMode }> = [
  { label: "Inline beside title", value: "inline" },
  { label: "Stacked under title", value: "stacked" },
  { label: "Keep in body", value: "hidden" },
];

const cornerChoices: Array<{ label: string; value: CornerStyle }> = [
  { label: "Rounded", value: "rounded" },
  { label: "Soft", value: "soft" },
  { label: "Square", value: "square" },
];

const shadowChoices: Array<{ label: string; value: ShadowStyle }> = [
  { label: "Soft shadow", value: "soft" },
  { label: "Lifted shadow", value: "lifted" },
  { label: "No shadow", value: "none" },
];

const borderChoices: Array<{ label: string; value: BorderMode }> = [
  { label: "Full frame", value: "full" },
  { label: "Frameless", value: "frameless" },
  { label: "Top border", value: "top" },
  { label: "Bottom border", value: "bottom" },
  { label: "Left border", value: "left" },
  { label: "Right border", value: "right" },
];

interface EditorWorkspaceProps {
  document: CVDocument;
  themePreviewBackground: string;
  sections: SectionInstance[];
  hiddenSections: LibrarySection[];
  hiddenCustomSections: SectionInstance[];
  selectedSectionId: string | null;
  onSelect: (sectionId: string) => void;
  onAddCustomSection: () => void;
  onMoveSection: (sectionId: string, targetSectionId: string) => void;
  onMoveSectionToEnd: (sectionId: string) => void;
  onHideSection: (sectionId: string) => void;
  onRevealSection: (sectionType: SectionType, beforeSectionId?: string) => void;
  onRestoreSection: (sectionId: string) => void;
  onUpdateTypography: (patch: Partial<CVDocument["typography"]>) => void;
  onUpdatePage: (patch: Partial<CVDocument["page"]>) => void;
  onUpdateLayoutSettings: (patch: Partial<CVDocument["layoutSettings"]>) => void;
  onDensityChange: (density: number) => void;
  onContextMenuOpen: (event: React.MouseEvent<HTMLDivElement>, sectionId: string) => void;
}

const sectionMeta = (section: SectionInstance) =>
  `${section.placement === "main" ? "Main" : "Side"} · ${section.type.replace(/-/g, " ")}`;

export const EditorWorkspace = ({
  document,
  themePreviewBackground,
  sections,
  hiddenSections,
  hiddenCustomSections,
  selectedSectionId,
  onSelect,
  onAddCustomSection,
  onMoveSection,
  onMoveSectionToEnd,
  onHideSection,
  onRevealSection,
  onRestoreSection,
  onUpdateTypography,
  onUpdatePage,
  onUpdateLayoutSettings,
  onDensityChange,
  onContextMenuOpen,
}: EditorWorkspaceProps) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    typography: true,
    layout: true,
    hidden: true,
    sections: true,
  });
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((current) => ({
      ...current,
      [groupId]: !(current[groupId] ?? false),
    }));
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((current) => ({
      ...current,
      [sectionId]: !(current[sectionId] ?? true),
    }));
  };

  return (
    <section
      className="panel editor-panel"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();

        const sectionId = event.dataTransfer.getData("application/x-cvcreator-section");
        const sectionType = event.dataTransfer.getData("application/x-cvcreator-library") as SectionType;

        if (sectionId) {
          onMoveSectionToEnd(sectionId);
        }

        if (sectionType) {
          onRevealSection(sectionType);
        }
      }}
    >
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Studio</p>
          <h2>Controls</h2>
        </div>
      </div>

      <div className="editor-canvas compact-stack">
        <div className="studio-group compact-group">
          <button aria-label={collapsedGroups.typography ? "Expand typography" : "Collapse typography"} className="block-toggle studio-toggle" onClick={() => toggleGroup("typography")} type="button">
            <strong>Typography</strong>
            <span className="toggle-arrow" aria-hidden="true">{collapsedGroups.typography ? "▾" : "▴"}</span>
          </button>

          {!collapsedGroups.typography ? (
            <>
              <label className="control">
                <span>App font</span>
                <select value={document.typography.uiFontFamily} onChange={(event) => onUpdateTypography({ uiFontFamily: event.target.value })}>
                  {fontChoices.map((choice) => (
                    <option key={choice.label} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="control">
                <span>Body font</span>
                <select value={document.typography.bodyFontFamily} onChange={(event) => onUpdateTypography({ bodyFontFamily: event.target.value })}>
                  {fontChoices.map((choice) => (
                    <option key={choice.label} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="control">
                <span>Heading font</span>
                <select value={document.typography.headingFontFamily} onChange={(event) => onUpdateTypography({ headingFontFamily: event.target.value })}>
                  {fontChoices.map((choice) => (
                    <option key={choice.label} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="control slider-control">
                <span>Body size {document.typography.baseFontSize}px</span>
                <input max="28" min="8" step="1" type="range" value={document.typography.baseFontSize} onChange={(event) => onUpdateTypography({ baseFontSize: Number(event.target.value) })} />
              </label>

              <label className="control slider-control">
                <span>Role size {document.typography.roleFontSize}px</span>
                <input max="34" min="10" step="1" type="range" value={document.typography.roleFontSize} onChange={(event) => onUpdateTypography({ roleFontSize: Number(event.target.value) })} />
              </label>

              <label className="control slider-control">
                <span>Title size {document.typography.titleFontSize}px</span>
                <input max="80" min="18" step="1" type="range" value={document.typography.titleFontSize} onChange={(event) => onUpdateTypography({ titleFontSize: Number(event.target.value) })} />
              </label>

              <label className="control slider-control">
                <span>Section label {document.typography.sectionTitleFontSize}px</span>
                <input max="28" min="8" step="1" type="range" value={document.typography.sectionTitleFontSize} onChange={(event) => onUpdateTypography({ sectionTitleFontSize: Number(event.target.value) })} />
              </label>

              <label className="control slider-control">
                <span>Line height {document.typography.lineHeight.toFixed(2)}</span>
                <input max="2.4" min="0.95" step="0.05" type="range" value={document.typography.lineHeight} onChange={(event) => onUpdateTypography({ lineHeight: Number(event.target.value) })} />
              </label>
            </>
          ) : null}
        </div>

        <div className="studio-group compact-group">
          <button aria-label={collapsedGroups.layout ? "Expand layout controls" : "Collapse layout controls"} className="block-toggle studio-toggle" onClick={() => toggleGroup("layout")} type="button">
            <strong>Page & layout</strong>
            <span className="toggle-arrow" aria-hidden="true">{collapsedGroups.layout ? "▾" : "▴"}</span>
          </button>

          {!collapsedGroups.layout ? (
            <>
              <label className="control slider-control">
                <span>Preview scale {document.page.zoom.toFixed(2)}x</span>
                <input max="1" min="0.25" step="0.05" type="range" value={document.page.zoom} onChange={(event) => onUpdatePage({ zoom: Number(event.target.value) })} />
              </label>

              <label className="control slider-control">
                <span>Page padding {document.page.padding}px</span>
                <input max="96" min="4" step="2" type="range" value={document.page.padding} onChange={(event) => onUpdatePage({ padding: Number(event.target.value) })} />
              </label>

              <label className="control accent-control">
                <span>Document background</span>
                <input
                  type="color"
                  value={document.page.backgroundColorOverride ?? themePreviewBackground}
                  onChange={(event) => onUpdatePage({ backgroundColorOverride: event.target.value })}
                />
              </label>

              <button
                className="ghost-button compact-button"
                onClick={() => onUpdatePage({ backgroundColorOverride: null })}
                type="button"
              >
                Use theme background
              </button>

              <label className="control slider-control">
                <span>UI density {document.density.toFixed(2)}x</span>
                <input max="1.2" min="0.2" step="0.05" type="range" value={document.density} onChange={(event) => onDensityChange(Number(event.target.value))} />
              </label>

              <label className="control">
                <span>Columns</span>
                <select value={document.layoutSettings.columns} onChange={(event) => onUpdateLayoutSettings({ columns: Number(event.target.value) as 1 | 2 })}>
                  <option value="1">One column</option>
                  <option value="2">Two columns</option>
                </select>
              </label>

              <label className="control">
                <span>Sidebar side</span>
                <select value={document.layoutSettings.sidebarPosition} onChange={(event) => onUpdateLayoutSettings({ sidebarPosition: event.target.value as "left" | "right" })}>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </label>

              <label className="control slider-control">
                <span>Sidebar width {(document.layoutSettings.sidebarWidth * 100).toFixed(0)}%</span>
                <input max="0.48" min="0.18" step="0.02" type="range" value={document.layoutSettings.sidebarWidth} onChange={(event) => onUpdateLayoutSettings({ sidebarWidth: Number(event.target.value) })} />
              </label>

              <label className="control slider-control">
                <span>Section gap {document.layoutSettings.sectionGap}px</span>
                <input max="48" min="2" step="1" type="range" value={document.layoutSettings.sectionGap} onChange={(event) => onUpdateLayoutSettings({ sectionGap: Number(event.target.value) })} />
              </label>

              <label className="control slider-control">
                <span>Structured field gap {document.layoutSettings.structuredFieldGap}px</span>
                <input
                  max="24"
                  min="0"
                  step="1"
                  type="range"
                  value={document.layoutSettings.structuredFieldGap}
                  onChange={(event) => onUpdateLayoutSettings({ structuredFieldGap: Number(event.target.value) })}
                />
              </label>

              <label className="control slider-control">
                <span>Paragraph space before {document.layoutSettings.paragraphSpacingBefore}px</span>
                <input
                  max="32"
                  min="0"
                  step="1"
                  type="range"
                  value={document.layoutSettings.paragraphSpacingBefore}
                  onChange={(event) =>
                    onUpdateLayoutSettings({ paragraphSpacingBefore: Number(event.target.value) })
                  }
                />
              </label>

              <label className="control slider-control">
                <span>Paragraph space after {document.layoutSettings.paragraphSpacingAfter}px</span>
                <input
                  max="40"
                  min="0"
                  step="1"
                  type="range"
                  value={document.layoutSettings.paragraphSpacingAfter}
                  onChange={(event) =>
                    onUpdateLayoutSettings({ paragraphSpacingAfter: Number(event.target.value) })
                  }
                />
              </label>

              <label className="control">
                <span>Photo placement</span>
                <select value={document.layoutSettings.heroPhotoMode} onChange={(event) => onUpdateLayoutSettings({ heroPhotoMode: event.target.value as HeroPhotoMode })}>
                  {heroPhotoModes.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="control slider-control">
                <span>Hero photo size {document.layoutSettings.heroPhotoSize}px</span>
                <input max="220" min="40" step="2" type="range" value={document.layoutSettings.heroPhotoSize} onChange={(event) => onUpdateLayoutSettings({ heroPhotoSize: Number(event.target.value) })} />
              </label>

              <label className="control">
                <span>Corners</span>
                <select value={document.layoutSettings.surfaceStyle.cornerStyle} onChange={(event) => onUpdateLayoutSettings({ surfaceStyle: { ...document.layoutSettings.surfaceStyle, cornerStyle: event.target.value as CornerStyle } })}>
                  {cornerChoices.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="control">
                <span>Shadow</span>
                <select value={document.layoutSettings.surfaceStyle.shadowStyle} onChange={(event) => onUpdateLayoutSettings({ surfaceStyle: { ...document.layoutSettings.surfaceStyle, shadowStyle: event.target.value as ShadowStyle } })}>
                  {shadowChoices.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="control">
                <span>Border</span>
                <select value={document.layoutSettings.surfaceStyle.borderMode} onChange={(event) => onUpdateLayoutSettings({ surfaceStyle: { ...document.layoutSettings.surfaceStyle, borderMode: event.target.value as BorderMode } })}>
                  {borderChoices.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}
        </div>

        <div className="studio-group compact-group">
          <button aria-label={collapsedGroups.hidden ? "Expand hidden sections" : "Collapse hidden sections"} className="block-toggle studio-toggle" onClick={() => toggleGroup("hidden")} type="button">
            <strong>Hidden sections</strong>
            <span className="toggle-arrow" aria-hidden="true">{collapsedGroups.hidden ? "▾" : "▴"}</span>
          </button>

          {!collapsedGroups.hidden ? (
            <>
              <div className="hidden-section-list compact-hidden-section-list">
                {hiddenSections.map((section) => (
                  <button key={section.type} className="hidden-section-chip" onClick={() => onRevealSection(section.type)} type="button">
                    {section.title}
                  </button>
                ))}

                {hiddenCustomSections.map((section) => (
                  <button
                    key={section.id}
                    className="hidden-section-chip"
                    onClick={() => onRestoreSection(section.id)}
                    type="button"
                  >
                    Restore {section.title}
                  </button>
                ))}

                <button className="hidden-section-chip" onClick={onAddCustomSection} type="button">
                  Add custom section
                </button>
              </div>

              {hiddenSections.length === 0 && hiddenCustomSections.length === 0 ? (
                <p className="meta-copy">All hidden sections are already restored.</p>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="studio-group compact-group">
          <button aria-label={collapsedGroups.sections ? "Expand sections" : "Collapse sections"} className="block-toggle studio-toggle" onClick={() => toggleGroup("sections")} type="button">
            <strong>Sections</strong>
            <span className="toggle-arrow" aria-hidden="true">{collapsedGroups.sections ? "▾" : "▴"}</span>
          </button>

          {!collapsedGroups.sections ? (
            <div className="compact-section-list">
              {sections.map((section) => {
                const collapsed = collapsedSections[section.id] ?? true;

                return (
                  <div
                    key={section.id}
                    className={`section-card compact-card${selectedSectionId === section.id ? " selected" : ""}${collapsed ? " collapsed" : ""}`}
                    draggable
                    onClick={() => onSelect(section.id)}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      onContextMenuOpen(event, section.id);
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDragStart={(event) => {
                      event.dataTransfer.setData("application/x-cvcreator-section", section.id);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onDrop={(event) => {
                      event.preventDefault();

                      const movedSectionId = event.dataTransfer.getData("application/x-cvcreator-section");
                      const revealedType = event.dataTransfer.getData("application/x-cvcreator-library") as SectionType;

                      if (movedSectionId) {
                        onMoveSection(movedSectionId, section.id);
                      }

                      if (revealedType) {
                        onRevealSection(revealedType, section.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="section-card-header compact-header">
                      <div>
                        <h3>{section.title}</h3>
                        <p className="meta-copy compact-meta">{sectionMeta(section)}</p>
                      </div>

                      <div className="section-badges compact-badges">
                        <button
                          aria-label={collapsed ? `Expand ${section.title}` : `Collapse ${section.title}`}
                          className="ghost-button compact-button icon-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleSection(section.id);
                          }}
                          type="button"
                        >
                          <span className="toggle-arrow" aria-hidden="true">{collapsed ? "▾" : "▴"}</span>
                        </button>
                      </div>
                    </div>

                    {!collapsed ? (
                      <div className="section-card-footer compact-footer">
                        <span className="meta-copy">H {section.frame.minHeight}px · P {section.frame.padding}px · T {section.frame.fontScale.toFixed(2)}x · L {section.frame.lineHeightMultiplier.toFixed(2)}x</span>
                        <button
                          className="ghost-button compact-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onHideSection(section.id);
                          }}
                          type="button"
                        >
                          Hide
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};
