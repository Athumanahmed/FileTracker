import { asyncHandler } from "../utils/asyncHandler.js";
import * as fileCategoryService from "../services/fileCategory.service.js";

export const listFileCategories = asyncHandler(async (req, res) => {
  const categories = await fileCategoryService.listFileCategories();
  res.status(200).json({ success: true, message: "File categories retrieved successfully.", data: categories });
});
