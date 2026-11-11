import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, ChevronDown, Check, Lock, Users } from 'lucide-react';
import { animatePopoverEnter, animatePopoverExit } from '../lib/animations';
import { UserAvatar } from './UserAvatar';

export function CustomGlobalGuardSelect({
  value = 'none',
  onChange,
  supervisoras = [],
  tiendas = [],
  compact = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const popoverRef = useRef(null);

  const isNone = !value || value === 'none';
  const isAll = value === '__all';
  const currentSup = supervisoras.find((s) => s.id === value);

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

  const handleSelect = (newValue) => {
    onChange(newValue);
    closeDropdown();
  };

  const getStoreCount = (supId) => {
    return tiendas.filter((t) => t.sup === supId).length;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
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
        className={`w-full bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-white font-bold flex items-center justify-between transition-all duration-200 shadow-inner group cursor-pointer focus:outline-none focus:border-amber-500/80 ${
          compact
            ? 'rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm'
            : 'rounded-2xl px-2.5 sm:px-4 py-2 sm:py-3 text-xs sm:text-base'
        }`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          {isNone ? (
            <div
              className={`rounded-xl bg-slate-800/90 text-slate-400 border border-slate-700/60 flex items-center justify-center shadow-sm shrink-0 ${
                compact ? 'w-5 h-5 sm:w-6 sm:h-6 text-[10px]' : 'w-6 h-6 sm:w-8 sm:h-8 text-xs'
              }`}
            >
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
            </div>
          ) : isAll ? (
            <div
              className={`rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-sm shrink-0 ${
                compact ? 'w-5 h-5 sm:w-6 sm:h-6 text-[10px] sm:text-xs' : 'w-6 h-6 sm:w-8 sm:h-8 text-xs sm:text-sm'
              }`}
            >
              🌟
            </div>
          ) : (
            <UserAvatar
              user={currentSup}
              name={currentSup?.name}
              avatarColor={currentSup?.avatarColor}
              className={compact ? 'w-5 h-5 sm:w-6 sm:h-6 rounded-lg shrink-0' : 'w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl shrink-0'}
            />
          )}

          <div className="text-left min-w-0">
            <span
              className={`block truncate text-white font-extrabold group-hover:text-amber-300 transition-colors ${
                compact ? 'text-xs sm:text-sm' : 'text-xs sm:text-base'
              }`}
            >
              {isNone
                ? 'Ninguno (Solo Admin)'
                : isAll
                ? 'Todos habilitados'
                : currentSup?.name || 'Seleccionar guardia'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-1 sm:ml-2">
          <span
            className={`font-extrabold rounded-full font-mono-numbers hidden sm:inline-block border ${
              compact ? 'text-[10px] px-2 py-0.5' : 'text-[11px] px-2.5 py-0.5'
            } ${
              isNone
                ? 'bg-slate-800/90 text-slate-400 border-slate-700/60'
                : isAll
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}
          >
            {isNone ? 'Solo Admin' : isAll ? 'Todos' : 'De guardia'}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180 text-amber-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Styled Popover Menu */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 mt-2 z-50 w-full min-w-[280px] sm:min-w-[320px] max-w-[calc(100vw-28px)] bg-slate-900/95 border border-slate-700/80 rounded-2xl p-2 shadow-2xl shadow-black/90 backdrop-blur-xl origin-top max-h-84 overflow-y-auto no-scrollbar"
        >
          {/* Option: Ninguno (Solo Admin) */}
          <button
            type="button"
            onClick={() => handleSelect('none')}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl transition text-left cursor-pointer mb-1 ${
              isNone
                ? 'bg-slate-800/90 border border-slate-600 text-white shadow-sm'
                : 'hover:bg-slate-800/80 text-slate-200 hover:text-white border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center text-xs shrink-0">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-sm truncate">Ninguno (Solo Administradores)</p>
                <p className="text-[11px] text-slate-400">Carga global restringida</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800/90 text-slate-400 border border-slate-700">
                Estricto
              </span>
              {isNone && <Check className="w-4 h-4 text-amber-400" />}
            </div>
          </button>

          {/* Option: Todos habilitados */}
          <button
            type="button"
            onClick={() => handleSelect('__all')}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl transition text-left cursor-pointer mb-1 ${
              isAll
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
                : 'hover:bg-slate-800/80 text-slate-200 hover:text-white border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs shrink-0">
                🌟
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-sm truncate">Todos los supervisores</p>
                <p className="text-[11px] text-slate-400">Cualquiera puede alternar a toda la red</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Abierto
              </span>
              {isAll && <Check className="w-4 h-4 text-amber-400" />}
            </div>
          </button>

          {/* Separator Header */}
          <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span>Supervisoras individuales</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          {/* List of supervisors */}
          <div className="space-y-1">
            {supervisoras.map((s) => {
              const isSelected = value === s.id;
              const storeCount = getStoreCount(s.id);

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelect(s.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition text-left cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
                      : 'hover:bg-slate-800/80 text-slate-200 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserAvatar
                      user={s}
                      name={s.name}
                      avatarColor={s.avatarColor}
                      className="w-7 h-7 rounded-lg shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-extrabold text-sm truncate">{s.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {s.title || 'Supervisora de Tiendas'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700 font-mono-numbers">
                      {storeCount} locales
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

