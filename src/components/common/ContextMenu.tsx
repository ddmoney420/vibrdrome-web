import { useState, useRef, useEffect } from 'react';

interface MenuItem {
  label: string;
  icon?: string;
  onClick: () => void;
  danger?: boolean;
}

interface ContextMenuProps {
  items: MenuItem[];
  trigger: React.ReactNode;
}

export default function ContextMenu({ items, trigger }: ContextMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Adjust position if menu overflows viewport
  useEffect(() => {
    if (!open || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    if (rect.bottom > window.innerHeight) {
      menuRef.current.style.bottom = '100%';
      menuRef.current.style.top = 'auto';
      menuRef.current.style.marginBottom = '4px';
    }
    if (rect.right > window.innerWidth) {
      menuRef.current.style.right = '0';
      menuRef.current.style.left = 'auto';
    }
  }, [open]);

  return (
    <div className="relative">
      <div
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        {trigger}
      </div>

      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-lg border border-border bg-bg-secondary py-1 shadow-xl"
        >
          {items.map((item, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-bg-tertiary ${
                item.danger ? 'text-red-400' : 'text-text-primary'
              }`}
            >
              {item.icon && <span className="text-base">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
