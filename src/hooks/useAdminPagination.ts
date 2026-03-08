import { useMemo, useState } from "react";

const ROWS_PER_PAGE = 15;

export function useAdminPagination<T>(data: T[]) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / ROWS_PER_PAGE));

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return data.slice(start, start + ROWS_PER_PAGE);
  }, [data, currentPage]);

  // Reset to page 1 when data changes significantly
  const safeCurrentPage = currentPage > totalPages ? 1 : currentPage;
  if (safeCurrentPage !== currentPage) setCurrentPage(safeCurrentPage);

  return {
    paginatedData,
    currentPage,
    totalPages,
    totalItems: data.length,
    setCurrentPage,
    rowsPerPage: ROWS_PER_PAGE,
  };
}
