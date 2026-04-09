import type { LayoutPreset, ThemePreset } from "@cvcreator/document-model";

interface CommandBarProps {
  title: string;
  fileLabel: string;
  updatedAt: string;
  saveStatus: "hydrating" | "idle" | "saving" | "saved" | "error";
  persistenceRuntime: "tauri" | "browser";
  persistedAt: string;
  revisionCount: number;
  saveError: string | null;
  appThemePresets: ThemePreset[];
  selectedAppThemeId: string;
  themePresets: ThemePreset[];
  selectedThemeId: string;
  layoutPresets: LayoutPreset[];
  selectedLayoutId: string;
  density: number;
  accentColor: string;
  onAppThemeChange: (themeId: string) => void;
  onThemeChange: (themeId: string) => void;
  onLayoutChange: (layoutId: string) => void;
  onDensityChange: (density: number) => void;
  onAccentColorChange: (color: string) => void;
  onLoadDocument: () => void;
  onSaveDocument: () => void;
  onExportJson: () => void;
  onExportHtml: () => void;
  onExportPdf: () => void;
  onReset: () => void;
}

export const CommandBar = ({
  title,
  fileLabel,
  updatedAt,
  saveStatus,
  persistenceRuntime,
  persistedAt,
  revisionCount,
  saveError,
  appThemePresets,
  selectedAppThemeId,
  themePresets,
  selectedThemeId,
  layoutPresets,
  selectedLayoutId,
  density,
  accentColor,
  onAppThemeChange,
  onThemeChange,
  onLayoutChange,
  onDensityChange,
  onAccentColorChange,
  onLoadDocument,
  onSaveDocument,
  onExportJson,
  onExportHtml,
  onExportPdf,
  onReset,
}: CommandBarProps) => {
  const updatedLabel = new Date(updatedAt).toLocaleString();
  const saveLabel =
    saveStatus === "hydrating"
      ? "Loading local resume"
      : saveStatus === "saving"
        ? "Saving locally"
        : saveStatus === "saved"
          ? `Saved ${new Date(persistedAt).toLocaleTimeString()}`
          : saveStatus === "error"
            ? "Local save failed"
            : "Ready to save";
  const saveChipClassName = `status-chip${saveStatus === "saved" || saveStatus === "saving" ? " active" : ""}${saveStatus === "error" ? " error" : ""}`;

  return (
    <header className="command-bar panel">
      <div className="command-bar-summary">
        <p className="eyebrow">CVCreator</p>
        <h1>{title}</h1>
        <div className="command-bar-meta-row">
          <span className="status-chip">Updated {updatedLabel}</span>
          <span className={saveChipClassName}>{saveLabel}</span>
        </div>
        <p className="meta-copy command-bar-submeta">Runtime {persistenceRuntime} · File {fileLabel} · {revisionCount} retained revisions</p>
        {saveError ? <p className="meta-copy error-copy">{saveError}</p> : null}
      </div>

      <div className="command-bar-controls">
        <label className="control">
          <span>App theme</span>
          <select value={selectedAppThemeId} onChange={(event) => onAppThemeChange(event.target.value)}>
            {appThemePresets.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </label>

        <label className="control">
          <span>CV theme</span>
          <select value={selectedThemeId} onChange={(event) => onThemeChange(event.target.value)}>
            {themePresets.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </label>

        <label className="control">
          <span>Layout</span>
          <select value={selectedLayoutId} onChange={(event) => onLayoutChange(event.target.value)}>
            {layoutPresets.map((layout) => (
              <option key={layout.id} value={layout.id}>
                {layout.name}
              </option>
            ))}
          </select>
        </label>

        <label className="control slider-control">
          <span>Density {density.toFixed(2)}x</span>
          <input
            max="1.2"
            min="0.2"
            onChange={(event) => onDensityChange(Number(event.target.value))}
            step="0.05"
            type="range"
            value={density}
          />
        </label>

        <label className="control accent-control">
          <span>CV accent</span>
          <input type="color" value={accentColor} onChange={(event) => onAccentColorChange(event.target.value)} />
        </label>

        <button className="secondary-button" onClick={onReset} type="button">
          Reset starter
        </button>
      </div>

      <div className="command-bar-actions">
        <button className="ghost-button" onClick={onLoadDocument} type="button">
          Load CV
        </button>
        <button className="secondary-button" onClick={onSaveDocument} type="button">
          Save CV
        </button>
        <button className="ghost-button" onClick={onExportPdf} type="button">
          Export PDF
        </button>
        <button className="ghost-button" onClick={onExportJson} type="button">
          Export JSON
        </button>
        <button className="ghost-button" onClick={onExportHtml} type="button">
          Export HTML
        </button>
      </div>
    </header>
  );
};
