import type { SectionType } from "@cvcreator/document-model";

import type { LibrarySection } from "../state/useResumeBuilder";

interface SectionLibraryProps {
  sections: LibrarySection[];
  onAdd: (sectionType: SectionType) => void;
  onContextMenuOpen: (event: React.MouseEvent<HTMLButtonElement>, sectionType: SectionType) => void;
}

export const SectionLibrary = ({ sections, onAdd, onContextMenuOpen }: SectionLibraryProps) => (
  <aside className="panel library-panel">
    <div className="panel-heading">
      <div>
        <p className="eyebrow">Section Library</p>
        <h2>Every core area starts optional.</h2>
      </div>
    </div>

    <div className="library-list">
      {sections.map((section) => (
        <button
          key={section.type}
          className="library-card"
          draggable
          onClick={() => onAdd(section.type)}
          onContextMenu={(event) => {
            event.preventDefault();
            onContextMenuOpen(event, section.type);
          }}
          onDragStart={(event) => {
            event.dataTransfer.setData("application/x-cvcreator-library", section.type);
            event.dataTransfer.effectAllowed = "copyMove";
          }}
          type="button"
        >
          <div className="library-card-header">
            <strong>{section.title}</strong>
            <span className={`status-chip${section.isVisible ? " active" : ""}`}>
              {section.isVisible ? "On canvas" : "Optional"}
            </span>
          </div>
          <span className="meta-copy">{section.summary}</span>
          <span className="meta-copy">Default placement: {section.placement}</span>
        </button>
      ))}
    </div>
  </aside>
);
