import { asyncHandler } from "../utils/asyncHandler.js";
import * as reportService from "../services/report.service.js";
import * as reportExportService from "../services/reportExport.service.js";

export const getDashboardKpis = asyncHandler(async (req, res) => {
  const kpis = await reportService.getDashboardKpis({ departmentId: req.query.departmentId, actorId: req.user.userId });
  res.status(200).json({ success: true, message: "Dashboard KPIs retrieved successfully.", data: kpis });
});

export const getDepartmentPerformance = asyncHandler(async (req, res) => {
  const rows = await reportService.getDepartmentPerformance({ departmentId: req.query.departmentId, actorId: req.user.userId });
  res.status(200).json({ success: true, message: "Department performance retrieved successfully.", data: rows });
});

export const getOfficerPerformance = asyncHandler(async (req, res) => {
  const rows = await reportService.getOfficerPerformance({ userId: req.query.userId, actorId: req.user.userId });
  res.status(200).json({ success: true, message: "Officer performance retrieved successfully.", data: rows });
});

export const getStatusDistribution = asyncHandler(async (req, res) => {
  const data = await reportService.getStatusDistribution({ departmentId: req.query.departmentId, actorId: req.user.userId });
  res.status(200).json({ success: true, message: "Status distribution retrieved successfully.", data });
});

export const getRegistrationsOverTime = asyncHandler(async (req, res) => {
  const data = await reportService.getRegistrationsOverTime({
    bucket: req.query.bucket,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
    departmentId: req.query.departmentId,
    actorId: req.user.userId,
  });
  res.status(200).json({ success: true, message: "Registrations-over-time series retrieved successfully.", data });
});

export const exportReport = asyncHandler(async (req, res) => {
  const { content, contentType, filename } = await reportExportService.exportReport({
    report: req.query.report,
    format: req.query.format,
    query: req.query,
    actorId: req.user.userId,
  });

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.status(200).send(content);
});
