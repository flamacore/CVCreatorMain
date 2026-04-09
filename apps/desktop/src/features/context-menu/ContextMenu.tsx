import { useEffect } from "react";

export interface ContextMenuItem {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

export interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

interface ContextMenuProps {
  menu: ContextMenuState | null;
  onClose: () => void;
}

export const ContextMenu = ({ menu, onClose }: ContextMenuProps) => {
  useEffect(() => {
    if (!menu) {
      return undefined;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [menu, onClose]);

  if (!menu) {
    return null;
  }

  return (
    <div className="context-menu-layer" onClick={onClose} onContextMenu={(event) => event.preventDefault()}>
      <div className="context-menu" style={{ left: menu.x, top: menu.y }} onClick={(event) => event.stopPropagation()}>
        {menu.items.map((item) => (
          <button
            key={item.label}
            className={`context-menu-item${item.destructive ? " destructive" : ""}`}
            disabled={item.disabled}
            onClick={() => {
              if (item.disabled) {
                return;
              }

              item.onSelect();
              onClose();
            }}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
