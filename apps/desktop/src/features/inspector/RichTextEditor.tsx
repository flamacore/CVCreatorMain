import { useRef } from "react";

type RichTextMode = "markdown" | "html";

interface RichTextEditorProps {
  label: string;
  mode: RichTextMode;
  rows?: number;
  value: string;
  onChange: (value: string) => void;
}

const applyMarkdownWrap = (text: string, before: string, after: string) => `${before}${text || "text"}${after}`;

const applyHtmlWrap = (text: string, tag: string) => `<${tag}>${text || "text"}</${tag}>`;

export const RichTextEditor = ({ label, mode, rows = 5, value, onChange }: RichTextEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const withSelection = (transform: (selection: string) => string) => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const selection = value.slice(selectionStart, selectionEnd);
    const inserted = transform(selection);
    const nextValue = `${value.slice(0, selectionStart)}${inserted}${value.slice(selectionEnd)}`;

    onChange(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionStart, selectionStart + inserted.length);
    });
  };

  const applyBold = () =>
    withSelection((selection) =>
      mode === "markdown" ? applyMarkdownWrap(selection, "**", "**") : applyHtmlWrap(selection, "strong"),
    );

  const applyItalic = () =>
    withSelection((selection) =>
      mode === "markdown" ? applyMarkdownWrap(selection, "_", "_") : applyHtmlWrap(selection, "em"),
    );

  const applyUnderline = () => withSelection((selection) => applyHtmlWrap(selection, "u"));

  const applyBullets = () =>
    withSelection((selection) => {
      const normalized = selection.trim() || "List item";
      const lines = normalized.split(/\r?\n/).map((line) => line.replace(/^[-*]\s*/, "").trim());

      if (mode === "markdown") {
        return lines.map((line) => `- ${line}`).join("\n");
      }

      return `<ul>${lines.map((line) => `<li>${line}</li>`).join("")}</ul>`;
    });

  const applyLink = () =>
    withSelection((selection) => {
      const content = selection || "Link text";
      return mode === "markdown" ? `[${content}](https://example.com)` : `<a href="https://example.com">${content}</a>`;
    });

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }

    const key = event.key.toLowerCase();

    if (key === "b") {
      event.preventDefault();
      applyBold();
      return;
    }

    if (key === "i") {
      event.preventDefault();
      applyItalic();
      return;
    }

    if (key === "u") {
      event.preventDefault();
      applyUnderline();
      return;
    }

    if (key === "k") {
      event.preventDefault();
      applyLink();
    }
  };

  return (
    <div className="rich-editor control">
      <span>{label}</span>
      <div className="rich-toolbar" role="toolbar" aria-label={`${label} toolbar`}>
        <button className="toolbar-button" onClick={applyBold} type="button" title="Bold (Ctrl+B)">
          B
        </button>
        <button className="toolbar-button" onClick={applyItalic} type="button" title="Italic (Ctrl+I)">
          I
        </button>
        <button className="toolbar-button" onClick={applyUnderline} type="button" title="Underline (Ctrl+U)">
          U
        </button>
        <button className="toolbar-button" onClick={applyBullets} type="button" title="Bullet list">
          • List
        </button>
        <button className="toolbar-button" onClick={applyLink} type="button" title="Link (Ctrl+K)">
          Link
        </button>
      </div>
      <textarea ref={textareaRef} rows={rows} value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={onKeyDown} />
    </div>
  );
};
