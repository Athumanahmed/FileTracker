import { Router } from "express";
import * as fileCategoryController from "../controller/fileCategory.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

router.get("/", authenticate, authorize("FILE_CATEGORIES.READ"), fileCategoryController.listFileCategories);

export default router;
