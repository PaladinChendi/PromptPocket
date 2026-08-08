// src/popup/components/FilterDropdown.tsx

import React, { useState, useRef, useEffect } from 'react';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  icon: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  icon,
  label,
  value,
  options,
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Esc
  useEffect(() => {
    if (!isOpen) return;

    const handleOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  const handleToggle = () => setIsOpen(prev => !prev);

  const handleSelect = (selected: string) => {
    onChange(selected);
    setIsOpen(false);
  };

  return (
    <div className="filter-dropdown" ref={wrapperRef}>
      <button
        type="button"
        className="filter-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={handleToggle}
      >
        <span className="filter-trigger-icon" aria-hidden="true">{icon}</span>
        <span className="filter-trigger-label">{label}</span>
        <span className="filter-trigger-caret" aria-hidden="true">▾</span>
      </button>

      {isOpen && (
        <ul className="filter-menu" role="listbox">
          {options.map(option => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              className="filter-option"
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FilterDropdown;
