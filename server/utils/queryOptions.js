const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parses page/limit query params into Prisma skip/take, clamped to sane
 * bounds -- a client can never request an unbounded page size regardless
 * of what it sends.
 */
export const parsePagination = (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);

  return { page, limit, skip: (page - 1) * limit, take: limit };
};

export const buildPaginationMeta = (total, page, limit) => ({
  page,
  limit,
  total,
  totalPages: Math.max(Math.ceil(total / limit), 1),
});

/**
 * Validates sortBy against an allowlist of real columns for this resource
 * -- a client's sortBy value never flows directly into Prisma's orderBy,
 * which would otherwise let it probe internal field names or trigger a
 * Prisma error on an unindexed/nonexistent column.
 */
export const parseSort = (query = {}, allowedFields, defaultField) => {
  const sortBy = allowedFields.includes(query.sortBy) ? query.sortBy : defaultField;
  const sortOrder = query.sortOrder === "desc" ? "desc" : "asc";
  return { [sortBy]: sortOrder };
};

/** Case-insensitive OR-across-fields search clause, or undefined if no search term given. */
export const buildSearchClause = (searchTerm, fields) => {
  if (!searchTerm) return undefined;

  return {
    OR: fields.map((field) => ({ [field]: { contains: searchTerm, mode: "insensitive" } })),
  };
};

/** Parses a tri-state "true"/"false"/absent query param into true/false/undefined. */
export const parseBooleanFilter = (value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};
