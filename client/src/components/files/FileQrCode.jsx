import { QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";
import { getFileStatusMeta } from "../../utils/fileStatusMeta";

/**
 * The QR encodes a link into this file's own detail page -- not a static
 * text snapshot of its details -- so the SAME printed code always resolves
 * to whatever the file's status is at scan time, no matter how many times
 * it moves through workflow after being printed. Scanning it opens the
 * live record (login required, same as using the app), which is exactly
 * the registry-desk use case: a clerk scans the code stapled to a paper
 * folder to jump straight to its digital record.
 */
const buildFileUrl = (fileId) => `${window.location.origin}/registry/files/${fileId}`;

/**
 * Reusable in two places: the post-registration success modal, and a
 * reprint action on the file's own detail page (the label can be lost,
 * damaged, or a second copy needed for a duplicate folder -- printing
 * isn't a one-time-only action).
 */
const FileQrCode = ({ file, showPrintButton = true, size = 140 }) => {
  const status = getFileStatusMeta(file.status);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        id="printable-file-qr"
        className="rounded-xl border border-gray-200 bg-white p-4 text-center print:border-0 print:p-0"
        style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
      >
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Tabora Municipal Council</p>
        <QRCodeSVG value={buildFileUrl(file.id)} size={size} level="M" />
        <p className="mt-3 text-sm font-bold text-gray-900">{file.fileNumber}</p>
        <p className="text-xs text-gray-500 mt-0.5 max-w-40 truncate mx-auto">{file.title}</p>
        <span
          className="inline-flex items-center gap-1.5 mt-2 rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{ backgroundColor: `${status.color}1a`, color: status.color }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status.color }} />
          {status.label}
        </span>
      </div>

      {showPrintButton && (
        <button
          type="button"
          onClick={() => window.print()}
          className="print:hidden inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Printer size={15} />
          Print QR Label
        </button>
      )}
    </div>
  );
};

export default FileQrCode;
