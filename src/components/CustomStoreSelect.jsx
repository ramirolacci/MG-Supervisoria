import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Store, ChevronDown, Check, Sparkles } from 'lucide-react';
import { animatePopoverEnter, animatePopoverExit } from '../lib/animations';

export function CustomStoreSelect({
  value,
  onChange,
  tiendas = [],
  allOptionLabel = 'Todas las tiendas',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const popoverRef = useRef(null);

  const sortedTiendas = useMemo(() => {
    return tiendas.slice().sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [tiendas]);

  const currentStore = sortedTiendas.find((t) => String(t.id) === String(value));
  const isAll = !value || value === '';

  const closeDropdown = () => {
    if (popoverRef.current) {
      animatePopoverExit(popoverRef.current, () => {
        setIsOpen(false);
      });
    } else {
      setIsOpen(false);
    }
  };

  const openDropdown = () => {
    setIsOpen(true);
  };

  useEffect(() => {
    if (isOpen && popoverRef.current) {
      animatePopoverEnter(popoverRef.current);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        closeDropdown();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (id) => {
    onChange(id);
    closeDropdown();
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          if (isOpen) {
            closeDropdown();
          } else {
            openDropdown();
          }
        }}
        className="w-full bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-white font-bold flex items-center justify-between transition-all duration-200 shadow-inner group cursor-pointer focus:outline-none focus:border-amber-500/80 rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm gap-2"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-sm shrink-0 w-5 h-5 sm:w-6 sm:h-6 text-[10px] sm:text-xs">
            {isAll ? <Sparkles className="w-3 h-3 text-amber-400" /> : <Store className="w-3 h-3 text-amber-400" />}
          </div>
          <span className="truncate text-white font-extrabold group-hover:text-amber-300 transition-colors text-xs sm:text-sm">
            {isAll ? allOptionLabel : currentStore?.name || 'Seleccionar tienda'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180 text-amber-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 mt-2 z-50 w-full min-w-[230px] max-w-[calc(100vw-28px)] bg-slate-900/95 border border-slate-700/80 rounded-2xl p-1.5 sm:p-2 shadow-2xl shadow-black/90 backdrop-blur-xl origin-top max-h-72 overflow-y-auto no-scrollbar"
        >
          {/* Opción Todas las tiendas */}
          <button
            type="button"
            onClick={() => handleSelect('')}
            className={`w-full flex items-center justify-between p-2 rounded-xl transition text-left cursor-pointer mb-1 ${
              isAll
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
                : 'hover:bg-slate-800/80 text-slate-200 hover:text-white border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                <Sparkles className="w-3 h-3 text-amber-400" />
              </div>
              <span className="font-extrabold text-xs sm:text-sm truncate">{allOptionLabel}</span>
            </div>
            {isAll && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
          </button>

          {/* Separador sutil */}
          <div className="h-px bg-slate-800 my-1 mx-1" />

          {/* Listado de Tiendas */}
          <div className="space-y-0.5">
            {sortedTiendas.map((t) => {
              const isSelected = String(t.id) === String(value);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelect(t.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl transition text-left cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
                      : 'hover:bg-slate-800/80 text-slate-200 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                      <Store className="w-3 h-3 text-slate-400" />
                    </div>
                    <span className="font-bold text-xs sm:text-sm truncate">{t.name}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
