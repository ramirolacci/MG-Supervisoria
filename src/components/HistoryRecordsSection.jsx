import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  History, 
  Search, 
  Calendar, 
  Trash2, 
  FileSpreadsheet, 
  RefreshCw, 
  AlertTriangle, 
  Store, 
  User, 
  DollarSign, 
  Receipt, 
  ShoppingBag,
  Filter,
  CheckCircle2,
  X,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Award,
  Layers,
  ArrowUpRight,
  Info,
  FileText,
  Edit3,
  Save,
  Check,
  ChevronDown
} from 'lucide-react';
import { ARS, INT, DEC, parseYmd, pad, parseCount, parseMoney, formatMoneyInput, todayStr, formatThousands, MONTHF, getCardNumberFontSize } from '../lib/formatters';
import { exportHistoryPDF } from '../lib/pdfExport';
import { canUserDeleteRecords, canUserEditRecords } from '../lib/auth';
import { CustomDatePicker } from './CustomDatePicker';
import { AnimatedNumber } from './AnimatedNumber';
import { UserAvatar } from './UserAvatar';
import { animateModalEnter, animateModalExit, animatePopoverEnter, animatePopoverExit, gsap, useGSAP } from '../lib/animations';

// Función para mostrar fecha en formato Día/Mes/Año (DD/MM/YYYY)
function formatDMY(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function HistorySupervisorFilter({ value, onChange, supervisoras }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const popoverRef = useRef(null);

  const isAll = value === 'todos';
  const selectedSup = supervisoras.find((s) => s.id === value);

  const closeDropdown = () => {
    if (popoverRef.current) {
      animatePopoverExit(popoverRef.current, () => setIsOpen(false));
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

  return (
    <div className="relative w-full sm:w-auto" ref={containerRef}>
      <button
        type="button"
        onClick={() => (isOpen ? closeDropdown() : openDropdown())}
        className="w-full bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-slate-200 font-bold flex items-center justify-between gap-1.5 sm:gap-2 cursor-pointer transition shadow-inner group sm:min-w-[170px]"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {isAll ? (
            <span className="text-xs shrink-0">🌟</span>
          ) : (
            <UserAvatar
              user={selectedSup}
              name={selectedSup?.name}
              avatarColor={selectedSup?.avatarColor}
              className="w-4 h-4 sm:w-5 sm:h-5 rounded-md shrink-0"
              textClassName="text-[9px] sm:text-[10px] font-extrabold text-white"
            />
          )}
          <span className="truncate text-left">
            {isAll ? 'Todas las supervisoras' : selectedSup?.name || 'Supervisora'}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-amber-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 z-50 min-w-[220px] max-w-[calc(100vw-32px)] bg-slate-900/95 border border-slate-700/80 rounded-2xl p-2 shadow-2xl backdrop-blur-xl origin-top max-h-72 overflow-y-auto"
        >
          {/* Todas las supervisoras */}
          <button
            type="button"
            onClick={() => {
              onChange('todos');
              closeDropdown();
            }}
            className={`w-full flex items-center justify-between p-2 rounded-xl transition text-left cursor-pointer mb-1 ${
              isAll
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                : 'hover:bg-slate-800/80 text-slate-200 hover:text-white border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs">🌟</span>
              <span className="font-extrabold text-xs sm:text-sm truncate">Todas las supervisoras</span>
            </div>
            {isAll && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
          </button>

          <div className="border-t border-slate-800 my-1" />

          {supervisoras.map((s) => {
            const isSelected = value === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onChange(s.id);
                  closeDropdown();
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl transition text-left cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                    : 'hover:bg-slate-800/80 text-slate-200 hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <UserAvatar
                    user={s}
                    name={s.name}
                    avatarColor={s.avatarColor}
                    className="w-5 h-5 rounded-md"
                    textClassName="text-[10px] font-extrabold text-white"
                  />
                  <span className="font-bold text-xs sm:text-sm truncate">{s.name}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HistoryMonthFilter({ value, onChange, availableMonths }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const popoverRef = useRef(null);

  const isAll = value === 'todos';

  const formatMonthLabel = (m) => {
    if (m === 'todos') return 'Todos los meses';
    try {
      const d = parseYmd(m + '-01');
      const str = MONTHF.format(d);
      return str.charAt(0).toUpperCase() + str.slice(1);
    } catch {
      return m;
    }
  };

  const closeDropdown = () => {
    if (popoverRef.current) {
      animatePopoverExit(popoverRef.current, () => setIsOpen(false));
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

  return (
    <div className="relative w-full sm:w-auto" ref={containerRef}>
      <button
        type="button"
        onClick={() => (isOpen ? closeDropdown() : openDropdown())}
        className="w-full bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-slate-200 font-bold flex items-center justify-between gap-1.5 sm:gap-2 cursor-pointer transition shadow-inner group font-mono-numbers sm:min-w-[150px]"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
          <span className="truncate text-left">
            {formatMonthLabel(value)}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-amber-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute top-full right-0 mt-2 z-50 min-w-[200px] max-w-[calc(100vw-32px)] bg-slate-900/95 border border-slate-700/80 rounded-2xl p-2 shadow-2xl backdrop-blur-xl origin-top max-h-72 overflow-y-auto font-mono-numbers"
        >
          {/* Todos los meses */}
          <button
            type="button"
            onClick={() => {
              onChange('todos');
              closeDropdown();
            }}
            className={`w-full flex items-center justify-between p-2 rounded-xl transition text-left cursor-pointer mb-1 ${
              isAll
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                : 'hover:bg-slate-800/80 text-slate-200 hover:text-white border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-extrabold text-xs sm:text-sm truncate">Todos los meses</span>
            </div>
            {isAll && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
          </button>

          <div className="border-t border-slate-800 my-1" />

          {availableMonths.map((m) => {
            const isSelected = value === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  onChange(m);
                  closeDropdown();
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl transition text-left cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                    : 'hover:bg-slate-800/80 text-slate-200 hover:text-white border border-transparent'
                }`}
              >
                <span className="font-bold text-xs sm:text-sm truncate">{formatMonthLabel(m)}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function HistoryRecordsSection({
  cargas,
  isLoading,
  onRefresh,
  onDeleteRecord,
  onUpdateRecord,
  supervisoras,
  tiendas,
  currentUser,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSup, setSelectedSup] = useState('todos');
  const [selectedMonth, setSelectedMonth] = useState('todos');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteRecord, setConfirmDeleteRecord] = useState(null);
  
  // Registro seleccionado para modal de detalle interactivo con gráficos
  const [activeRecord, setActiveRecord] = useState(null);
  const modalBackdropRef = useRef(null);
  const modalContentRef = useRef(null);
  const statsGridRef = useRef(null);

  const handleCloseRecordModal = () => {
    if (modalContentRef.current && modalBackdropRef.current) {
      animateModalExit(modalContentRef.current, modalBackdropRef.current, () => {
        setActiveRecord(null);
        setIsEditing(false);
      });
    } else {
      setActiveRecord(null);
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (activeRecord && modalContentRef.current && modalBackdropRef.current) {
      animateModalEnter(modalContentRef.current, modalBackdropRef.current);

      // Animate progress and chart bars incrementing
      const timer = setTimeout(() => {
        if (!modalContentRef.current) return;
        const bars = modalContentRef.current.querySelectorAll('.gsap-modal-bar');
        if (bars.length > 0) {
          bars.forEach((b) => {
            const targetW = b.getAttribute('data-target-width') || '100%';
            gsap.fromTo(
              b,
              { width: '0%', opacity: 0.4 },
              { width: targetW, opacity: 1, duration: 0.75, ease: 'power2.out' }
            );
          });
        }
      }, 40);

      return () => clearTimeout(timer);
    }
  }, [activeRecord]);

  // Estados para modo de edición (solo administradores: admin, elizabeth, maria)
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    tiendaId: '',
    supervisoraId: '',
    fecha: '',
    comandas: '',
    venta: '',
    unidades: '',
    notas: '',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const canEdit = canUserEditRecords(currentUser);
  const canDelete = canUserDeleteRecords(currentUser);

  // Al abrir el modal en modo visualización
  const handleOpenRecord = (record) => {
    setActiveRecord(record);
    setIsEditing(false);
    setEditError('');
    setEditValues({
      tiendaId: record.tiendaId || '',
      supervisoraId: record.supervisoraId || '',
      fecha: record.fecha || '',
      comandas: record.comandas ? formatThousands(record.comandas) : '',
      venta: record.venta !== undefined && record.venta !== null ? formatMoneyInput(record.venta) : '',
      unidades: record.unidades ? formatThousands(record.unidades) : '',
      notas: record.notas || '',
    });
  };

  const handleStartEditing = () => {
    if (!activeRecord) return;
    setEditValues({
      tiendaId: activeRecord.tiendaId || '',
      supervisoraId: activeRecord.supervisoraId || '',
      fecha: activeRecord.fecha || '',
      comandas: activeRecord.comandas ? formatThousands(activeRecord.comandas) : '',
      venta: activeRecord.venta !== undefined && activeRecord.venta !== null ? formatMoneyInput(activeRecord.venta) : '',
      unidades: activeRecord.unidades ? formatThousands(activeRecord.unidades) : '',
      notas: activeRecord.notas || '',
    });
    setEditError('');
    setIsEditing(true);
  };

  const handleNumericEditChange = (field, raw) => {
    if (!raw.trim()) {
      setEditValues((prev) => ({ ...prev, [field]: '' }));
      return;
    }
    const digits = raw.replace(/\D/g, '');
    setEditValues((prev) => ({ ...prev, [field]: formatThousands(digits) }));
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditError('');
  };

  const handleSaveEdit = async () => {
    if (!activeRecord || !onUpdateRecord) return;
    setEditError('');

    if (!editValues.tiendaId) {
      setEditError('Debes seleccionar una sucursal.');
      return;
    }
    if (!editValues.fecha) {
      setEditError('Debes indicar una fecha válida.');
      return;
    }

    const c = parseCount(editValues.comandas);
    const v = parseMoney(editValues.venta);
    const u = parseCount(editValues.unidades);

    if (isNaN(c) || c < 0) {
      setEditError('Comandas inválidas: ingresá un número entero positivo.');
      return;
    }
    if (isNaN(v) || v < 0) {
      setEditError('Venta inválida: ingresá un monto válido (ej: 500000).');
      return;
    }
    if (isNaN(u) || u < 0) {
      setEditError('Unidades inválidas: ingresá un número entero positivo.');
      return;
    }

    setIsSavingEdit(true);
    try {
      // Obtener nombres para mantener consistencia
      const targetStore = (tiendas || []).find((t) => t.id === editValues.tiendaId);
      const targetSup = (supervisoras || []).find((s) => s.id === editValues.supervisoraId);

      const updated = {
        ...activeRecord,
        id: `${editValues.tiendaId}_${editValues.fecha}`,
        tiendaId: editValues.tiendaId,
        tiendaNombre: targetStore ? targetStore.name : activeRecord.tiendaNombre,
        supervisoraId: editValues.supervisoraId,
        supervisoraNombre: targetSup ? targetSup.name : (editValues.supervisoraId === 'sup_tester' ? 'TESTER' : activeRecord.supervisoraNombre),
        fecha: editValues.fecha,
        mes: editValues.fecha.slice(0, 7),
        comandas: c,
        venta: v,
        unidades: u,
        ticketPromedio: c > 0 ? v / c : 0,
        unidadesPorComanda: c > 0 ? u / c : 0,
        notas: editValues.notas ? editValues.notas.trim() : null,
      };

      await onUpdateRecord(updated, activeRecord);
      setActiveRecord(updated);
      setIsEditing(false);
    } catch (err) {
      setEditError('Error al guardar los cambios en la base de datos.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Extraer meses únicos disponibles (en formato YYYY-MM)
  const availableMonths = useMemo(() => {
    const set = new Set();
    cargas.forEach((c) => {
      if (c.fecha) {
        set.add(c.fecha.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [cargas]);

  // Filtrado reactivo
  const filteredRecords = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return cargas.filter((r) => {
      // 1. Texto de búsqueda (tienda, supervisora, fecha original YYYY-MM-DD o fecha DD/MM/YYYY)
      if (q) {
        const matchStore = (r.tiendaNombre || '').toLowerCase().includes(q);
        const matchSup = (r.supervisoraNombre || '').toLowerCase().includes(q);
        const matchFecha = (r.fecha || '').includes(q);
        const matchFechaDMY = formatDMY(r.fecha).includes(q);
        if (!matchStore && !matchSup && !matchFecha && !matchFechaDMY) return false;
      }

      // 2. Filtro de supervisora
      if (selectedSup !== 'todos' && r.supervisoraId !== selectedSup) {
        return false;
      }

      // 3. Filtro de mes
      if (selectedMonth !== 'todos' && !r.fecha?.startsWith(selectedMonth)) {
        return false;
      }

      return true;
    });
  }, [cargas, searchTerm, selectedSup, selectedMonth]);

  // Totales acumulados de la selección filtrada
  const totals = useMemo(() => {
    let venta = 0;
    let comandas = 0;
    let unidades = 0;
    filteredRecords.forEach((r) => {
      venta += Number(r.venta) || 0;
      comandas += Number(r.comandas) || 0;
      unidades += Number(r.unidades) || 0;
    });
    return {
      venta,
      comandas,
      unidades,
      ticket: comandas > 0 ? venta / comandas : 0,
      unidPorComanda: comandas > 0 ? unidades / comandas : 0,
    };
  }, [filteredRecords]);

  // Historial contextual para el detalle de la tienda activa
  const activeRecordHistory = useMemo(() => {
    if (!activeRecord) return [];
    const targetStoreId = activeRecord.tiendaId || activeRecord.tienda_id;
    const targetStoreName = (activeRecord.tiendaNombre || '').trim().toLowerCase();

    const list = (cargas || [])
      .filter((c) => {
        const cStoreId = c.tiendaId || c.tienda_id;
        const cStoreName = (c.tiendaNombre || '').trim().toLowerCase();
        if (targetStoreId && cStoreId && String(cStoreId) === String(targetStoreId)) {
          return true;
        }
        if (targetStoreName && cStoreName && targetStoreName === cStoreName) {
          return true;
        }
        return false;
      })
      .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
      .slice(-10); // Últimos 10 registros

    if (list.length === 0) {
      return [activeRecord];
    }
    return list;
  }, [activeRecord, cargas]);

  // Promedios históricos de esa sucursal
  const storeAverages = useMemo(() => {
    if (activeRecordHistory.length === 0) return null;
    let v = 0, c = 0, u = 0;
    activeRecordHistory.forEach((r) => {
      v += Number(r.venta) || 0;
      c += Number(r.comandas) || 0;
      u += Number(r.unidades) || 0;
    });
    const len = activeRecordHistory.length;
    return {
      avgVenta: v / len,
      avgComandas: c / len,
      avgUnidades: u / len,
      avgTicket: c > 0 ? v / c : 0,
      count: len,
    };
  }, [activeRecordHistory]);

  // Exportar registros filtrados a PDF detallado con métricas y tablas
  const handleExportPdf = () => {
    if (filteredRecords.length === 0) return;
    exportHistoryPDF(filteredRecords, {
      totalCount: cargas.length,
      title: selectedMonth !== 'todos' ? `Historial de Cargas · Período ${selectedMonth}` : 'Historial General de Cargas',
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteRecord) return;
    setDeletingId(confirmDeleteRecord.id);
    try {
      await onDeleteRecord(confirmDeleteRecord);
      if (activeRecord && activeRecord.id === confirmDeleteRecord.id) {
        setActiveRecord(null);
      }
      setConfirmDeleteRecord(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
            <History className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-black text-white tracking-tight">
              Historial de Cargas
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Tocá cualquier fila para abrir el análisis detallado con métricas y comparativa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold rounded-xl transition"
            title="Refrescar lista desde Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={filteredRecords.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600/90 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-lg shadow-rose-600/25 active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Descargar informe ejecutivo en PDF con tablas y totales"
          >
            <FileText className="w-4 h-4" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards de los registros filtrados: Mobile (Venta 1ra, Comandas y Empanadas 2x2 2da, Registros 3ra) */}
      <div ref={statsGridRef} className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 font-mono-numbers">
        {/* Registros Totales */}
        <div className="bg-slate-900/90 border border-slate-800/90 hover:border-amber-500/40 rounded-2xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between gsap-card shadow-xl group min-h-[160px] sm:min-h-[175px] order-4 lg:order-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20 shadow-sm shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-sans">
                  Registros Totales
                </p>
                <p className="text-[10px] text-slate-500 font-sans">
                  Cargas en base de datos
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-sans">
              Historial
            </span>
          </div>

          <div className="my-2 min-h-[44px] flex items-center">
            <p className={`${getCardNumberFontSize(filteredRecords.length)} font-black text-white tracking-tight whitespace-nowrap`}>
              <AnimatedNumber value={filteredRecords.length} formatter={(v) => INT.format(v)} />
            </p>
          </div>

          <div className="text-[11px] text-slate-400 font-sans flex items-center justify-between pt-2 border-t border-slate-800/60 mt-1">
            <span>Total en base</span>
            <span className="font-bold text-amber-300 font-mono-numbers">
              {cargas.length} registros
            </span>
          </div>
        </div>

        {/* Venta Acumulada */}
        <div className="bg-slate-900/90 border border-slate-800/90 hover:border-emerald-500/40 rounded-2xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between gsap-card shadow-xl group min-h-[160px] sm:min-h-[175px] order-1 lg:order-2 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-sm shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-sans">
                  Venta Acumulada
                </p>
                <p className="text-[10px] text-slate-500 font-sans">
                  Facturación de selección
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-sans">
              Facturación
            </span>
          </div>

          <div className="my-2 min-h-[44px] flex items-center">
            <p className={`${getCardNumberFontSize(totals.venta, { isMoney: true })} font-black text-emerald-400 tracking-tight whitespace-nowrap`}>
              <AnimatedNumber value={totals.venta} formatter={(v) => ARS.format(v)} />
            </p>
          </div>

          <div className="text-[11px] text-slate-400 font-sans flex items-center justify-between pt-2 border-t border-slate-800/60 mt-1">
            <span>Ticket promedio</span>
            <span className="font-bold text-emerald-300 font-mono-numbers">
              {totals.ticket ? <AnimatedNumber value={totals.ticket} formatter={(v) => ARS.format(v)} /> : '–'}
            </span>
          </div>
        </div>

        {/* Comandas Totales */}
        <div className="bg-slate-900/90 border border-slate-800/90 hover:border-blue-500/40 rounded-2xl p-3.5 sm:p-5 relative overflow-hidden flex flex-col justify-between gsap-card shadow-xl group min-h-[160px] sm:min-h-[175px] order-2 lg:order-3 col-span-1">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-2">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20 shadow-sm shrink-0">
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 font-sans truncate">
                  Comandas Totales
                </p>
                <p className="text-[9px] sm:text-[10px] text-slate-500 font-sans truncate">
                  Pedidos acumulados
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-sans">
              Tickets
            </span>
          </div>

          <div className="my-2 min-h-[44px] flex items-center">
            <p className={`${getCardNumberFontSize(totals.comandas)} font-black text-white tracking-tight whitespace-nowrap`}>
              <AnimatedNumber value={totals.comandas} formatter={(v) => INT.format(v)} />
            </p>
          </div>

          <div className="text-[10px] sm:text-[11px] text-slate-400 font-sans flex items-center justify-between pt-2 border-t border-slate-800/60 mt-1">
            <span className="truncate">Ticket prom.</span>
            <span className="font-bold text-blue-300 font-mono-numbers shrink-0">
              {totals.ticket ? ARS.format(totals.ticket) : '–'}
            </span>
          </div>
        </div>

        {/* Empanadas Totales */}
        <div className="bg-slate-900/90 border border-slate-800/90 hover:border-purple-500/40 rounded-2xl p-3.5 sm:p-5 relative overflow-hidden flex flex-col justify-between gsap-card shadow-xl group min-h-[160px] sm:min-h-[175px] order-3 lg:order-4 col-span-1">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-2">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20 shadow-sm shrink-0">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 font-sans truncate">
                  Empanadas Totales
                </p>
                <p className="text-[9px] sm:text-[10px] text-slate-500 font-sans truncate">
                  Unidades acumuladas
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-sans">
              Empanadas
            </span>
          </div>

          <div className="my-2 min-h-[44px] flex items-center">
            <p className={`${getCardNumberFontSize(totals.unidades)} font-black text-purple-300 tracking-tight whitespace-nowrap`}>
              <AnimatedNumber value={totals.unidades} formatter={(v) => INT.format(v)} />
            </p>
          </div>

          <div className="text-[10px] sm:text-[11px] text-slate-400 font-sans flex items-center justify-between pt-2 border-t border-slate-800/60 mt-1">
            <span className="truncate">Unid./cmd</span>
            <span className="font-bold text-purple-300 font-mono-numbers shrink-0">
              {totals.unidPorComanda ? `${totals.unidPorComanda.toFixed(1)} unid.` : '–'}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por sucursal, supervisora o fecha (DD/MM/YYYY)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-sm p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Desplegables de Supervisora y Mes en una sola línea en mobile */}
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
            {/* Selector de Supervisora Custom */}
            <HistorySupervisorFilter
              value={selectedSup}
              onChange={setSelectedSup}
              supervisoras={supervisoras}
            />

            {/* Selector de Mes Custom */}
            <HistoryMonthFilter
              value={selectedMonth}
              onChange={setSelectedMonth}
              availableMonths={availableMonths}
            />
          </div>

          {(searchTerm || selectedSup !== 'todos' || selectedMonth !== 'todos') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedSup('todos');
                setSelectedMonth('todos');
              }}
              className="px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl transition text-center cursor-pointer border border-rose-900/30 sm:border-transparent shrink-0"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla Principal de Registros Históricos */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono-numbers">
            <thead className="bg-slate-950/90 text-[11px] uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-800 font-sans">
              <tr>
                <th className="py-3 px-3 sm:px-4">Fecha</th>
                <th className="py-3 px-3 sm:px-4">Sucursal</th>
                <th className="py-3 px-3 sm:px-4">Supervisora</th>
                <th className="py-3 px-3 sm:px-4 text-right">Comandas</th>
                <th className="py-3 px-3 sm:px-4 text-right">Venta</th>
                <th className="py-3 px-3 sm:px-4 text-right">Unidades</th>
                <th className="py-3 px-3 sm:px-4 text-right">Ticket</th>
                <th className="py-3 px-3 sm:px-4 text-center w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading && cargas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-400 mb-2" />
                    <p className="text-sm font-sans">Cargando historial de auditorías...</p>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                    <History className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                    <p className="text-base font-bold text-slate-300">No se encontraron registros</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Probá ajustando la búsqueda o los filtros de mes y supervisora.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const sup = supervisoras.find((s) => s.id === r.supervisoraId);
                  const ticket = r.ticketPromedio
                    ? Number(r.ticketPromedio)
                    : r.comandas > 0
                    ? r.venta / r.comandas
                    : 0;

                  return (
                    <tr
                      key={r.id || `${r.tiendaId}_${r.fecha}`}
                      onClick={() => handleOpenRecord(r)}
                      className="hover:bg-purple-950/15 cursor-pointer transition group"
                    >
                      {/* Fecha (formato DD/MM/YYYY) */}
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-slate-300 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="font-mono">{formatDMY(r.fecha)}</span>
                        </span>
                      </td>

                      {/* Sucursal */}
                      <td className="py-3 px-3 sm:px-4 font-sans font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="group-hover:text-purple-300 transition">{r.tiendaNombre}</span>
                        </div>
                      </td>

                      {/* Supervisora */}
                      <td className="py-3 px-3 sm:px-4 font-sans text-xs text-slate-300 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300">
                          {r.supervisoraNombre || sup?.name || 'Sin supervisora'}
                        </span>
                      </td>

                      {/* Comandas */}
                      <td className="py-3 px-3 sm:px-4 text-right text-slate-200">
                        {INT.format(r.comandas)}
                      </td>

                      {/* Venta */}
                      <td className="py-3 px-3 sm:px-4 text-right font-black text-emerald-400">
                        {ARS.format(r.venta)}
                      </td>

                      {/* Unidades */}
                      <td className="py-3 px-3 sm:px-4 text-right text-slate-200">
                        {INT.format(r.unidades)}
                      </td>

                      {/* Ticket */}
                      <td className="py-3 px-3 sm:px-4 text-right text-slate-400 text-xs">
                        {ticket > 0 ? ARS.format(ticket) : '-'}
                      </td>

                      {/* Acciones */}
                      <td 
                        className="py-3 px-3 sm:px-4 text-center"
                        onClick={(e) => e.stopPropagation()} // Prevenir que abra el modal al clickear borrar
                      >
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenRecord(r)}
                            title="Ver detalle y gráficos"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-purple-950/40 transition"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteRecord(r)}
                              title="Eliminar este registro cargado"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Interactivo de Detalle, Edición y Gráficos */}
      {activeRecord && (
        <div
          ref={modalBackdropRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md"
        >
          <div
            ref={modalContentRef}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">{activeRecord.tiendaNombre}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {formatDMY(activeRecord.fecha)}
                    </span>
                    {isEditing && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                        Modo Edición
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Supervisora: <strong className="text-slate-200">{activeRecord.supervisoraNombre || 'Sin asignar'}</strong></span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseRecordModal}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido del Modal con Métricas, Formulario de Edición y Gráficos */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 font-mono-numbers">
              {/* Alerta de error si falla validación o guardado */}
              {editError && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2 font-sans animate-shake">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Si está en MODO EDICIÓN */}
              {isEditing ? (
                <div className="bg-slate-950/70 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 font-sans">
                      <Edit3 className="w-4 h-4 text-amber-400" />
                      <h4 className="text-sm font-bold text-white">Editar Parámetros de la Carga</h4>
                    </div>
                    <span className="text-[11px] font-sans text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                      Panel Administrativo
                    </span>
                  </div>

                  {/* 1. Sucursal, Supervisora y Fecha */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 font-sans">
                    {/* Sucursal */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-amber-400" />
                        <span>Sucursal</span>
                      </label>
                      <select
                        value={editValues.tiendaId}
                        onChange={(e) => setEditValues((prev) => ({ ...prev, tiendaId: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs focus:border-amber-400 focus:outline-none"
                      >
                        {(tiendas || []).map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Supervisora */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-purple-400" />
                        <span>Supervisora</span>
                      </label>
                      <select
                        value={editValues.supervisoraId}
                        onChange={(e) => setEditValues((prev) => ({ ...prev, supervisoraId: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs focus:border-purple-400 focus:outline-none"
                      >
                        <option value="">Sin supervisora asignada</option>
                        <option value="sup_tester">TESTER</option>
                        {(supervisoras || []).map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Fecha */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-sky-400" />
                        <span>Fecha del Registro (Día/Mes/Año)</span>
                      </label>
                      <CustomDatePicker
                        value={editValues.fecha}
                        onChange={(val) => setEditValues((prev) => ({ ...prev, fecha: val }))}
                        maxDate={todayStr()}
                        compact={true}
                      />
                    </div>
                  </div>

                  {/* 2. Valores numéricos de la carga */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 font-sans pt-1">
                    {/* Input Comandas */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-sky-400" />
                        <span>Comandas</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editValues.comandas}
                        onChange={(e) => handleNumericEditChange('comandas', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono font-bold text-base focus:border-amber-400 focus:outline-none"
                        placeholder="ej. 850"
                      />
                    </div>

                    {/* Input Venta */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Venta Total ($)</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editValues.venta}
                        onChange={(e) => handleNumericEditChange('venta', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-emerald-400 font-mono font-bold text-base focus:border-emerald-400 focus:outline-none"
                        placeholder="ej. 528244"
                      />
                    </div>

                    {/* Input Unidades */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-rose-400" />
                        <span>Unidades</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editValues.unidades}
                        onChange={(e) => handleNumericEditChange('unidades', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono font-bold text-base focus:border-rose-400 focus:outline-none"
                        placeholder="ej. 1025"
                      />
                    </div>
                  </div>

                  {/* Previsualización en Vivo de Ratios */}
                  {(() => {
                    const c = parseCount(editValues.comandas);
                    const v = parseMoney(editValues.venta);
                    const u = parseCount(editValues.unidades);
                    const ticket = !isNaN(c) && !isNaN(v) && c > 0 ? v / c : 0;
                    const upc = !isNaN(c) && !isNaN(u) && c > 0 ? u / c : 0;
                    return (
                      <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 flex items-center justify-around text-xs text-slate-400 font-sans">
                        <div>
                          <span>Ticket Promedio resultante: </span>
                          <strong className="text-amber-400 font-mono font-bold">
                            {ticket > 0 ? ARS.format(ticket) : '-'}
                          </strong>
                        </div>
                        <div className="w-px h-4 bg-slate-800" />
                        <div>
                          <span>Empanadas / Comanda: </span>
                          <strong className="text-sky-400 font-mono font-bold">
                            {upc > 0 ? upc.toFixed(1) : '-'} unid.
                          </strong>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* MODO VISUALIZACIÓN: Tarjetas Principales del Día */
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 sm:p-3.5">
                      <div className="text-[11px] font-sans text-slate-400 font-semibold mb-1 flex items-center justify-between">
                        <span>Venta Total</span>
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="text-sm sm:text-base md:text-lg font-black text-emerald-400 tracking-tight whitespace-nowrap">
                        <AnimatedNumber value={activeRecord.venta} formatter={(v) => ARS.format(v)} />
                      </div>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 sm:p-3.5">
                      <div className="text-[11px] font-sans text-slate-400 font-semibold mb-1 flex items-center justify-between">
                        <span>Comandas</span>
                        <Receipt className="w-3.5 h-3.5 text-sky-400" />
                      </div>
                      <div className="text-sm sm:text-base md:text-lg font-black text-white whitespace-nowrap">
                        <AnimatedNumber value={activeRecord.comandas} formatter={(v) => INT.format(v)} />
                      </div>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 sm:p-3.5">
                      <div className="text-[11px] font-sans text-slate-400 font-semibold mb-1 flex items-center justify-between">
                        <span>Unidades</span>
                        <ShoppingBag className="w-3.5 h-3.5 text-rose-400" />
                      </div>
                      <div className="text-sm sm:text-base md:text-lg font-black text-white whitespace-nowrap">
                        <AnimatedNumber value={activeRecord.unidades} formatter={(v) => INT.format(v)} />
                      </div>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 sm:p-3.5">
                      <div className="text-[11px] font-sans text-slate-400 font-semibold mb-1 flex items-center justify-between">
                        <span>Ticket Prom.</span>
                        <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <div className="text-sm sm:text-base md:text-lg font-black text-amber-400 tracking-tight whitespace-nowrap">
                        {activeRecord.comandas > 0 ? (
                          <AnimatedNumber
                            value={activeRecord.venta / activeRecord.comandas}
                            formatter={(v) => ARS.format(v)}
                          />
                        ) : (
                          '-'
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Barra de Auditoría de Carga / Modificación */}
                  {(activeRecord.modificadoPor || activeRecord.cargadoEn) && (
                    <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-sans">
                      <div className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-slate-500" />
                        {activeRecord.modificadoPor ? (
                          <span>
                            Última edición por <strong className="text-amber-300">{activeRecord.modificadoPor}</strong>
                            {activeRecord.modificadoEn && (
                              <span className="text-slate-500 ml-1">
                                ({new Date(activeRecord.modificadoEn).toLocaleDateString('es-AR')} {new Date(activeRecord.modificadoEn).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span>Carga original registrada en sistema</span>
                        )}
                      </div>

                      {activeRecord.cargadoEn && (
                        <span className="text-slate-500 text-[10px]">
                          Creado: {new Date(activeRecord.cargadoEn).toLocaleDateString('es-AR')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Ratios Operativos Clave */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-slate-300 font-sans uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <span>Ratios de Rendimiento</span>
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 font-sans">Empanadas por Comanda:</span>
                      <span className="font-bold text-white">
                        {activeRecord.comandas > 0 ? (
                          <AnimatedNumber
                            value={activeRecord.unidades / activeRecord.comandas}
                            decimals={1}
                            formatter={(v) => `${Number(v).toFixed(1)} unid.`}
                          />
                        ) : (
                          '0 unid.'
                        )}
                      </span>
                    </div>
                    {/* Barra de progreso visual referencial (base 15 empanadas) */}
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full gsap-modal-bar transition-none"
                        data-target-width={`${Math.min(100, (activeRecord.comandas > 0 ? (activeRecord.unidades / activeRecord.comandas) / 15 : 0) * 100)}%`}
                        style={{
                          width: `${Math.min(100, (activeRecord.comandas > 0 ? (activeRecord.unidades / activeRecord.comandas) / 15 : 0) * 100)}%`
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 font-sans">Precio Prom. por Unidad:</span>
                      <span className="font-bold text-emerald-400">
                        {activeRecord.unidades > 0 ? (
                          <AnimatedNumber
                            value={activeRecord.venta / activeRecord.unidades}
                            formatter={(v) => ARS.format(v)}
                          />
                        ) : (
                          '-'
                        )}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full gsap-modal-bar transition-none"
                        data-target-width="85%"
                        style={{ width: '85%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfico Comparativo: Historial de los últimos días de esta sucursal */}
              {activeRecordHistory.length > 0 && (
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 font-sans uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>Evolución de Venta Reciente ({activeRecordHistory.length} {activeRecordHistory.length === 1 ? 'fecha' : 'fechas'})</span>
                    </h4>
                    {storeAverages && (
                      <span className="text-[11px] text-slate-400 font-sans">
                        Promedio: <strong className="text-white">
                          <AnimatedNumber value={storeAverages.avgVenta} formatter={(v) => ARS.format(v)} />
                        </strong>
                      </span>
                    )}
                  </div>

                  {/* Visual Bar Chart */}
                  {(() => {
                    const maxVenta = Math.max(...activeRecordHistory.map((h) => Number(h.venta) || 0), 1);
                    return (
                      <div className="space-y-2 pt-2">
                        {activeRecordHistory.map((item) => {
                          const isCurrent = item.fecha === activeRecord.fecha;
                          const pct = Math.max(8, ((Number(item.venta) || 0) / maxVenta) * 100);
                          return (
                            <div key={item.fecha} className="flex items-center gap-2.5 text-xs">
                              <span className={`w-20 font-mono text-[11px] shrink-0 ${isCurrent ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                                {formatDMY(item.fecha)}
                              </span>
                              <div className="flex-1 bg-slate-900 h-6 rounded-lg overflow-hidden p-0.5 flex items-center">
                                <div
                                  className={`h-full rounded-md flex items-center px-2 text-[10px] font-bold text-slate-950 truncate gsap-modal-bar transition-none ${
                                    isCurrent
                                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-md shadow-amber-500/20'
                                      : 'bg-gradient-to-r from-slate-700 to-slate-600 text-slate-300'
                                  }`}
                                  data-target-width={`${pct}%`}
                                  style={{ width: `${pct}%` }}
                                >
                                  <AnimatedNumber value={item.venta} formatter={(v) => ARS.format(v)} />
                                </div>
                              </div>
                              <span className="w-14 text-right text-[11px] text-slate-400 shrink-0">
                                <AnimatedNumber
                                  value={item.comandas}
                                  formatter={(v) => `${INT.format(v)} cmd`}
                                />
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Footer de Acciones del Modal */}
            <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3">
              <div>
                {canDelete && !isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDeleteRecord(activeRecord);
                    }}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/70 hover:border-rose-600 hover:text-white transition-all shadow-md shadow-rose-950/30 active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Eliminar</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCancelEditing}
                      disabled={isSavingEdit}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={isSavingEdit}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingEdit ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Guardar cambios</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={handleStartEditing}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition active:scale-95 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Modificar</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCloseRecordModal}
                      className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Borrado */}
      {confirmDeleteRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-900/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-white">¿Eliminar este registro?</h3>
              <p className="text-xs text-slate-400">
                Vas a borrar la carga de <strong className="text-slate-200">{confirmDeleteRecord.tiendaNombre}</strong> del día{' '}
                <strong className="text-slate-200">{formatDMY(confirmDeleteRecord.fecha)}</strong>.
              </p>
              <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-1 font-mono-numbers">
                <div className="flex justify-between text-slate-400 font-sans">
                  <span>Supervisora:</span>
                  <span className="text-slate-200 font-semibold">{confirmDeleteRecord.supervisoraNombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Venta:</span>
                  <span className="text-emerald-400 font-bold">{ARS.format(confirmDeleteRecord.venta)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Comandas / Unidades:</span>
                  <span className="text-slate-200">{confirmDeleteRecord.comandas} cmdas · {confirmDeleteRecord.unidades} unid.</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteRecord(null)}
                disabled={Boolean(deletingId)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={Boolean(deletingId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5"
              >
                {deletingId ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Borrando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sí, eliminar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
