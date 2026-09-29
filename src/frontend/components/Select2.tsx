"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  ChevronDown,
  Search,
  X,
  Check,
  Tag,
} from "lucide-react";

export interface Select2Option {
  value: string;
  label: string;
  badge?: string;
  icon?: React.ReactNode;
  description?: string;
}

export interface Select2Props {
  options: (string | Select2Option)[];
  value?: string | string[];
  onChange: (value: any) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  isSearchable?: boolean;
  isClearable?: boolean;
  isMulti?: boolean;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  variant?: "dark" | "light" | "auto";
  id?: string;
  name?: string;
  required?: boolean;
  label?: string;
  error?: string;
}

export default function Select2({
  options: rawOptions = [],
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Type to search...",
  isSearchable = true,
  isClearable = false,
  isMulti = false,
  disabled = false,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  variant = "auto",
  id,
  name,
  required = false,
  label,
  error,
}: Select2Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Normalize options to Select2Option[]
  const options: Select2Option[] = useMemo(() => {
    return rawOptions.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [rawOptions]);

  // Selected option(s) resolution
  const selectedOptions = useMemo(() => {
    if (isMulti) {
      const arr = Array.isArray(value) ? value : value ? [value] : [];
      return options.filter((o) => arr.includes(o.value));
    } else {
      if (value === undefined || value === null) return [];
      const found = options.find((o) => o.value === value);
      return found ? [found] : [];
    }
  }, [options, value, isMulti]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  // Outside click & Escape to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when menu opens
  useEffect(() => {
    if (isOpen && isSearchable) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    if (isOpen) {
      setHighlightedIndex(0);
      setSearchQuery("");
    }
  }, [isOpen, isSearchable]);

  // Handle single and multi selection
  const handleSelect = (option: Select2Option) => {
    if (isMulti) {
      const currentValues = Array.isArray(value) ? [...value] : value ? [value] : [];
      if (currentValues.includes(option.value)) {
        onChange(currentValues.filter((v) => v !== option.value));
      } else {
        onChange([...currentValues, option.value]);
      }
      setSearchQuery("");
      searchInputRef.current?.focus();
    } else {
      onChange(option.value);
      setIsOpen(false);
    }
  };

  const handleRemoveTag = (e: React.MouseEvent, val: string) => {
    e.stopPropagation();
    if (!isMulti) return;
    const currentValues = Array.isArray(value) ? [...value] : [];
    onChange(currentValues.filter((v) => v !== val));
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(isMulti ? [] : "");
  };

  // Keyboard navigation inside dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === "Tab") {
      setIsOpen(false);
    }
  };

  // Variant themes
  const isDark =
    variant === "dark" ||
    (variant === "auto" &&
      typeof window !== "undefined" &&
      (document.documentElement.classList.contains("dark") ||
        className.includes("dark")));

  const themeClasses = isDark
    ? {
        buttonBg: "bg-[#121828] text-white border-slate-700/80 hover:border-purple-500",
        buttonOpen: "border-purple-500 ring-2 ring-purple-500/30",
        placeholder: "text-slate-400",
        menuBg: "bg-[#0b101d] border-slate-700/80 shadow-2xl text-white",
        searchBg: "bg-[#121828] text-white border-slate-700/80 placeholder-slate-500",
        itemHover: "hover:bg-purple-950/50 hover:text-purple-200",
        itemActive: "bg-purple-950/70 text-purple-200",
        itemSelected: "bg-purple-900/40 text-purple-300 font-semibold",
        tagBg: "bg-purple-950/80 text-purple-200 border border-purple-500/40",
        tagRemove: "hover:bg-purple-800 text-purple-300",
        emptyText: "text-slate-500",
      }
    : {
        buttonBg: "bg-white text-slate-900 border-slate-200 hover:border-blue-500",
        buttonOpen: "border-blue-500 ring-2 ring-blue-500/20",
        placeholder: "text-slate-400",
        menuBg: "bg-white border-slate-200 shadow-2xl text-slate-900",
        searchBg: "bg-slate-50 text-slate-900 border-slate-200 placeholder-slate-400",
        itemHover: "hover:bg-blue-50 hover:text-blue-700",
        itemActive: "bg-blue-50 text-blue-700",
        itemSelected: "bg-blue-50/80 text-blue-700 font-semibold",
        tagBg: "bg-blue-50 text-blue-700 border border-blue-200",
        tagRemove: "hover:bg-blue-200 text-blue-600",
        emptyText: "text-slate-400",
      };

  return (
    <div
      ref={containerRef}
      className={`relative select2-container text-xs w-full ${className}`}
      id={id ? `select2-${id}` : undefined}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Select2 Trigger Control */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full min-h-[38px] px-3 py-1.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all duration-150 select-none ${
          themeClasses.buttonBg
        } ${isOpen ? themeClasses.buttonOpen : ""} ${
          disabled ? "opacity-50 cursor-not-allowed bg-slate-100" : ""
        } ${buttonClassName}`}
      >
        <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0">
          {/* Multi-select Tags */}
          {isMulti && selectedOptions.length > 0 ? (
            selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors ${themeClasses.tagBg}`}
              >
                {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                <span className="truncate max-w-[150px]">{opt.label}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveTag(e, opt.value)}
                    className={`rounded p-0.5 transition-colors cursor-pointer ${themeClasses.tagRemove}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </span>
            ))
          ) : !isMulti && selectedOptions.length > 0 ? (
            /* Single Select Display */
            <div className="flex items-center gap-2 truncate">
              {selectedOptions[0].icon && (
                <span className="shrink-0">{selectedOptions[0].icon}</span>
              )}
              <span className="truncate font-medium">{selectedOptions[0].label}</span>
              {selectedOptions[0].badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/50 dark:bg-slate-800 text-slate-500">
                  {selectedOptions[0].badge}
                </span>
              )}
            </div>
          ) : (
            /* Placeholder */
            <span className={themeClasses.placeholder}>{placeholder}</span>
          )}
        </div>

        {/* Clear & Arrow Controls */}
        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {isClearable && selectedOptions.length > 0 && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Select2 Dropdown Popover */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-50 mt-1.5 rounded-2xl border p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-100 ${themeClasses.menuBg} ${menuClassName}`}
          style={{ minWidth: "180px" }}
        >
          {/* Search Box */}
          {isSearchable && (
            <div className="relative mb-2 px-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder={searchPlaceholder}
                className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs border focus:outline-none focus:ring-2 focus:ring-purple-500/40 ${themeClasses.searchBg}`}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Options List */}
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-56 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-slate-700/50 pr-0.5"
          >
            {filteredOptions.length === 0 ? (
              <li
                className={`p-3 text-center text-xs italic ${themeClasses.emptyText}`}
              >
                No options match &quot;{searchQuery}&quot;
              </li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = isMulti
                  ? selectedOptions.some((s) => s.value === opt.value)
                  : selectedOptions[0]?.value === opt.value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? themeClasses.itemSelected
                        : isHighlighted
                        ? themeClasses.itemActive
                        : themeClasses.itemHover
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {opt.icon && (
                        <span className="shrink-0 text-slate-400">
                          {opt.icon}
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="truncate font-medium">{opt.label}</div>
                        {opt.description && (
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {opt.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {/* Hidden native input for form compatibility */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={
            isMulti
              ? JSON.stringify(Array.isArray(value) ? value : value ? [value] : [])
              : (value as string) || ""
          }
          required={required && selectedOptions.length === 0}
        />
      )}

      {error && <p className="text-[10px] text-rose-500 mt-1">{error}</p>}
    </div>
  );
}
