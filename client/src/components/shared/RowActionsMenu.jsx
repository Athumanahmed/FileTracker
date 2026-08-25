import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useClickAway } from "react-use";
import { MoreVertical } from "lucide-react";

const VIEWPORT_MARGIN = 8;
const TRIGGER_GAP = 6;

/** Renders as a Link (to), an anchor (href), or a button (onClick) -- same convention as PageHeader's action items. */
const ActionItem = ({ label, icon: Icon, to, state, href, onClick, disabled, variant = "default", onDone }) => {
  const className = `flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
    variant === "danger" ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50"
  }`;

  const content = (
    <>
      {Icon && <Icon size={15} className="shrink-0" />}
      {label}
    </>
  );

  if (to) {
    return (
      <Link to={to} state={state} className={className} onClick={onDone} role="menuitem">
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={onDone} role="menuitem">
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={() => {
        onClick?.();
        onDone();
      }}
      className={className}
    >
      {content}
    </button>
  );
};

/**
 * Single source of truth for row-level action menus across every
 * DataTable in the app -- one kebab trigger, a flyout menu of actions.
 * `actions` is a flat array; include `{ type: "divider" }` entries to
 * group items visually.
 *
 * Portaled to document.body and positioned with `fixed` coordinates
 * measured from the trigger's real screen position -- required because
 * DataTable's horizontal-scroll wrapper has `overflow-auto`, which would
 * otherwise clip any absolutely-positioned dropdown the moment it tried
 * to extend past that container's edge (including flipping upward for a
 * table's last few rows). Position is remeasured against the menu's
 * *actual* rendered size each time it opens, then flips up/clamps
 * horizontally whenever the default placement would run off-screen.
 *
 * Usage:
 *   <RowActionsMenu actions={[
 *     { label: "View", icon: Eye, onClick: () => ... },
 *     { type: "divider" },
 *     { label: "Deactivate", icon: UserX, variant: "danger", onClick: () => ... },
 *   ]} />
 */
const RowActionsMenu = ({ actions = [], align = "end", label = "Row actions" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [style, setStyle] = useState({ top: -9999, left: -9999, visibility: "hidden" });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useClickAway(menuRef, (e) => {
    if (triggerRef.current?.contains(e.target)) return; // let the trigger's own onClick handle its toggle
    setIsOpen(false);
  });

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current || !menuRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();

    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const openUpward =
      spaceBelow < menuRect.height + VIEWPORT_MARGIN && triggerRect.top > menuRect.height + VIEWPORT_MARGIN;

    const top = openUpward
      ? Math.max(VIEWPORT_MARGIN, triggerRect.top - menuRect.height - TRIGGER_GAP)
      : Math.min(triggerRect.bottom + TRIGGER_GAP, window.innerHeight - menuRect.height - VIEWPORT_MARGIN);

    const rawLeft = align === "end" ? triggerRect.right - menuRect.width : triggerRect.left;
    const left = Math.min(Math.max(rawLeft, VIEWPORT_MARGIN), window.innerWidth - menuRect.width - VIEWPORT_MARGIN);

    setStyle({ top, left, visibility: "visible" });
  }, [isOpen, align, actions.length]);

  useEffect(() => {
    if (!isOpen) return;

    const close = () => setIsOpen(false);
    const handleKeyDown = (e) => {
      if (e.key === "Escape") close();
    };
    // capture: true -- scroll events on nested scrollable ancestors (e.g.
    // DataTable's overflow-auto wrapper) don't bubble, but capture-phase
    // listeners on window still see them. Closing on scroll sidesteps
    // having to continuously reposition a fixed-position portal.
    //
    // Attaching this on the very next frame (not synchronously) matters --
    // the trigger's own opening click can itself cause a native scroll
    // (e.g. the browser nudging a focused element into view, or a trackpad
    // tap registering a sub-pixel wheel delta), which fires 'scroll'
    // asynchronously and would otherwise land right after this listener
    // attaches, closing the menu the same click just opened it with.
    const raf = requestAnimationFrame(() => {
      window.addEventListener("scroll", close, true);
    });
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", close, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={label}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: "fixed", top: style.top, left: style.left, visibility: style.visibility }}
            className="z-50 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white py-1.5 shadow-lg"
          >
            {actions.map((action, index) =>
              action.type === "divider" ? (
                <div key={`divider-${index}`} className="my-1.5 border-t border-gray-100" />
              ) : (
                <ActionItem key={action.label} {...action} onDone={() => setIsOpen(false)} />
              ),
            )}
          </div>,
          document.body,
        )}
    </>
  );
};

export default RowActionsMenu;
