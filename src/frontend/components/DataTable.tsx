"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Loader2,
  Database,
} from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessor?: (item: T) => any;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  searchableKeys?: (string | keyof T)[];
  pageSize?: number;
  pageSizeOptions?: number[];
  actions?: React.ReactNode;
  emptyMessage?: string;
  keyExtractor?: (item: T, index: number) => string | number;
  loading?: boolean;
  rowClassName?: (item: T, index: number) => string;
}

export default function DataTable<T extends Record<string, any>>({
  data = [],
  columns,
  title,
  subtitle,
  searchPlaceholder = "Search records...",
  searchableKeys,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  actions,
  emptyMessage = "No matching records found.",
  keyExtractor,
  loading = false,
  rowClassName,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // ── 1. Search Filter ──
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase().trim();

    return data.filter((item) => {
      if (searchableKeys && searchableKeys.length > 0) {
        return searchableKeys.some((k) => {
          const val = item[k as string];
          if (val === null || val === undefined) return false;
          if (Array.isArray(val)) {
            return val.some((subVal) => String(subVal).toLowerCase().includes(query));
          }
          return String(val).toLowerCase().includes(query);
        });
      }

      // Default: inspect all column keys and object values
      return Object.values(item).some((val) => {
        if (val === null || val === undefined) return false;
        if (typeof val === "object") {
          return JSON.stringify(val).toLowerCase().includes(query);
        }
        return String(val).toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, searchableKeys]);

  // ── 2. Column Sorting ──
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    const col = columns.find((c) => c.key === sortConfig.key);
    return [...filteredData].sort((a, b) => {
      let aVal: any = col?.accessor ? col.accessor(a) : a[sortConfig.key];
      let bVal: any = col?.accessor ? col.accessor(b) : b[sortConfig.key];

      if (aVal === null || aVal === undefined) aVal = "";
      if (bVal === null || bVal === undefined) bVal = "";

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();

      if (strA < strB) return sortConfig.direction === "asc" ? -1 : 1;
      if (strA > strB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig, columns]);

  // ── 3. Pagination ──
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, validCurrentPage, pageSize]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) {
        return { key, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { key, direction: "desc" };
      }
      return null;
    });
  };

  const startIndex = (validCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(validCurrentPage * pageSize, sortedData.length);

  return (
    <div className="card-modern bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden w-full">
      {/* Table Header Controls (Title, Search, Action Bar) */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {title && <h3 className="text-sm sm:text-base font-black text-slate-900">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative min-w-[220px] sm:min-w-[280px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full text-xs pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Optional Action Buttons (e.g. Export, Add) */}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>

      {/* Main Table Responsive Viewport */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              {columns.map((col) => {
                const isSorted = sortConfig?.key === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`py-3 px-4 ${
                      col.sortable ? "cursor-pointer select-none hover:bg-slate-100/80 transition-colors" : ""
                    } ${col.headerClassName || ""}`}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUp className="w-3 h-3 text-purple-600" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-purple-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 hover:text-slate-600" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                    <p className="text-xs text-slate-500 font-medium">Loading data...</p>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                    <Database className="w-8 h-8 text-slate-300" />
                    <p className="text-xs font-bold text-slate-700">{emptyMessage}</p>
                    {searchQuery && (
                      <p className="text-[11px] text-slate-400">
                        No results matched &ldquo;<span className="font-semibold text-slate-600">{searchQuery}</span>&rdquo;.
                      </p>
                    )}
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setCurrentPage(1);
                        }}
                        className="text-xs text-purple-600 hover:text-purple-700 font-bold underline cursor-pointer mt-1"
                      >
                        Reset Search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, rowIdx) => {
                const key = keyExtractor ? keyExtractor(item, rowIdx) : item.id || rowIdx;
                const customRowCls = rowClassName ? rowClassName(item, rowIdx) : "";
                return (
                  <tr
                    key={key}
                    className={`hover:bg-slate-50/70 transition-colors ${customRowCls}`}
                  >
                    {columns.map((col) => {
                      const content = col.render
                        ? col.render(item, rowIdx)
                        : col.accessor
                        ? col.accessor(item)
                        : item[col.key];

                      return (
                        <td
                          key={col.key}
                          className={`py-3 px-4 text-slate-700 align-middle ${col.className || ""}`}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Pagination & Page Size selector */}
      {!loading && sortedData.length > 0 && (
        <div className="p-3.5 sm:px-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-slate-800">{startIndex}</strong> to{" "}
              <strong className="text-slate-800">{endIndex}</strong> of{" "}
              <strong className="text-slate-800">{sortedData.length}</strong> entries
            </span>
            {searchQuery && (
              <span className="text-[11px] text-slate-400 font-medium">
                (filtered from {data.length} total)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Page Size Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px]">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="input-field text-xs py-1 px-2 bg-slate-50 border-slate-200 rounded-lg text-slate-700 cursor-pointer"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Pagination Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={validCurrentPage <= 1}
                className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage <= 1}
                className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-2.5 py-0.5 text-xs font-semibold text-slate-700 font-mono">
                {validCurrentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage >= totalPages}
                className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={validCurrentPage >= totalPages}
                className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
