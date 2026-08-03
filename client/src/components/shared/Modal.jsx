import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const SIZE_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
};

/**
 * Enterprise-grade base modal -- portaled to document.body (so it's never
 * clipped by an ancestor's overflow:hidden/auto, e.g. DataTable's scroll
 * wrapper), with a focus trap, Escape-to-close, and scroll-lock built in.
 *
 * `size` accepts either a token ("sm".."3xl") or a raw Tailwind max-w-*
 * class for backward compatibility with earlier callers.
 *
 * For a critical confirmation the user must not dismiss by accident (e.g.
 * a one-time secret), pass `dismissible={false}` -- backdrop click and
 * Escape are both disabled, and the close button is hidden; the caller's
 * own explicit action is the only way out.
 */
const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  description,
  footer,
  size = "md",
  dismissible = true,
  icon: Icon,
  iconTone = "primary",
}) => {
  const dialogRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";
    previouslyFocused.current = document.activeElement;
    dialogRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && dismissible) {
        onClose?.();
        return;
      }
      // Minimal focus trap -- keeps Tab cycling within the dialog.
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "auto";
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen, dismissible, onClose]);

  const sizeClass = SIZE_CLASSES[size] ?? size;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-100 flex items-center justify-center bg-gray-900/50 backdrop-blur-[2px] p-4"
          onMouseDown={(e) => {
            if (dismissible && e.target === e.currentTarget) onClose?.();
          }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`relative w-full ${sizeClass} max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl outline-none`}
          >
            {dismissible && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            )}

            {(title || Icon) && (
              <div className="flex items-start gap-3 border-b border-gray-100 px-6 pt-6 pb-5">
                {Icon && (
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      iconTone === "success"
                        ? "bg-green-50 text-green-600"
                        : iconTone === "danger"
                          ? "bg-red-50 text-red-600"
                          : iconTone === "warning"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-primaryBlueLight text-primaryBlue"
                    }`}
                  >
                    <Icon size={20} />
                  </span>
                )}
                <div className="min-w-0">
                  {title && (
                    <h2 id="modal-title" className="font-bold text-gray-900">
                      {title}
                    </h2>
                  )}
                  {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
                </div>
              </div>
            )}

            <div className={title || Icon ? "px-6 py-5" : "p-6"}>{children}</div>

            {footer && <div className="flex gap-3 border-t border-gray-100 px-6 py-4">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default Modal;
