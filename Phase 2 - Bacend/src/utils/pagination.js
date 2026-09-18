const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function getPagination(query) {
  let page = Number(query.page) || 1;
  let limit = Number(query.limit) || DEFAULT_LIMIT;
  if (page < 1) page = 1;
  if (limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function paginationMeta(page, limit, total) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
