import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Share2,
  ChevronLeft,
  ChevronRight,
  Target,
  AlertCircle,
  Check,
  ListTodo,
  User,
  ArrowLeft,
} from 'lucide-react';
import { api } from '../lib/api';
import { UserAvatar } from './UserAvatar';
import { canUserViewLiveLocations, canUserAccessSupervisionFromPlanificacion } from '../lib/auth';

const DOW = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DOWS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHL = new Intl.DateTimeFormat('es-AR', { month: 'long' });
const WDL = new Intl.DateTimeFormat('es-AR', { weekday: 'long' });

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = (s) => {
  if (!s) return new Date();
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const todayStr = () => ymd(new Date());
const nowHM = () => {
  const d = new Date();
  return pad(d.getHours()) + ':' + pad(d.getMinutes());
};
const toMin = (hm) => {
  const [h, m] = String(hm || '0:0').split(':').map(Number);
  return h * 60 + m;
};
const fmtHrs = (mins) => {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
};
const dd = (s) => {
  const d = parseYmd(s);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
};
const fmtDayLong = (s) => {
  const d = parseYmd(s);
  const w = WDL.format(d);
  return `${w.charAt(0).toUpperCase() + w.slice(1)} ${dd(s)}`;
};
const mondayOf = (d) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};
const addDays = (s, n) => {
  const d = parseYmd(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
};
const thisWeek = () => ymd(mondayOf(new Date()));

function weekLabel(w) {
  const a = parseYmd(w);
  const b = parseYmd(addDays(w, 6));
  return a.getMonth() === b.getMonth()
    ? `Semana del ${a.getDate()} al ${b.getDate()} de ${MONTHL.format(b)}`
    : `Semana del ${a.getDate()} de ${MONTHL.format(a)} al ${b.getDate()} de ${MONTHL.format(b)}`;
}

const ACTS = [
  'Auditoría',
  'Visita de seguimiento',
  'Capacitación',
  'Inducción',
  'Reunión',
  'Reporte / administración',
  'Traslado',
  'Otro',
];

export function PlanificacionSupervisoras({ config = {}, currentUser, isAdmin, onNavigate }) {
  const supervisoras = config?.supervisoras || [];
  const tiendas = config?.tiendas || [];

  // Permiso para ver el bloque en tiempo real: Solo Admin, Elizabeth y Lidya
  const canSeeNowBlock = canUserViewLiveLocations(currentUser);

  // Permiso para volver a Supervisión: Solo Admin, Elizabeth y María Salazar
  const canAccessSupervision = canUserAccessSupervisionFromPlanificacion(currentUser);

  // Si el usuario es una supervisora específica (no admin con __all), se bloquea para gestionar solo su propio perfil
  const isDedicatedSupervisor = Boolean(currentUser?.supId && currentUser.supId !== '__all');
  const loggedSupervisorId = currentUser?.supId;

  const [currentWeek, setCurrentWeek] = useState(thisWeek());
  const [planes, setPlanes] = useState({});
  const [nowPlanes, setNowPlanes] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDayView, setSelectedDayView] = useState(() => todayStr());
  const [toast, setToast] = useState(null);

  // Supervisora activa en el panel de carga unificado (horarios y objetivos)
  const [selectedSupId, setSelectedSupId] = useState(() => {
    if (isDedicatedSupervisor && loggedSupervisorId) {
      return loggedSupervisorId;
    }
    return supervisoras.length > 0 ? supervisoras[0].id : '';
  });

  // Estado del formulario de horario
  const [edDay, setEdDay] = useState(() => todayStr());
  const [edDesde, setEdDesde] = useState('');
  const [edHasta, setEdHasta] = useState('');
  const [edLugar, setEdLugar] = useState('');
  const [edLugarCustom, setEdLugarCustom] = useState('');
  const [edAct, setEdAct] = useState(ACTS[0]);
  const [edDet, setEdDet] = useState('');
  const [editingBlockId, setEditingBlockId] = useState(null);

  // Estado de objetivo nuevo
  const [newObjText, setNewObjText] = useState('');
  const [copyBoxText, setCopyBoxText] = useState(null);

  const editorRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Cargar planes de la semana seleccionada
  const loadPlanes = async (w) => {
    setIsLoading(true);
    try {
      const data = await api.getPlanesSemana(w);
      setPlanes(data || {});
      if (w === thisWeek()) {
        setNowPlanes(data || {});
      }
    } catch (e) {
      console.warn('Error loading planes:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlanes(currentWeek);
    if (canSeeNowBlock && currentWeek !== thisWeek()) {
      api.getPlanesSemana(thisWeek()).then((d) => setNowPlanes(d || {}));
    }
  }, [currentWeek, canSeeNowBlock]);

  // Selección inicial de supervisora
  useEffect(() => {
    if (isDedicatedSupervisor && loggedSupervisorId) {
      setSelectedSupId(loggedSupervisorId);
    } else if (!selectedSupId && supervisoras.length > 0) {
      setSelectedSupId(supervisoras[0].id);
    }
  }, [supervisoras, selectedSupId, isDedicatedSupervisor, loggedSupervisorId]);

  // Ajustar edDay al navegar entre semanas
  useEffect(() => {
    const t = todayStr();
    if (selectedDayView !== 'semana') {
      if (selectedDayView < currentWeek || selectedDayView > addDays(currentWeek, 6)) {
        const fallback = t >= currentWeek && t <= addDays(currentWeek, 6) ? t : currentWeek;
        setSelectedDayView(fallback);
        setEdDay(fallback);
      } else {
        setEdDay(selectedDayView);
      }
    } else {
      setEdDay(currentWeek);
    }
  }, [currentWeek, selectedDayView]);

  const planOf = (supId) =>
    planes[supId] || { supId, semana: currentWeek, bloques: [], objetivos: [] };

  const tiendaName = (id) => (tiendas.find((t) => t.id === id) || {}).name || 'Tienda';
  const placeName = (b) => (b.tiendaId ? tiendaName(b.tiendaId) : b.lugarTexto || 'Sin lugar');

  const sortBlocks = (blocks) =>
    (blocks || []).slice().sort((a, b) => a.dia.localeCompare(b.dia) || a.desde.localeCompare(b.desde));

  const isBlockNow = (b) => {
    const n = nowHM();
    return b.dia === todayStr() && b.desde <= n && n < b.hasta;
  };

  // Guardar mutación sobre el plan
  const mutatePlan = async (supId, mutatorFn, successMsg) => {
    const current = JSON.parse(
      JSON.stringify(
        planes[supId] || {
          supId,
          semana: currentWeek,
          bloques: [],
          objetivos: [],
        }
      )
    );
    mutatorFn(current);

    // Optimistic update
    setPlanes((prev) => ({ ...prev, [supId]: current }));
    if (currentWeek === thisWeek()) {
      setNowPlanes((prev) => ({ ...prev, [supId]: current }));
    }

    try {
      await api.savePlan(supId, currentWeek, current, currentUser?.name || currentUser?.email);
      if (successMsg) showToast(successMsg, 'success');
    } catch (e) {
      showToast('Error al sincronizar con el servidor', 'error');
    }
  };

  // OBJETIVOS
  const handleAddObj = () => {
    const text = newObjText.trim();
    if (!text || !selectedSupId) return;
    const newObj = {
      id: 'obj_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      texto: text,
      hecho: false,
    };
    mutatePlan(
      selectedSupId,
      (p) => {
        p.objetivos = [...(p.objetivos || []), newObj];
      },
      'Objetivo agregado'
    );
    setNewObjText('');
  };

  const handleToggleObj = (objId, currentVal) => {
    mutatePlan(selectedSupId, (p) => {
      p.objetivos = (p.objetivos || []).map((o) =>
        o.id === objId ? { ...o, hecho: !currentVal, hechoEn: !currentVal ? new Date().toISOString() : null } : o
      );
    });
  };

  const handleDeleteObj = (objId) => {
    mutatePlan(
      selectedSupId,
      (p) => {
        p.objetivos = (p.objetivos || []).filter((o) => o.id !== objId);
      },
      'Objetivo eliminado'
    );
  };

  // HORARIOS
  const handleSaveBlock = () => {
    if (!selectedSupId) {
      showToast('Seleccioná una supervisora.', 'error');
      return;
    }
    if (!edDesde || !edHasta) {
      showToast('Completá la hora de inicio y fin.', 'error');
      return;
    }
    if (edDesde >= edHasta) {
      showToast('La hora de fin debe ser posterior a la de inicio.', 'error');
      return;
    }
    if (!edLugar) {
      showToast('Seleccioná el lugar de la actividad.', 'error');
      return;
    }

    let tiendaId = null;
    let lugarTexto = '';
    if (edLugar.startsWith('t:')) {
      tiendaId = edLugar.slice(2);
    } else if (edLugar === 'x:custom') {
      lugarTexto = edLugarCustom.trim();
      if (!lugarTexto) {
        showToast('Escribí el nombre del lugar.', 'error');
        return;
      }
    } else {
      lugarTexto = edLugar.slice(2);
    }

    // Verificar superposición con bloques ya existentes en el mismo día
    const currentBlocks = planOf(selectedSupId).bloques || [];
    const clash = currentBlocks.find(
      (b) =>
        b.dia === edDay &&
        b.id !== editingBlockId &&
        b.desde < edHasta &&
        edDesde < b.hasta
    );
    if (clash) {
      showToast(
        `Se superpone con ${placeName(clash)} (${clash.desde} a ${clash.hasta})`,
        'error'
      );
      return;
    }

    const blockData = {
      id: editingBlockId || 'b_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      dia: edDay,
      desde: edDesde,
      hasta: edHasta,
      tiendaId,
      lugarTexto,
      actividad: edAct,
      detalle: edDet.trim(),
    };

    mutatePlan(
      selectedSupId,
      (p) => {
        if (editingBlockId) {
          p.bloques = (p.bloques || []).map((b) => (b.id === editingBlockId ? blockData : b));
        } else {
          p.bloques = [...(p.bloques || []), blockData];
        }
      },
      editingBlockId ? 'Actividad actualizada' : 'Horario guardado con éxito'
    );

    setEditingBlockId(null);
    setEdDesde(edHasta);
    setEdHasta('');
    setEdDet('');
  };

  const handleEditBlock = (b) => {
    setEdDay(b.dia);
    setEdDesde(b.desde);
    setEdHasta(b.hasta);
    if (b.tiendaId) {
      setEdLugar(`t:${b.tiendaId}`);
      setEdLugarCustom('');
    } else if (['Oficina', 'Traslado'].includes(b.lugarTexto)) {
      setEdLugar(`x:${b.lugarTexto}`);
      setEdLugarCustom('');
    } else {
      setEdLugar('x:custom');
      setEdLugarCustom(b.lugarTexto || '');
    }
    setEdAct(b.actividad || ACTS[0]);
    setEdDet(b.detalle || '');
    setEditingBlockId(b.id);

    if (editorRef.current) {
      editorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDeleteBlock = (blockId) => {
    mutatePlan(
      selectedSupId,
      (p) => {
        p.bloques = (p.bloques || []).filter((b) => b.id !== blockId);
      },
      'Actividad eliminada'
    );
    if (editingBlockId === blockId) {
      setEditingBlockId(null);
    }
  };

  // Copiar horarios de la semana anterior
  const handleCopyPrevWeek = async () => {
    if (!selectedSupId) return;
    const currentBlocks = planOf(selectedSupId).bloques || [];
    if (currentBlocks.length > 0) {
      showToast('Esta supervisora ya tiene actividades cargadas en la semana.', 'error');
      return;
    }
    const prevWeekStr = addDays(currentWeek, -7);
    try {
      const prevData = await api.getPlanesSemana(prevWeekStr);
      const prevPlan = prevData[selectedSupId];
      if (!prevPlan || !prevPlan.bloques || prevPlan.bloques.length === 0) {
        showToast('La semana anterior no tiene actividades cargadas.', 'error');
        return;
      }
      const newBlocks = prevPlan.bloques.map((b) => ({
        ...b,
        id: 'b_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        dia: addDays(b.dia, 7),
      }));
      mutatePlan(
        selectedSupId,
        (p) => {
          p.bloques = newBlocks;
        },
        `Copiadas ${newBlocks.length} actividades de la semana anterior`
      );
    } catch (e) {
      showToast('No se pudo leer la semana anterior.', 'error');
    }
  };

  // WhatsApp
  const handleCopyWhatsApp = async () => {
    const lines = [`*Planificación de supervisoras Mi Gusto*`, weekLabel(currentWeek), ''];
    supervisoras.forEach((s) => {
      const p = planOf(s.id);
      const ob = p.objetivos || [];
      const bl = p.bloques || [];
      lines.push(`*${s.name}*`);
      if (ob.length > 0) {
        const done = ob.filter((o) => o.hecho).length;
        lines.push(`Objetivos (${done} de ${ob.length} cumplidos):`);
        ob.forEach((o) => {
          lines.push(`${o.hecho ? '✅' : '⬜'} ${o.texto}`);
        });
      }
      DOW.forEach((d, i) => {
        const dayDate = addDays(currentWeek, i);
        const dayBlocks = sortBlocks(bl.filter((b) => b.dia === dayDate));
        if (dayBlocks.length > 0) {
          lines.push(
            `_${d} ${dd(dayDate)}_: ` +
              dayBlocks.map((b) => `${b.desde}–${b.hasta} ${placeName(b)} (${b.actividad})`).join(' · ')
          );
        }
      });
      if (!ob.length && !bl.length) {
        lines.push('Sin planificación cargada.');
      }
      lines.push('');
    });

    const fullText = lines.join('\n').trim();
    try {
      await navigator.clipboard.writeText(fullText);
      setCopyBoxText(null);
      showToast('¡Texto copiado para WhatsApp!', 'success');
    } catch (e) {
      setCopyBoxText(fullText);
      showToast('Seleccioná y copiá el texto recuadrado abajo', 'info');
    }
  };

  // "¿Dónde está cada una ahora?" (Solo Admin, Elizabeth y Lidya)
  const currentNowItems = useMemo(() => {
    if (!canSeeNowBlock) return [];
    const t = todayStr();
    const n = nowHM();
    return supervisoras.map((s) => {
      const sPlan = nowPlanes[s.id] || planOf(s.id);
      const todayBlocks = sortBlocks((sPlan.bloques || []).filter((b) => b.dia === t));
      const cur = todayBlocks.find((b) => b.desde <= n && n < b.hasta);
      const next = todayBlocks.find((b) => b.desde > n);
      const last = todayBlocks.length > 0 ? todayBlocks[todayBlocks.length - 1] : null;

      let status = 'none';
      if (cur) status = 'active';
      else if (next) status = 'upcoming';
      else if (todayBlocks.length > 0) status = 'finished';

      return {
        supervisora: s,
        status,
        cur,
        next,
        last,
        todayCount: todayBlocks.length,
      };
    });
  }, [supervisoras, nowPlanes, planes, canSeeNowBlock]);

  // Datos de la supervisora actualmente seleccionada en el panel unificado
  const activeSupObj = supervisoras.find((s) => s.id === selectedSupId);
  const activePlan = planOf(selectedSupId);
  const activeObjs = activePlan.objetivos || [];
  const activeDoneCount = activeObjs.filter((o) => o.hecho).length;
  const activePct = activeObjs.length > 0 ? Math.round((activeDoneCount / activeObjs.length) * 100) : 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      {/* Toast de confirmación */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border text-sm font-bold backdrop-blur-md transition-all ${
            toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-800'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <Check className="w-5 h-5 shrink-0" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* HEADER DE SEMANA */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          {onNavigate && canAccessSupervision && (
            <button
              type="button"
              onClick={() => onNavigate('')}
              className="px-3 py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer shadow-sm group"
              title="Volver a Carga Diaria y Supervisión"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Supervisión</span>
            </button>
          )}
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Planificación de Supervisoras
              </h2>
              {canSeeNowBlock && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Panel Completo
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Carga tus horarios y objetivos semanales, y consulta el cronograma de visitas.
            </p>
          </div>
        </div>

        {/* Selector de semana */}
        <div className="flex items-center gap-2 bg-slate-950/90 p-1.5 rounded-2xl border border-slate-800 shadow-inner w-full md:w-auto justify-between md:justify-start">
          <button
            type="button"
            onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
            className="p-2 sm:px-3 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition cursor-pointer"
            title="Semana anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-xs sm:text-sm font-extrabold text-amber-400 px-2 text-center whitespace-nowrap">
            {weekLabel(currentWeek)}
          </span>

          <button
            type="button"
            onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
            className="p-2 sm:px-3 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition cursor-pointer"
            title="Semana siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {currentWeek !== thisWeek() && (
            <button
              type="button"
              onClick={() => setCurrentWeek(thisWeek())}
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 transition cursor-pointer ml-1 shadow-md shadow-amber-500/20"
            >
              Semana actual
            </button>
          )}
        </div>
      </div>

      {/* BLOQUE EXCLUSIVO PARA ADMIN, ELIZABETH Y LIDYA: ¿DÓNDE ESTÁ CADA UNA AHORA? */}
      {canSeeNowBlock && (
        <div className="space-y-3 p-4 sm:p-5 rounded-3xl bg-slate-950/60 border border-purple-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                ¿Dónde está cada una ahora?
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Solo Dirección y Admins
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              {fmtDayLong(todayStr())} · {nowHM()} hs
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mt-2">
            {currentNowItems.map(({ supervisora, status, cur, next, last }) => {
              const isOnline = status === 'active';
              const isPending = status === 'upcoming';
              const isDone = status === 'finished';

              return (
                <div
                  key={supervisora.id}
                  className={`relative rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between ${
                    isOnline
                      ? 'bg-slate-900/90 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                      : isPending
                      ? 'bg-slate-900/70 border-amber-500/40 shadow-sm'
                      : 'bg-slate-900/40 border-slate-800/80 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar
                          user={supervisora}
                          name={supervisora.name}
                          className="w-9 h-9 rounded-xl"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-white truncate">
                            {supervisora.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {supervisora.title || 'Supervisora'}
                          </span>
                        </div>
                      </div>

                      {isOnline ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Ahora
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {next.desde} hs
                        </span>
                      ) : isDone ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                          Terminó
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-800/50 text-slate-500 border border-slate-800">
                          Sin horario
                        </span>
                      )}
                    </div>

                    {isOnline && cur ? (
                      <div className="space-y-1">
                        <div className="text-sm font-black text-white flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{placeName(cur)}</span>
                        </div>
                        <div className="text-[11px] text-emerald-300 font-medium">
                          {cur.actividad} · {cur.desde} a {cur.hasta} hs
                        </div>
                        {cur.detalle && (
                          <p className="text-[10px] text-slate-400 italic line-clamp-2">
                            "{cur.detalle}"
                          </p>
                        )}
                      </div>
                    ) : isPending && next ? (
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{placeName(next)}</span>
                        </div>
                        <div className="text-[11px] text-amber-300/90 font-medium">
                          {next.actividad} · {next.desde} a {next.hasta} hs
                        </div>
                      </div>
                    ) : isDone && last ? (
                      <p className="text-[11px] text-slate-400">
                        Finalizó su jornada en <strong className="text-slate-300">{placeName(last)}</strong>.
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500">
                        No tiene visitas programadas para hoy.
                      </p>
                    )}
                  </div>

                  {isOnline && next && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Siguiente:</span>
                      <strong className="text-slate-200">
                        {placeName(next)} ({next.desde} hs)
                      </strong>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* COMPONENTE UNIFICADO DE CARGA: OBJETIVOS Y HORARIOS DE LA SUPERVISORA */}
      <div
        ref={editorRef}
        className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <ListTodo className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                Mi Planificación Semanal
              </h3>
              <p className="text-xs text-slate-400">
                Carga tus objetivos y cronograma de horarios en este panel unificado.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Si es Admin, puede cambiar de supervisora. Si es supervisora dedicada, queda fija en su cuenta */}
            {!isDedicatedSupervisor ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 hidden sm:inline">
                  Supervisora:
                </span>
                <select
                  value={selectedSupId}
                  onChange={(e) => setSelectedSupId(e.target.value)}
                  className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-amber-500 w-full sm:w-auto"
                >
                  {supervisoras.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                <UserAvatar user={activeSupObj} name={activeSupObj?.name} className="w-6 h-6 rounded-lg" />
                <span className="text-xs sm:text-sm font-extrabold text-amber-400">
                  {activeSupObj?.name || currentUser?.name}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95 shrink-0"
              title="Copiar resumen para WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compartir WhatsApp</span>
            </button>
          </div>
        </div>

        {/* PARTE 1: OBJETIVOS SEMANALES DE LA SUPERVISORA */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-extrabold text-white">
                Objetivos de la Semana ({activeDoneCount} de {activeObjs.length} cumplidos)
              </h4>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {activePct}% completado
            </span>
          </div>

          {/* Barra de progreso */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${activePct}%` }}
            ></div>
          </div>

          {/* Lista de objetivos tachables */}
          {activeObjs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
              {activeObjs.map((o) => (
                <div
                  key={o.id}
                  className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition ${
                    o.hecho
                      ? 'bg-emerald-950/20 border-emerald-900/30 text-slate-500'
                      : 'bg-slate-900/80 border-slate-800 text-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleObj(o.id, o.hecho)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-400 transition cursor-pointer shrink-0"
                  >
                    {o.hecho ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                    )}
                  </button>

                  <span
                    className={`text-xs flex-1 break-words leading-tight ${
                      o.hecho ? 'line-through text-slate-500' : 'text-slate-200'
                    }`}
                  >
                    {o.texto}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDeleteObj(o.id)}
                    className="text-slate-600 hover:text-rose-400 p-0.5 rounded transition cursor-pointer shrink-0"
                    title="Eliminar objetivo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-2">
              No tienes objetivos cargados para esta semana todavía.
            </p>
          )}

          {/* Input para agregar nuevo objetivo */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newObjText}
              onChange={(e) => setNewObjText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddObj();
                }
              }}
              placeholder="Escribe un objetivo para esta semana y presiona Enter..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={handleAddObj}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Objetivo</span>
            </button>
          </div>
        </div>

        {/* PARTE 2: CARGA Y GESTIÓN DE HORARIOS */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-extrabold text-white">
                {editingBlockId ? 'Editando Horario' : 'Cargar Horario de Visita / Actividad'}
              </h4>
            </div>

            <button
              type="button"
              onClick={handleCopyPrevWeek}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Copiar actividades de la semana pasada"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar semana anterior</span>
            </button>
          </div>

          {/* Formulario de carga de franja horaria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            {/* Día */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Día
              </label>
              <select
                value={edDay}
                onChange={(e) => setEdDay(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-amber-500"
              >
                {DOW.map((d, i) => {
                  const dayDate = addDays(currentWeek, i);
                  return (
                    <option key={dayDate} value={dayDate}>
                      {d} {dd(dayDate)}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Desde / Hasta */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Desde
                </label>
                <input
                  type="time"
                  step="900"
                  value={edDesde}
                  onChange={(e) => setEdDesde(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs sm:text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Hasta
                </label>
                <input
                  type="time"
                  step="900"
                  value={edHasta}
                  onChange={(e) => setEdHasta(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs sm:text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Dónde */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                ¿Dónde?
              </label>
              <select
                value={edLugar}
                onChange={(e) => setEdLugar(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-amber-500"
              >
                <option value="">Elegí dónde...</option>
                <optgroup label="Sucursales">
                  {tiendas.map((t) => (
                    <option key={t.id} value={`t:${t.id}`}>
                      {t.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Otros">
                  <option value="x:Oficina">Oficina Central</option>
                  <option value="x:Traslado">En traslado</option>
                  <option value="x:custom">Otro (escribir)</option>
                </optgroup>
              </select>
            </div>

            {/* Actividad */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Actividad
              </label>
              <select
                value={edAct}
                onChange={(e) => setEdAct(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-amber-500"
              >
                {ACTS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Lugar personalizado si eligió 'Otro (escribir)' */}
            {edLugar === 'x:custom' && (
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                  Lugar específico
                </label>
                <input
                  type="text"
                  value={edLugarCustom}
                  onChange={(e) => setEdLugarCustom(e.target.value)}
                  placeholder="Ej.: Reunión con proveedores, Centro de logística..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {/* Detalle opcional */}
            <div className={edLugar === 'x:custom' ? 'sm:col-span-2' : 'sm:col-span-4'}>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Detalle opcional
              </label>
              <input
                type="text"
                value={edDet}
                onChange={(e) => setEdDet(e.target.value)}
                placeholder="Ej.: Auditoría formato Experience, verificación de caja..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveBlock}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95"
            >
              {editingBlockId ? 'Guardar Cambios' : 'Guardar Horario'}
            </button>

            {editingBlockId && (
              <button
                type="button"
                onClick={() => {
                  setEditingBlockId(null);
                  setEdDesde('');
                  setEdHasta('');
                  setEdDet('');
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>

          {/* Horarios ya cargados en la semana para la supervisora activa */}
          <div className="pt-3 border-t border-slate-800">
            <h5 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
              Horarios de la semana para {activeSupObj?.name}
            </h5>

            {DOW.map((dayName, idx) => {
              const dayDate = addDays(currentWeek, idx);
              const sBlocks = sortBlocks(
                (activePlan.bloques || []).filter((b) => b.dia === dayDate)
              );
              if (sBlocks.length === 0) return null;

              return (
                <div key={dayDate} className="mb-2.5 space-y-1">
                  <span className="text-[11px] font-extrabold text-amber-400/90">
                    {dayName} {dd(dayDate)}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {sBlocks.map((b) => (
                      <div
                        key={b.id}
                        className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-black text-amber-400">
                              {b.desde}–{b.hasta}
                            </span>
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                              {b.actividad}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-white truncate mt-0.5">
                            {placeName(b)}
                          </div>
                          {b.detalle && (
                            <p className="text-[10px] text-slate-400 truncate italic">
                              {b.detalle}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditBlock(b)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Editar actividad"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBlock(b.id)}
                            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 transition cursor-pointer"
                            title="Eliminar actividad"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECCIÓN CRONOGRAMA SEMANAL GENERAL (ACCESIBLE PARA TODAS LAS SUPERVISORAS) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <span>Cronograma Semanal General</span>
            </h3>
            <p className="text-xs text-slate-400">
              Visualizá los horarios y tiendas de todo el equipo durante la semana.
            </p>
          </div>

          {/* Selector de día / semana completa */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto no-scrollbar max-w-full">
            {DOWS.map((dayName, idx) => {
              const dayDate = addDays(currentWeek, idx);
              const isToday = dayDate === todayStr();
              const isSelected = selectedDayView === dayDate;

              return (
                <button
                  key={dayDate}
                  type="button"
                  onClick={() => setSelectedDayView(dayDate)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : isToday
                      ? 'text-amber-400 hover:bg-slate-800/80 border border-amber-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {dayName} {dd(dayDate)}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setSelectedDayView('semana')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer ${
                selectedDayView === 'semana'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Semana completa
            </button>
          </div>
        </div>

        {/* CONTENIDO DEL CRONOGRAMA */}
        {selectedDayView === 'semana' ? (
          /* TABLA DE SEMANA COMPLETA */
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60 shadow-inner no-scrollbar">
            <table className="w-full text-left text-xs border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="p-3 sticky left-0 bg-slate-900 z-10 w-44">Supervisora</th>
                  {DOWS.map((d, i) => {
                    const v = addDays(currentWeek, i);
                    const isToday = v === todayStr();
                    return (
                      <th
                        key={v}
                        className={`p-3 border-l border-slate-800/60 text-center ${
                          isToday ? 'text-amber-400 bg-amber-500/5' : ''
                        }`}
                      >
                        {d} {dd(v)}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {supervisoras.map((s) => {
                  const sPlan = planOf(s.id);
                  const blocks = sPlan.bloques || [];

                  return (
                    <tr key={s.id} className="hover:bg-slate-900/40 transition">
                      <td className="p-3 font-bold text-white sticky left-0 bg-slate-950/90 z-10 border-r border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <UserAvatar user={s} name={s.name} className="w-7 h-7 rounded-lg" />
                          <span className="truncate">{s.name}</span>
                        </div>
                      </td>

                      {DOWS.map((d, i) => {
                        const dayDate = addDays(currentWeek, i);
                        const dayBlocks = sortBlocks(blocks.filter((b) => b.dia === dayDate));

                        return (
                          <td
                            key={dayDate}
                            className={`p-2.5 border-l border-slate-800/60 align-top ${
                              dayDate === todayStr() ? 'bg-amber-500/5' : ''
                            }`}
                          >
                            {dayBlocks.length > 0 ? (
                              <div className="space-y-1.5">
                                {dayBlocks.map((b) => (
                                  <div
                                    key={b.id}
                                    className={`p-2 rounded-xl border text-[11px] leading-tight ${
                                      isBlockNow(b)
                                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                                        : 'bg-slate-900/80 border-slate-800 text-slate-300'
                                    }`}
                                  >
                                    <div className="font-extrabold text-amber-400 flex items-center justify-between">
                                      <span>
                                        {b.desde}–{b.hasta}
                                      </span>
                                      {isBlockNow(b) && (
                                        <span className="text-[9px] bg-emerald-500/30 text-emerald-300 px-1 py-0.2 rounded font-black">
                                          AHORA
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-bold text-white truncate mt-0.5">
                                      {placeName(b)}
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate">
                                      {b.actividad}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-600 block text-center py-2">–</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* COLUMNAS DEL DÍA SELECCIONADO */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {supervisoras.map((s) => {
              const sPlan = planOf(s.id);
              const dayBlocks = sortBlocks(
                (sPlan.bloques || []).filter((b) => b.dia === selectedDayView)
              );
              const totalMins = dayBlocks.reduce(
                (acc, b) => acc + Math.max(0, toMin(b.hasta) - toMin(b.desde)),
                0
              );

              return (
                <div
                  key={s.id}
                  className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar user={s} name={s.name} className="w-8 h-8 rounded-xl" />
                        <span className="font-extrabold text-sm text-white truncate">
                          {s.name}
                        </span>
                      </div>
                      {dayBlocks.length > 0 && (
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          {fmtHrs(totalMins)}
                        </span>
                      )}
                    </div>

                    {dayBlocks.length > 0 ? (
                      <div className="space-y-2">
                        {dayBlocks.map((b) => (
                          <div
                            key={b.id}
                            className={`p-3 rounded-xl border flex items-start gap-3 transition ${
                              isBlockNow(b)
                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                                : 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                            }`}
                          >
                            <div className="shrink-0 text-center font-mono-numbers">
                              <span className="block text-xs font-black text-amber-400">
                                {b.desde}
                              </span>
                              <span className="text-[10px] text-slate-500">a {b.hasta}</span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold text-white truncate">
                                  {placeName(b)}
                                </span>
                                {isBlockNow(b) && (
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300">
                                    Ahora
                                  </span>
                                )}
                              </div>
                              <span className="inline-block text-[10px] uppercase tracking-wider font-extrabold text-amber-300/80 mt-0.5">
                                {b.actividad}
                              </span>
                              {b.detalle && (
                                <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-2">
                                  {b.detalle}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-6">
                        Sin horario cargado para este día.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
