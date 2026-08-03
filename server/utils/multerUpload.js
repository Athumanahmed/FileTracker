import multer from "multer";
import { AppError } from "./AppError.js";

/** Buffered in memory, never disk -- every upload path only ever forwards the buffer to the Storage Service. */
export const createMemoryUpload = (maxSizeBytes) => multer({ storage: multer.memoryStorage(), limits: { fileSize: maxSizeBytes } });

/**
 * Wraps a configured Multer middleware invocation (e.g. `upload.single("file")`)
 * so its errors surface as the same AppError shape every other failure in
 * the app uses, instead of falling through to the generic 500 handler.
 */
export const wrapMulterErrors = (multerHandler, { maxSizeBytes, fieldLabel } = {}) => (req, res, next) => {
  multerHandler(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new AppError(413, `File exceeds the maximum allowed size of ${maxSizeBytes} bytes`));
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return next(
        new AppError(400, `A file was sent under an unexpected field${fieldLabel ? ` (use "${fieldLabel}")` : ""} or too many files were sent`),
      );
    }
    next(new AppError(400, err.message));
  });
};
