import { Router } from "express";
import * as fileMovementController from "../controller/fileMovement.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

// mergeParams -- mounted at /api/v1/files/:fileId/movements.
const router = Router({ mergeParams: true });

router.get("/", authenticate, authorize("WORKFLOW.READ"), fileMovementController.listMovements);

export default router;
