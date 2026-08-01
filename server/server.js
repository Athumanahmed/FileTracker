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
import { globalLimiter } from "./middlewares/rateLimiter.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";

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

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`.bgYellow);
});
