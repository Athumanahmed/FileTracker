import { AppError } from "../utils/AppError.js";
import * as fileService from "./file.service.js";
import * as fileRepository from "../repositories/file.repository.js";
import * as reportService from "./report.service.js";
import { buildCsv } from "./export/csv.exporter.js";
import { buildExcel } from "./export/excel.exporter.js";
import { buildPdf } from "./export/pdf.exporter.js";

const FILE_COLUMNS = [
  { key: "fileNumber", label: "File Number" },
  { key: "registryNumber", label: "Registry Number" },
  { key: "trackingNumber", label: "Tracking Number" },
  { key: "title", label: "Title" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "confidentiality", label: "Confidentiality" },
  { key: "category", label: "Category" },
  { key: "department", label: "Department" },
  { key: "citizen", label: "Citizen" },
  { key: "createdAt", label: "Registered On" },
  { key: "dueDate", label: "Due Date" },
  { key: "closedAt", label: "Closed On" },
];

const DEPARTMENT_PERFORMANCE_COLUMNS = [
  { key: "department", label: "Department" },
  { key: "totalFiles", label: "Total Files" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "overdue", label: "Overdue" },
  { key: "avgProcessingDays", label: "Avg Processing (days)" },
];

const OFFICER_PERFORMANCE_COLUMNS = [
  { key: "officer", label: "Officer" },
  { key: "currentPending", label: "Current Pending" },
  { key: "currentOverdue", label: "Current Overdue" },
  { key: "completedAsHandler", label: "Completed" },
];

const isoDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

const buildFilesReport = async (query) => {
  const where = fileService.buildFileWhereClause(query);
  const files = await fileRepository.findAllForExport(where);
  return {
    title: "File Register Report",
    columns: FILE_COLUMNS,
    rows: files.map((f) => ({
      fileNumber: f.fileNumber,
      registryNumber: f.registryNumber,
      trackingNumber: f.trackingNumber,
      title: f.title,
      status: f.status,
      priority: f.priority,
      confidentiality: f.confidentiality,
      category: f.category?.name ?? "",
      department: f.department?.name ?? "",
      citizen: f.citizen?.fullName ?? "",
      createdAt: isoDate(f.createdAt),
      dueDate: isoDate(f.dueDate),
      closedAt: isoDate(f.closedAt),
    })),
  };
};

const buildDepartmentPerformanceReport = async ({ departmentId, actorId }) => {
  const rows = await reportService.getDepartmentPerformance({ departmentId, actorId });
  return {
    title: "Department Performance Report",
    columns: DEPARTMENT_PERFORMANCE_COLUMNS,
    rows: rows.map((r) => ({
      department: r.department?.name ?? "",
      totalFiles: r.totalFiles,
      pending: r.pending,
      completed: r.completed,
      overdue: r.overdue,
      avgProcessingDays: r.avgProcessingDays ?? "",
    })),
  };
};

const buildOfficerPerformanceReport = async ({ userId, actorId }) => {
  const rows = await reportService.getOfficerPerformance({ userId, actorId });
  return {
    title: "Officer Performance Report",
    columns: OFFICER_PERFORMANCE_COLUMNS,
    rows: rows.map((r) => ({
      officer: r.officer?.fullName ?? "",
      currentPending: r.currentPending,
      currentOverdue: r.currentOverdue,
      completedAsHandler: r.completedAsHandler,
    })),
  };
};

const REPORT_BUILDERS = {
  files: buildFilesReport,
  "department-performance": buildDepartmentPerformanceReport,
  "officer-performance": buildOfficerPerformanceReport,
};

const FORMAT_EXTENSIONS = { csv: "csv", excel: "xlsx", pdf: "pdf" };
const FORMAT_CONTENT_TYPES = {
  csv: "text/csv",
  excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
};

/** Same underlying data as the JSON report endpoints -- just shaped flat and handed to a format-specific exporter instead of returned as JSON. */
export const exportReport = async ({ report, format, query, actorId }) => {
  const builder = REPORT_BUILDERS[report];
  if (!builder) throw new AppError(400, `Unknown report "${report}"`);

  const data = await builder({ ...query, actorId });

  let content;
  if (format === "csv") content = buildCsv(data);
  else if (format === "excel") content = await buildExcel(data);
  else if (format === "pdf") content = await buildPdf(data);
  else throw new AppError(400, `Unknown export format "${format}"`);

  const datestamp = new Date().toISOString().slice(0, 10);
  return {
    content,
    contentType: FORMAT_CONTENT_TYPES[format],
    filename: `${report}-${datestamp}.${FORMAT_EXTENSIONS[format]}`,
  };
};
