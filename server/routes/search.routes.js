import { Router } from "express";
import * as searchController from "../controller/search.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateRequest } from "../middlewares/validation.js";
import { globalSearchValidationRules } from "../validators/search.validation.js";

const router = Router();

// Same gate as the file listing it complements -- Global Search surfaces
// nothing FILES.READ wouldn't already expose via GET /files.
router.get("/", authenticate, authorize("FILES.READ"), globalSearchValidationRules, validateRequest, searchController.globalSearch);

export default router;
