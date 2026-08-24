import { Loader2 } from "lucide-react";
import Modal from "../shared/Modal";

const CONFIRM_BUTTON_CLASS = {
  danger: "bg-red-600 hover:bg-red-700",
  warning: "bg-amber-600 hover:bg-amber-700",
  primary: "bg-primaryBlue hover:bg-primaryBlueDark",
};

/** Shared confirm dialog for Activate/Deactivate/Lock/Unlock -- same shape, differ only in copy, icon, and tone. */
const ConfirmAccountActionModal = ({
  isOpen,
  onClose,
  onConfirm,
  isPending,
  title,
  description,
  confirmLabel,
  icon,
  tone = "primary",
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
          Cancel
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
    {null}
  </Modal>
);

export default ConfirmAccountActionModal;
