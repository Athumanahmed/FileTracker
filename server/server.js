import express from "express";
import colors from "colors";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import "dotenv/config";

import authRoutes from "./routes/auth.routes.js";
import forgotPasswordRoutes from "./routes/forgotPassword.routes.js";
import userRoutes from "./routes/user.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import unitRoutes from "./routes/unit.routes.js";
import positionRoutes from "./routes/position.routes.js";
import permissionRoutes from "./routes/permission.routes.js";
import roleRoutes from "./routes/role.routes.js";
import rolePermissionRoutes from "./routes/rolePermission.routes.js";
import adminUserRoutes from "./routes/adminUser.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import storageRoutes from "./storage/storage.routes.js";
import { ensureBuckets } from "./storage/storage.service.js";
import fileRoutes from "./routes/file.routes.js";
import fileCategoryRoutes from "./routes/fileCategory.routes.js";
import attachmentRoutes from "./routes/attachment.routes.js";
import workflowTemplateRoutes from "./routes/workflowTemplate.routes.js";
import workflowRoutes from "./routes/workflow.routes.js";
import minuteRoutes from "./routes/minute.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import searchRoutes from "./routes/search.routes.js";
import archiveRoutes from "./routes/archive.routes.js";
import reportRoutes from "./routes/report.routes.js";
import { registerTimelineSubscriber } from "./services/timelineEvent.subscriber.js";
import { registerNotificationSubscriber } from "./services/notification.service.js";
import { registerNotificationQueueCron } from "./services/notificationQueue.cron.js";
import { globalLimiter } from "./middlewares/rateLimiter.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";

// Domain-event subscribers (Event-Driven Architecture) -- registered once
// at boot, independent of any route. Workflow actions publish; Timeline
// and Notifications both react independently. Reports (Phase 11) reads
// data on demand rather than subscribing -- there's no "report state" to
// keep in sync, just live aggregation at request time.
registerTimelineSubscriber();
registerNotificationSubscriber();
registerNotificationQueueCron();

// variables
const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT;
const allowedOrigins = ["http://localhost:3000"];

app.use(helmet());
app.use(
  cors({
    credentials: true,
    origin: allowedOrigins,
  }),
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(globalLimiter);

// routes
app.get("/api/v1/health", (req, res) => {
  res
    .status(200)
    .json({ success: true, message: "File Tracker Server Running." });
});

app.get("/ip", (req, res) => {
  res.json({
    ip: req.ip,
    forwarded: req.headers["x-forwarded-for"],
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/auth", forgotPasswordRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/departments", departmentRoutes);
app.use("/api/v1/units", unitRoutes);
app.use("/api/v1/positions", positionRoutes);
app.use("/api/v1/permissions", permissionRoutes);
app.use("/api/v1/roles", roleRoutes);
app.use("/api/v1/role-permissions", rolePermissionRoutes);
app.use("/api/v1/admin/users", adminUserRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/storage", storageRoutes);
app.use("/api/v1/files", fileRoutes);
app.use("/api/v1/file-categories", fileCategoryRoutes);
app.use("/api/v1/attachments", attachmentRoutes);
app.use("/api/v1/workflow-templates", workflowTemplateRoutes);
app.use("/api/v1/workflow", workflowRoutes);
app.use("/api/v1/minutes", minuteRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/archive", archiveRoutes);
app.use("/api/v1/reports", reportRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}...`.bgYellow);

  // Non-fatal: the Storage Module stays independent, so a MinIO outage at
  // boot must not block the rest of the API from starting.
  try {
    await ensureBuckets();
    console.log("MinIO storage buckets verified.".green);
  } catch (err) {
    console.error("MinIO bucket initialization failed:".red, err.message);
  }
});
