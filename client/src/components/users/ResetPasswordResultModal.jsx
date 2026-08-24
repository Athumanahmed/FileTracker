import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { KeyRound, AlertTriangle, Copy, Check } from "lucide-react";

/**
 * Shown immediately after an admin resets a user's password -- the plain
 * text password is only ever returned once by the API (see
 * server/controller/userPasswordAdmin.controller.js), so this is the one
 * place that reveals it. Deliberately does NOT close on backdrop click,
 * same reasoning as UserCreatedSuccessModal -- losing it here means
 * generating a brand new one just to recover.
 */
const ResetPasswordResultModal = ({ username, newPassword, onDone }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onDone();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy automatically -- select and copy the password manually.");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-gray-900/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-password-title"
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex flex-col items-center text-center px-6 pt-7 pb-5 border-b border-gray-100">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primaryBlueLight text-primaryBlue mb-3">
            <KeyRound size={28} />
          </span>
          <h2 id="reset-password-title" className="text-lg font-bold text-gray-900">
            Password Reset Successfully
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            A new temporary password was generated for <strong>{username}</strong>.
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex gap-2.5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="text-xs leading-relaxed text-amber-800">
              This password is shown <strong>only once</strong>. Copy it now and share it securely with{" "}
              {username} — it cannot be retrieved again after you leave this screen.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New Password</label>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="flex-1 select-all rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 font-mono text-sm text-gray-800 overflow-x-auto">
                {newPassword}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy password"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                  copied ? "border-green-200 bg-green-50 text-green-600" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-1">
          <button
            type="button"
            onClick={onDone}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primaryBlue px-4 py-2.5 text-sm font-semibold text-white hover:bg-primaryBlueDark transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ResetPasswordResultModal;
