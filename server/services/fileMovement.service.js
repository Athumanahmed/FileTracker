import { AppError } from "../utils/AppError.js";
import { parsePagination, buildPaginationMeta } from "../utils/queryOptions.js";
import * as fileRepository from "../repositories/file.repository.js";
import * as fileMovementRepository from "../repositories/fileMovement.repository.js";

const sanitize = (movement) => ({
  id: movement.id,
  fromUser: movement.fromUser,
  toUser: movement.toUser,
  fromDepartment: movement.fromDepartment,
  toDepartment: movement.toDepartment,
  action: movement.action,
  status: movement.status,
  remarks: movement.remarks,
  dispatchedAt: movement.dispatchedAt,
  receivedAt: movement.receivedAt,
});

/** The file's chain-of-custody -- who it went to, when, and whether it's been received. */
export const listMovements = async ({ fileId, query }) => {
  const file = await fileRepository.findById(fileId);
  if (!file) throw new AppError(404, "File not found");

  const { page, limit, skip, take } = parsePagination(query);

  const [items, total] = await Promise.all([
    fileMovementRepository.findByFileId({ fileId, skip, take }),
    fileMovementRepository.count(fileId),
  ]);

  return { items: items.map(sanitize), meta: buildPaginationMeta(total, page, limit) };
};
