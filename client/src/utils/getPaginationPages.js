export const getPaginationPages = (currentPage, totalPages, delta = 2) => {
  const pages = [];

  const startPage = Math.max(1, currentPage - delta);
  const endPage = Math.min(totalPages, currentPage + delta);

  if (startPage > 1) {
    pages.push(1);
    if (startPage > 2) pages.push("...");
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pages.push("...");
    pages.push(totalPages);
  }

  return pages;
};
