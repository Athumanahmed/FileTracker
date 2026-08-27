import { Loader2 } from "lucide-react";
import Modal from "./Modal";

const CONFIRM_BUTTON_CLASS = {
  danger: "bg-red-600 hover:bg-red-700",
  warning: "bg-amber-600 hover:bg-amber-700",
  primary: "bg-primaryBlue hover:bg-primaryBlueDark",
};

/**
 * Generic confirm dialog -- one destructive/irreversible action the user
 * must acknowledge, differing only in copy, icon, and tone. Same shape as
 * users/ConfirmAccountActionModal, lifted to shared/ so the organizational
 * catalog modules (Department/Unit/Role/Permission deactivate/reactivate)
 * reuse it instead of each rebuilding the same dialog.
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  isPending = false,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  icon,
  tone = "primary",
  children,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    description={description}
    icon={icon}
    iconTone={tone === "primary" ? "primary" : tone}
    size="sm"
    dismissible={!isPending}
    footer={
      <>
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${CONFIRM_BUTTON_CLASS[tone]}`}
        >
          {isPending && <Loader2 size={16} className="animate-spin" />}
          {confirmLabel}
        </button>
      </>
    }
  >
    {children ?? null}
  </Modal>
);

export default ConfirmDialog;
