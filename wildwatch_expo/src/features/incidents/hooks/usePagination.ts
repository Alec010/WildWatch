import { useState, useMemo, useCallback, useEffect } from 'react';

interface UsePaginationOptions<T> {
  data: T[];
  itemsPerPage: number;
}

export const usePagination = <T,>({ 
  data, 
  itemsPerPage,
}: UsePaginationOptions<T>) => {
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  }, [totalPages]);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Reset page when data length changes (filters applied)
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const getDisplayRange = () => {
    if (data.length === 0) return { start: 0, end: 0, total: 0 };
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, data.length);
    return { start, end, total: data.length };
  };

  return {
    currentPage,
    totalPages,
    paginatedData,
    handlePageChange,
    resetPage,
    getDisplayRange,
    hasMore: currentPage < totalPages,
  };
};

