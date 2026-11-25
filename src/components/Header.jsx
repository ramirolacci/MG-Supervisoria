import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, ChevronDown, Check, ShieldCheck, Database, X, Lock, Calendar, ClipboardList } from 'lucide-react';
import { animatePopoverEnter, animatePopoverExit } from '../lib/animations';
import { UserAvatar } from './UserAvatar';
import { canUserAccessSupervisionFromPlanificacion } from '../lib/auth';

export function Header({
  currentUser,
  onLogout,
  onOpenDbModal,
  isDbConfigured,
  onOpenChangePassword,
  isPlanificacionRoute = false,
  onNavigate,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const dropdownRef = useRef(null);

  const closeMenu = (callback) => {
    if (dropdownRef.current) {
      animatePopoverExit(dropdownRef.current, () => {
        setIsMenuOpen(false);
        if (callback) callback();
      });
    } else {
      setIsMenuOpen(false);
      if (callback) callback();
    }
  };

  // Close side menu / dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        closeMenu();
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      if (dropdownRef.current) {
        animatePopoverEnter(dropdownRef.current);
      }
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const canAccessSupervision = canUserAccessSupervisionFromPlanificacion(currentUser);

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800/80 shadow-md">
      <div className="max-w-[1600px] mx-auto px-2.5 sm:px-6 lg:px-8 py-2.5 sm:py-4 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            {(!isPlanificacionRoute || canAccessSupervision) ? (
              <a
                href={`${import.meta.env.BASE_URL}`}
                className="flex items-center gap-3 group transition"
                title="Ir a Supervisión - Carga diaria"
              >
                <img
                  src={`${import.meta.env.BASE_URL}Logo_Mi_Gusto_2025.png`}
                  alt="Mi Gusto"
                  className="h-7 sm:h-9 w-auto object-contain brightness-110 drop-shadow-[0_2px_12px_rgba(245,158,11,0.15)] group-hover:scale-105 transition-transform"
                />
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
                  Supervisión
                </span>
              </a>
            ) : (
              <div className="flex items-center gap-3">
                <img
                  src={`${import.meta.env.BASE_URL}Logo_Mi_Gusto_2025.png`}
                  alt="Mi Gusto"
                  className="h-7 sm:h-9 w-auto object-contain brightness-110 drop-shadow-[0_2px_12px_rgba(245,158,11,0.15)]"
                />
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm">
                  Planificación
                </span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block mt-1">
            {isPlanificacionRoute
              ? 'Planificación semanal, horarios y objetivos de las supervisoras'
              : 'Control de comandas, venta neta y unidades por tienda'}
          </p>
        </div>

        {/* User Profile & Side Menu Trigger */}
        <div className="relative" ref={menuRef}>
          {currentUser ? (
            <button
              onClick={() => {
                if (isMenuOpen) {
                  closeMenu();
                } else {
                  setIsMenuOpen(true);
                }
              }}
              className="flex items-center gap-2.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 text-left transition shadow-md group"
            >
              <UserAvatar
                user={currentUser}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl"
              />

              <div className="hidden sm:block">
                <p className="text-xs font-black text-white group-hover:text-amber-300 transition leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {currentUser.role || 'Supervisora'}
                </p>
              </div>

              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition ${
                  isMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          ) : (
            <button
              onClick={onOpenDbModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold bg-slate-900 text-slate-300"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Conectar</span>
            </button>
          )}

          {/* User Profile Dropdown / Side Menu */}
          {isMenuOpen && currentUser && (
            <div
              ref={dropdownRef}
              className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700/80 rounded-2xl p-3 shadow-2xl shadow-black/80 backdrop-blur-xl z-50 origin-top-right"
            >
              {/* Profile Card Header */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-2">
                <div className="flex items-center gap-2.5">
                  <UserAvatar
                    user={currentUser}
                    className="w-9 h-9 rounded-xl"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {currentUser.email}
                    </p>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    Sesión activa
                  </span>
                </div>
              </div>

              {/* Menu options */}
              <div className="space-y-1">
                {isPlanificacionRoute ? (
                  canAccessSupervision && (
                    <button
                      onClick={() => {
                        closeMenu(() => {
                          if (onNavigate) {
                            onNavigate('');
                          } else {
                            window.location.href = import.meta.env.BASE_URL;
                          }
                        });
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-300 hover:text-white hover:bg-amber-950/40 border border-amber-900/30 transition text-left cursor-pointer"
                    >
                      <ClipboardList className="w-4 h-4 text-amber-400" />
                      <span>Ir a Carga y Supervisión</span>
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => {
                      closeMenu(() => {
                        if (onNavigate) {
                          onNavigate('planificacion');
                        } else {
                          window.location.href = `${import.meta.env.BASE_URL}planificacion`;
                        }
                      });
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-300 hover:text-white hover:bg-indigo-950/40 border border-indigo-900/30 transition text-left cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span>Ir a Planificación</span>
                  </button>
                )}

                {onOpenChangePassword && (
                  <button
                    onClick={() => {
                      closeMenu(() => onOpenChangePassword());
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition text-left cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Cambiar contraseña</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    closeMenu(() => onLogout());
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
