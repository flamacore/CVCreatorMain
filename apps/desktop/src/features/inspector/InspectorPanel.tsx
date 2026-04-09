import { useEffect, useState, type MouseEvent } from "react";

import type { SectionFrame, SectionInstance, SectionPlacement } from "@cvcreator/document-model";

import { RichTextEditor } from "./RichTextEditor";

interface InspectorPanelProps {
  section: SectionInstance | null;
  onTitleChange: (sectionId: string, title: string) => void;
  onPlacementChange: (sectionId: string, placement: SectionPlacement) => void;
  onSectionFrameChange: (sectionId: string, patch: Partial<SectionFrame>) => void;
  onAddField: (sectionId: string, itemId: string) => void;
  onAddItem: (sectionId: string) => void;
  onDuplicateItem: (sectionId: string, itemId: string) => void;
  onMoveItem: (sectionId: string, itemId: string, targetItemId: string) => void;
  onFieldLabelChange: (sectionId: string, itemId: string, fieldId: string, label: string) => void;
  onFieldLabelVisibilityChange: (sectionId: string, itemId: string, fieldId: string, showLabel: boolean) => void;
  onFieldVisibilityChange: (sectionId: string, itemId: string, fieldId: string, visible: boolean) => void;
  onRemoveItem: (sectionId: string, itemId: string) => void;
  onRemoveField: (sectionId: string, itemId: string, fieldId: string) => void;
  onItemContextMenuOpen: (event: MouseEvent<HTMLDivElement>, sectionId: string, itemId: string) => void;
  onFieldChange: (sectionId: string, itemId: string, fieldId: string, value: string) => void;
  onItemMarkdownChange: (sectionId: string, itemId: string, markdown: string) => void;
  onItemHtmlChange: (sectionId: string, itemId: string, html: string) => void;
  onSectionMarkdownChange: (sectionId: string, markdown: string) => void;
  onSectionHtmlChange: (sectionId: string, html: string) => void;
  onPhotoUrlChange: (sectionId: string, photoUrl: string | null) => void;
}

const handlePhotoFile = (
  event: React.ChangeEvent<HTMLInputElement>,
  sectionId: string,
  onPhotoUrlChange: (sectionId: string, photoUrl: string | null) => void,
) => {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => onPhotoUrlChange(sectionId, typeof reader.result === "string" ? reader.result : null);
  reader.readAsDataURL(file);
};

export const InspectorPanel = ({
  section,
  onTitleChange,
  onPlacementChange,
  onSectionFrameChange,
  onAddField,
  onAddItem,
  onDuplicateItem,
  onMoveItem,
  onFieldLabelChange,
  onFieldLabelVisibilityChange,
  onFieldVisibilityChange,
  onRemoveItem,
  onRemoveField,
  onItemContextMenuOpen,
  onFieldChange,
  onItemMarkdownChange,
  onItemHtmlChange,
  onSectionMarkdownChange,
  onSectionHtmlChange,
  onPhotoUrlChange,
}: InspectorPanelProps) => {
  const [openBlocks, setOpenBlocks] = useState<Record<string, boolean>>({
    sizing: false,
    photo: false,
    items: false,
    markdown: false,
    html: false,
  });
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpenBlocks({
      sizing: false,
      photo: false,
      items: false,
      markdown: false,
      html: false,
    });

    setOpenItems({});
  }, [section?.id]);

  if (!section) {
    return (
      <aside className="panel inspector-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Inspector</p>
            <h2>Select a section.</h2>
          </div>
        </div>
      </aside>
    );
  }

  const toggleBlock = (key: string) => {
    setOpenBlocks((current) => ({
      ...current,
      [key]: !(current[key] ?? false),
    }));
  };

  const toggleItem = (itemId: string) => {
    setOpenItems((current) => ({
      ...current,
      [itemId]: !(current[itemId] ?? false),
    }));
  };

  const canEditFieldStructure = section.type === "custom";

  return (
    <aside className="panel inspector-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Inspector</p>
          <h2>{section.title}</h2>
        </div>
      </div>

      <div className="inspector-stack compact-stack">
        <label className="control">
          <span>Section title</span>
          <input value={section.title} onChange={(event) => onTitleChange(section.id, event.target.value)} />
        </label>

        <label className="control">
          <span>Placement</span>
          <select
            value={section.placement}
            onChange={(event) => onPlacementChange(section.id, event.target.value as SectionPlacement)}
          >
            <option value="main">Main column</option>
            <option value="sidebar">Sidebar</option>
          </select>
        </label>

        <div className="inspector-block foldable-block compact-group">
          <button aria-label={openBlocks.sizing ? "Collapse area sizing" : "Expand area sizing"} className="block-toggle" onClick={() => toggleBlock("sizing")} type="button">
            <strong>Area sizing</strong>
            <span className="toggle-arrow" aria-hidden="true">{openBlocks.sizing ? "▴" : "▾"}</span>
          </button>

          {openBlocks.sizing ? (
            <>
              <p className="meta-copy">Move with drag, resize here.</p>

              <label className="control slider-control">
                <span>Minimum height {section.frame.minHeight}px</span>
                <input
                  max="540"
                  min="32"
                  step="4"
                  type="range"
                  value={section.frame.minHeight}
                  onChange={(event) => onSectionFrameChange(section.id, { minHeight: Number(event.target.value) })}
                />
              </label>

              <label className="control slider-control">
                <span>Inner padding {section.frame.padding}px</span>
                <input
                  max="40"
                  min="2"
                  step="1"
                  type="range"
                  value={section.frame.padding}
                  onChange={(event) => onSectionFrameChange(section.id, { padding: Number(event.target.value) })}
                />
              </label>

              <label className="control slider-control">
                <span>Text scale {section.frame.fontScale.toFixed(2)}x</span>
                <input
                  max="1.5"
                  min="0.4"
                  step="0.05"
                  type="range"
                  value={section.frame.fontScale}
                  onChange={(event) => onSectionFrameChange(section.id, { fontScale: Number(event.target.value) })}
                />
              </label>

              <label className="control slider-control">
                <span>
                  Area line height {section.frame.lineHeightMultiplier.toFixed(2)}x
                </span>
                <input
                  max="4"
                  min="0.25"
                  step="0.05"
                  type="range"
                  value={section.frame.lineHeightMultiplier}
                  onChange={(event) =>
                    onSectionFrameChange(section.id, { lineHeightMultiplier: Number(event.target.value) })
                  }
                />
              </label>
            </>
          ) : null}
        </div>

        {section.type === "photo" ? (
          <div className="inspector-block foldable-block compact-group">
            <button aria-label={openBlocks.photo ? "Collapse photo" : "Expand photo"} className="block-toggle" onClick={() => toggleBlock("photo")} type="button">
              <strong>Photo</strong>
              <span className="toggle-arrow" aria-hidden="true">{openBlocks.photo ? "▴" : "▾"}</span>
            </button>

            {openBlocks.photo ? (
              <>
                <label className="control">
                  <span>Photo URL</span>
                  <input
                    placeholder="https://... or data URL"
                    value={section.photoUrl ?? ""}
                    onChange={(event) => onPhotoUrlChange(section.id, event.target.value || null)}
                  />
                </label>

                <label className="control">
                  <span>Upload photo</span>
                  <input type="file" accept="image/*" onChange={(event) => handlePhotoFile(event, section.id, onPhotoUrlChange)} />
                </label>
              </>
            ) : null}
          </div>
        ) : null}

        {section.type !== "photo" ? (
          <div className="inspector-block foldable-block compact-group">
            <button aria-label={openBlocks.items ? "Collapse structured items" : "Expand structured items"} className="block-toggle" onClick={() => toggleBlock("items")} type="button">
              <strong>Structured items</strong>
              <span className="toggle-arrow" aria-hidden="true">{openBlocks.items ? "▴" : "▾"}</span>
            </button>

            {openBlocks.items ? (
              <>
                <div className="inline-heading compact-actions-row">
                  <span className="meta-copy">Drag entries to reorder. Right-click for the item menu.</span>
                  <button className="ghost-button compact-button" onClick={() => onAddItem(section.id)} type="button">
                    Add entry
                  </button>
                </div>

                {section.items.map((item) => (
                  <div
                    key={item.id}
                    className="item-card foldable-item"
                    draggable
                    onContextMenu={(event) => {
                      event.preventDefault();
                      onItemContextMenuOpen(event, section.id, item.id);
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDragStart={(event) => {
                      event.dataTransfer.setData(
                        "application/x-cvcreator-item",
                        JSON.stringify({ sectionId: section.id, itemId: item.id }),
                      );
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const serialized = event.dataTransfer.getData("application/x-cvcreator-item");

                      if (!serialized) {
                        return;
                      }

                      const payload = JSON.parse(serialized) as { sectionId: string; itemId: string };

                      if (payload.sectionId === section.id) {
                        onMoveItem(section.id, payload.itemId, item.id);
                      }
                    }}
                  >
                    <button aria-label={openItems[item.id] ? "Collapse entry" : "Expand entry"} className="block-toggle item-toggle" onClick={() => toggleItem(item.id)} type="button">
                      <strong>Entry</strong>
                      <span className="toggle-arrow" aria-hidden="true">{openItems[item.id] ? "▴" : "▾"}</span>
                    </button>

                    <div className="item-actions compact-item-actions">
                      <button className="ghost-button compact-button" onClick={() => onDuplicateItem(section.id, item.id)} type="button">
                        Duplicate
                      </button>
                      <button className="ghost-button compact-button" onClick={() => onRemoveItem(section.id, item.id)} type="button">
                        Remove
                      </button>
                    </div>

                    {openItems[item.id] ? (
                      <>
                        {item.fields.map((field) => (
                          <div
                            key={field.id}
                            className={`field-editor${field.visible ? "" : " field-editor-hidden"}`}
                          >
                            <div className="field-editor-header">
                              <strong className="field-editor-title">{field.label || "Untitled part"}</strong>

                              <div className="field-toggle-row">
                                <button
                                  aria-pressed={field.visible}
                                  className={`${field.visible ? "secondary-button" : "ghost-button"} compact-button`}
                                  onClick={() => onFieldVisibilityChange(section.id, item.id, field.id, !field.visible)}
                                  type="button"
                                >
                                  Part
                                </button>
                                <button
                                  aria-pressed={field.showLabel}
                                  className={`${field.showLabel ? "secondary-button" : "ghost-button"} compact-button`}
                                  onClick={() =>
                                    onFieldLabelVisibilityChange(section.id, item.id, field.id, !field.showLabel)
                                  }
                                  type="button"
                                >
                                  Title
                                </button>
                                {canEditFieldStructure && item.fields.length > 1 ? (
                                  <button
                                    className="ghost-button compact-button"
                                    onClick={() => onRemoveField(section.id, item.id, field.id)}
                                    type="button"
                                  >
                                    Remove part
                                  </button>
                                ) : null}
                              </div>
                            </div>

                            <label className="control">
                              <span>Part title</span>
                              <input
                                value={field.label}
                                onChange={(event) =>
                                  onFieldLabelChange(section.id, item.id, field.id, event.target.value)
                                }
                              />
                            </label>

                            <label className="control">
                              <span>Part value</span>
                              <input
                                value={field.value}
                                onChange={(event) => onFieldChange(section.id, item.id, field.id, event.target.value)}
                              />
                            </label>
                          </div>
                        ))}

                        {canEditFieldStructure ? (
                          <button
                            className="ghost-button compact-button"
                            onClick={() => onAddField(section.id, item.id)}
                            type="button"
                          >
                            Add part
                          </button>
                        ) : null}

                        {section.allowMarkdown ? (
                          <RichTextEditor
                            label="Entry Markdown"
                            mode="markdown"
                            rows={4}
                            value={item.markdown}
                            onChange={(value) => onItemMarkdownChange(section.id, item.id, value)}
                          />
                        ) : null}

                        {section.allowHtml ? (
                          <RichTextEditor
                            label="Entry HTML"
                            mode="html"
                            rows={4}
                            value={item.html ?? ""}
                            onChange={(value) => onItemHtmlChange(section.id, item.id, value)}
                          />
                        ) : null}
                      </>
                    ) : null}
                  </div>
                ))}
              </>
            ) : null}
          </div>
        ) : null}

        {section.allowMarkdown ? (
          <div className="inspector-block foldable-block compact-group">
            <button aria-label={openBlocks.markdown ? "Collapse markdown override" : "Expand markdown override"} className="block-toggle" onClick={() => toggleBlock("markdown")} type="button">
              <strong>Area Markdown Override</strong>
              <span className="toggle-arrow" aria-hidden="true">{openBlocks.markdown ? "▴" : "▾"}</span>
            </button>

            {openBlocks.markdown ? (
              <RichTextEditor
                label="Area Markdown Override"
                mode="markdown"
                rows={5}
                value={section.markdown}
                onChange={(value) => onSectionMarkdownChange(section.id, value)}
              />
            ) : null}
          </div>
        ) : null}

        {section.allowHtml ? (
          <div className="inspector-block foldable-block compact-group">
            <button aria-label={openBlocks.html ? "Collapse HTML override" : "Expand HTML override"} className="block-toggle" onClick={() => toggleBlock("html")} type="button">
              <strong>Area HTML Override</strong>
              <span className="toggle-arrow" aria-hidden="true">{openBlocks.html ? "▴" : "▾"}</span>
            </button>

            {openBlocks.html ? (
              <RichTextEditor
                label="Area HTML Override"
                mode="html"
                rows={6}
                value={section.html ?? ""}
                onChange={(value) => onSectionHtmlChange(section.id, value)}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  );
};
