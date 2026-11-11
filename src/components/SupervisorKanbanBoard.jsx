import React, { useState, useRef } from 'react';
import {
  Users,
  Store,
  GripVertical,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Lock,
  ShieldCheck,
  MapPin,
  Search,
} from 'lucide-react';
import { isUserAdmin, canUserManageStores } from '../lib/auth';
import { gsap, useGSAP } from '../lib/animations';
import { UserAvatar } from './UserAvatar';

export function SupervisorKanbanBoard({ config, onUpdateConfig, currentUser }) {
  const [draggedStoreId, setDraggedStoreId] = useState(null);
  const [dragOverColId, setDragOverColId] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const gridRef = useRef(null);

  useGSAP(() => {
    if (gridRef.current && gridRef.current.children.length > 0) {
      gsap.fromTo(
        gridRef.current.children,
        { opacity: 0, y: 14, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.05, ease: 'power2.out', clearProps: 'transform' }
      );
    }
  }, [config.supervisoras?.length]);

  const supervisoras = config.supervisoras || [];
  const tiendas = config.tiendas || [];

  // Check if current user can move stores (Admin and Elizabeth Colman only)
  const canMoveStores = canUserManageStores(currentUser);
  const isAdmin = isUserAdmin(currentUser);
  const currentUserId = currentUser?.supId;

  // Track expanded state for accordion panels (by default, logged supervisor is expanded or all if admin)
  const [expandedCols, setExpandedCols] = useState(() => {
    const map = {};
    supervisoras.forEach((s) => {
      // If admin, open all. If supervisor, open their own by default.
      map[s.id] = isAdmin || s.id === currentUserId;
    });
    return map;
  });

  const toggleCol = (colId) => {
    setExpandedCols((prev) => ({
      ...prev,
      [colId]: !prev[colId],
    }));
  };

  // Build column objects with store count
  const allColumns = supervisoras.map((s) => ({
    id: s.id,
    name: s.name,
    title: s.title || 'Supervisora de Tiendas',
    avatarColor: s.avatarColor || 'from-amber-500 to-orange-600',
    stores: tiendas.filter((t) => t.sup === s.id),
    isCurrentLoggedUser: currentUserId === s.id,
  }));

  // Sort helper: prioritize logged supervisor if non-admin, else sort by store count desc
  const sortColumns = (cols) => {
    return [...cols].sort((a, b) => {
      if (!isAdmin && currentUserId) {
        if (a.id === currentUserId) return -1;
        if (b.id === currentUserId) return 1;
      }
      return b.stores.length - a.stores.length;
    });
  };

  // Group columns: those with >= 2 stores get full prominent columns, <= 1 store grouped compactly
  const multiStoreColumns = sortColumns(allColumns.filter((c) => c.stores.length >= 2));
  const compactColumns = sortColumns(allColumns.filter((c) => c.stores.length < 2));

  // Drag Handlers (ONLY enabled for admin)
  const handleDragStart = (e, storeId) => {
    if (!canMoveStores) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', storeId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedStoreId(storeId);
  };

  const handleDragOver = (e, colId) => {
    if (!canMoveStores) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColId !== colId) {
      setDragOverColId(colId);
    }
  };

  const handleDragLeave = (e, colId) => {
    if (!canMoveStores) return;
    if (dragOverColId === colId) {
      setDragOverColId(null);
    }
  };

  const handleDrop = (e, targetColId) => {
    if (!canMoveStores) return;
    e.preventDefault();
    setDragOverColId(null);
    const storeId = e.dataTransfer.getData('text/plain') || draggedStoreId;
    if (!storeId) return;

    const nextTiendas = tiendas.map((t) => {
      if (t.id === storeId) {
        return { ...t, sup: targetColId };
      }
      return t;
    });

    onUpdateConfig({
      ...config,
      tiendas: nextTiendas,
    });
    setDraggedStoreId(null);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-2xl mb-8">
      {/* Board Top Header: Centered location icon, title and larger search bar */}
      <div className="flex flex-col items-center justify-center text-center gap-3.5 mb-6 pb-5 border-b border-slate-800/80">
        <div className="flex flex-col items-center justify-center gap-2.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/25">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-xl font-black text-white tracking-tight">
              {canMoveStores ? (
                'Arrastrá cualquier sucursal y soltala en otra supervisora para transferirla al instante'
              ) : (
                'Sucursales y asignaciones por supervisora'
              )}
            </h3>
            {canMoveStores && (
              <p className="text-xs text-slate-400 mt-1">
                Tenés permisos para reasignar sucursales entre bandejas.
              </p>
            )}
          </div>
        </div>

        {/* Larger Centered Search Input */}
        <div className="w-full max-w-md relative mt-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar sucursal por nombre..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl pl-11 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none shadow-inner transition text-left"
          />
        </div>
      </div>

      {/* Panel de Asignación de Guardia Operativa (Solo Administradores) */}
      {isAdmin && (
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900/80 to-purple-500/10 border border-amber-500/30 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-extrabold text-white">
                    Guardia Operativa · Permiso de Carga Global
                  </h4>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    Control Admin
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Asigná qué supervisora está autorizada hoy para cargar y guardar todas las sucursales de la red.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto md:min-w-[280px]">
              <select
                value={config.globalCargaSupervisorId || 'none'}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateConfig({
                    ...config,
                    globalCargaSupervisorId: val,
                  });
                }}
                className="w-full bg-slate-950 border border-amber-500/40 hover:border-amber-500 focus:border-amber-400 text-white font-bold text-xs sm:text-sm rounded-xl px-3 py-2.5 focus:outline-none shadow-inner cursor-pointer"
              >
                <option value="none">🚫 Ninguno (Solo Administradores)</option>
                <option value="__all">🌟 Todos los supervisores habilitados</option>
                <option disabled>──────────────</option>
                {supervisoras.map((s) => (
                  <option key={s.id} value={s.id}>
                    👤 {s.name} ({tiendas.filter((t) => t.sup === s.id).length} locales)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Helper to render a column */}
      {(() => {
        const renderColumn = (col, isCompact = false) => {
          const isOver = dragOverColId === col.id;
          const isExpanded = expandedCols[col.id] !== false;
          const isDimmed = !isAdmin && !col.isCurrentLoggedUser;

          const filteredStores = col.stores.filter((t) =>
            t.name.toLowerCase().includes(searchFilter.toLowerCase())
          );

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={(e) => handleDragLeave(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col rounded-2xl border gsap-card overflow-hidden ${
                isOver
                  ? 'bg-slate-800/80 border-amber-500 shadow-2xl shadow-amber-500/10 scale-[1.01]'
                  : col.isCurrentLoggedUser
                  ? 'bg-slate-950/90 border-amber-500/80 shadow-xl shadow-amber-500/5 ring-1 ring-amber-500/40'
                  : isDimmed
                  ? 'bg-slate-950/40 border-slate-800/50 opacity-60 hover:opacity-85'
                  : 'bg-slate-950/70 border-slate-800/80 shadow-inner'
              }`}
            >
              {/* Header */}
              <div
                onClick={() => toggleCol(col.id)}
                className={`p-3 sm:p-3.5 border-b border-slate-800/80 flex items-center justify-between gap-2.5 transition select-none cursor-pointer md:cursor-default ${
                  col.isCurrentLoggedUser
                    ? 'bg-gradient-to-r from-amber-500/10 via-slate-900/60 to-transparent'
                    : 'bg-slate-900/50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <UserAvatar
                    user={col}
                    name={col.name}
                    avatarColor={col.avatarColor}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-white text-xs sm:text-sm leading-snug truncate">
                      {col.name}
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 truncate mt-0.5">
                      {col.title}
                    </p>
                    {(col.id === config.globalCargaSupervisorId || config.globalCargaSupervisorId === '__all') && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-md mt-1 shadow-sm">
                        ⚡ Carga Global
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[11px] font-black px-2 py-0.5 rounded-full font-mono-numbers whitespace-nowrap ${
                      col.isCurrentLoggedUser
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-300 border border-slate-700/60'
                    }`}
                  >
                    {col.stores.length}
                  </span>
                  <div className="w-5 h-5 flex items-center justify-center text-slate-400 md:hidden">
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Stores List */}
              <div
                className={`p-2.5 sm:p-3 flex-1 flex-col space-y-1.5 bg-slate-950/60 ${
                  isExpanded ? 'flex' : 'hidden md:flex'
                }`}
              >
                {filteredStores.length === 0 ? (
                  <div className="p-3 text-center text-slate-500 text-xs border border-dashed border-slate-800/60 rounded-xl my-auto">
                    {searchFilter
                      ? 'Sin coincidencias'
                      : isOver
                      ? 'Soltá aquí'
                      : 'Sin sucursales'}
                  </div>
                ) : (
                  filteredStores.map((store) => {
                    const isDragging = draggedStoreId === store.id;

                    return (
                      <div
                        key={store.id}
                        draggable={canMoveStores}
                        onDragStart={(e) => handleDragStart(e, store.id)}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs font-semibold transition-all ${
                          canMoveStores
                            ? 'cursor-grab active:cursor-grabbing hover:border-amber-500/60 hover:bg-slate-850 hover:shadow-lg'
                            : 'cursor-default'
                        } ${
                          isDragging
                            ? 'opacity-40 border-amber-500 scale-95'
                            : isDimmed
                            ? 'bg-slate-900/60 border-slate-800/60 text-slate-300'
                            : 'bg-slate-900 border-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                          {canMoveStores && (
                            <GripVertical className="w-3.5 h-3.5 text-slate-500 hover:text-amber-400 transition shrink-0" />
                          )}
                          <span className="truncate text-white font-bold text-xs">
                            {store.name}
                          </span>
                          {store.isPropia && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black uppercase tracking-wider shrink-0 border border-amber-500/30">
                              Propia
                            </span>
                          )}
                          {store.isExperience && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-black uppercase tracking-wider shrink-0 border border-purple-500/30">
                              Experience
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {canMoveStores && isOver && (
                  <div className="mt-1.5 p-2 text-center border-2 border-dashed border-amber-500 rounded-xl text-amber-400 text-xs font-bold animate-pulse">
                    Soltá aquí
                  </div>
                )}
              </div>
            </div>
          );
        };

        return (
          <div ref={gridRef} className="space-y-6">
            {/* Primary Zones (Supervisors with multiple stores) */}
            {multiStoreColumns.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Zonas Operativas Principales
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    (Supervisores con múltiples sucursales)
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {multiStoreColumns.map((col) => renderColumn(col, false))}
                </div>
              </div>
            )}

            {/* Dedicated / Single Store / Standby Supervisors */}
            {compactColumns.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2 mb-3 px-1 mt-2">
                  <div className="w-2 h-2 rounded-full bg-slate-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Supervisión Dedicada / Tiendas Propias
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    (1 o menos sucursales)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {compactColumns.map((col) => renderColumn(col, true))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
