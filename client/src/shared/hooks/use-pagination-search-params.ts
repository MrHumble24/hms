import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";

export interface PaginationParams {
  page: number;
  pageSize: number;
  search: string;
  [key: string]: any;
}

export const usePaginationSearchParams = (defaultPageSize = 10) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(() => {
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(
      searchParams.get("pageSize") || defaultPageSize.toString(),
      10,
    );
    const search = searchParams.get("search") || "";

    const otherParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (!["page", "pageSize", "search"].includes(key)) {
        otherParams[key] = value;
      }
    });

    return { page, pageSize, search, ...otherParams } as PaginationParams;
  }, [searchParams, defaultPageSize]);

  const setParam = useCallback(
    (key: string, value: string | null, resetPage = true) => {
      setSearchParams((prev) => {
        if (value === null || value === undefined || value === "") {
          prev.delete(key);
        } else {
          prev.set(key, value);
        }
        if (resetPage) {
          prev.set("page", "1");
        }
        return prev;
      });
    },
    [setSearchParams],
  );

  const handlePaginationChange = useCallback(
    (page: number, pageSize: number) => {
      setSearchParams((prev) => {
        prev.set("page", page.toString());
        prev.set("pageSize", pageSize.toString());
        return prev;
      });
    },
    [setSearchParams],
  );

  const handleSearch = useCallback(
    (value: string) => {
      setParam("search", value);
    },
    [setParam],
  );

  const handleTableChange = useCallback(
    (pagination: any, filters: any, _sorter: any, _extra: any) => {
      if (pagination.current && pagination.pageSize) {
        handlePaginationChange(pagination.current, pagination.pageSize);
      }

      Object.keys(filters).forEach((key) => {
        const value = filters[key];
        if (Array.isArray(value)) {
          setParam(key, value[0]);
        } else {
          setParam(key, value);
        }
      });
    },
    [handlePaginationChange, setParam],
  );

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const skip = (params.page - 1) * params.pageSize;
  const take = params.pageSize;

  return {
    params,
    setParam,
    handlePaginationChange,
    handleTableChange,
    handleSearch,
    resetFilters,
    pagination: {
      current: params.page,
      pageSize: params.pageSize,
      onChange: handlePaginationChange,
      showSizeChanger: true,
    },
    apiParams: {
      skip,
      take,
      ...params,
    },
  };
};
