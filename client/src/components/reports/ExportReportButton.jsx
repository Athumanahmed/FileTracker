import { useRef, useState } from "react";
import { useClickAway } from "react-use";
import toast from "react-hot-toast";
import { Download, Loader2 } from "lucide-react";
import BaseInput from "../shared/BaseInput";
import { useExportReport } from "../../hooks/useExportReport";

const REPORT_OPTIONS = [
  { value: "files", label: "Files (current filters)" },
  { value: "department-performance", label: "Department Performance" },
];

const FORMAT_OPTIONS = [
  { value: "csv", label: "CSV" },
  { value: "excel", label: "Excel" },
  { value: "pdf", label: "PDF" },
];

/** filters: the Reports page's current { departmentId, dateFrom, dateTo } -- forwarded only to the "files" report, matching what GET /reports/export honors. */
const ExportReportButton = ({ filters }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [report, setReport] = useState("files");
  const [format, setFormat] = useState("csv");
  const menuRef = useRef(null);
  useClickAway(menuRef, () => setIsOpen(false));

  const { mutate: doExport, isPending } = useExportReport();

  const handleExport = () => {
    const params = { report, format, ...(report === "files" ? filters : {}) };
    doExport(params, {
      onSuccess: () => {
        toast.success("Export downloaded.");
        setIsOpen(false);
      },
      onError: (error) => toast.error(error?.response?.data?.message || "Unable to export report."),
    });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Download size={15} />
        Export
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg">
          <div className="space-y-3">
            <BaseInput as="select" label="Report" name="report" value={report} onChange={(_, v) => setReport(v)} options={REPORT_OPTIONS} />
            <BaseInput as="select" label="Format" name="format" value={format} onChange={(_, v) => setFormat(v)} options={FORMAT_OPTIONS} />
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={isPending}
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primaryBlue px-4 py-2.5 text-sm font-semibold text-white hover:bg-primaryBlueDark transition-colors disabled:opacity-60"
          >
            {isPending ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            Download
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportReportButton;
