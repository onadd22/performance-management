import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface Option {
  id: string;
  label: string;
  description?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  disabled = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!search) return options.slice(0, 50);
    const q = search.toLowerCase();
    return options.filter(o => 
      o.label.toLowerCase().includes(q) || 
      o.description?.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [options, search]);

  const selectedOption = options.find(o => o.id === value);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between border border-slate-300 rounded-lg p-2.5 bg-white text-sm text-left transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'}`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className="size-4 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <Search className="size-4 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              className="w-full bg-transparent text-sm focus:outline-hidden"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-sm text-slate-500 text-center">No results found</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 transition-colors flex flex-col ${value === option.id ? 'bg-emerald-50 text-emerald-800 font-medium' : 'text-slate-700'}`}
                >
                  <span>{option.label}</span>
                  {option.description && (
                    <span className="text-[10px] text-slate-400 mt-0.5">{option.description}</span>
                  )}
                </button>
              ))
            )}
            {options.length > 50 && filteredOptions.length === 50 && (
              <div className="p-2 text-[10px] text-center text-slate-400 bg-slate-50 border-t border-slate-100">
                Showing top 50 results. Keep typing to filter more.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
