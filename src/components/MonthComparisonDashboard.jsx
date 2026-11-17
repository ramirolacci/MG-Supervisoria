import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ARS, INT, DEC, fmtDay, pad, parseYmd, exportCsv, getCardNumberFontSize } from '../lib/formatters';
import { CustomMonthPicker } from './CustomMonthPicker';
import { CustomSupervisorSelect } from './CustomSupervisorSelect';
import { api } from '../lib/api';
import { gsap, useGSAP } from '../lib/animations';
import { AnimatedNumber } from './AnimatedNumber';
import {
  Calendar,
  DollarSign,
  Receipt,
  ShoppingBag,
  Target,
  FileSpreadsheet,
  Building2,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRightLeft,
  Info,
  CalendarDays
} from 'lucide-react';

const DOW = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const prevMonthKey = (m) => {
  if (!m) return '';
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(y, mo - 2, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

export const monthDays = (m) => {
  if (!m) return [];
  const [y, mo] = m.split('-').map(Number);
  const last = new Date(y, mo, 0).getDate();
  const out = [];
  for (let d = 1; d <= last; d++) {
    out.push(`${m}-${pad(d)}`);
  }
  return out;
};

export const firstMonday = (m) => {
  const d = parseYmd(m + '-01');
  d.setDate(1 + (8 - d.getDay()) % 7);
  return d;
};

// Retorna semana (0 = días antes del 1er lunes, 1 = semana del 1er lunes...) y día de la semana (0 = lunes)
export function slotOf(s) {
  const d = parseYmd(s);
  const fm = firstMonday(s.slice(0, 7));
  const diff = Math.round((d - fm) / 864e5);
  return {
    wk: diff >= 0 ? Math.floor(diff / 7) + 1 : 0,
    wd: (d.getDay() + 6) % 7,
  };
}

const wkLbl = (wk) => (wk === 0 ? 'Antes del 1.er lunes' : `Semana ${wk}`);

const rangeTxt = (list) => {
  const l = list.filter(Boolean);
  if (!l.length) return '–';
  const f = (s) => `${pad(parseYmd(s).getDate())}/${pad(parseYmd(s).getMonth() + 1)}`;
  return l.length === 1 ? f(l[0]) : `${f(l[0])} al ${f(l[l.length - 1])}`;
};

const pctV = (a, b) => {
  if (a == null || b == null || !b) return null;
  return ((a - b) / b) * 100;
};

// Formateador estándar argentino para porcentajes (coma decimal: ej. -5,5% o +12,3%)
const fmtPct = (p) => {
  if (p == null) return '–';
  return DEC.format(Math.abs(p));
};

const MET_L = {
  v: 'Venta',
  c: 'Comandas',
  u: 'Unidades',
  t: 'Ticket promedio',
};

const mFmt = (k, v) => {
  if (v == null) return '–';
  return k === 'v' || k === 't' ? ARS.format(v) : INT.format(Math.round(v));
};

const mOf = (a, k) => {
  if (!a) return 0;
  return k === 't' ? a.t || 0 : a[k] || 0;
};

function agg(rows = []) {
  const a = rows.reduce(
    (x, r) => {
      x.c += Number(r.comandas) || 0;
      x.v += Number(r.venta) || 0;
      x.u += Number(r.unidades) || 0;
      return x;
    },
    { c: 0, v: 0, u: 0 }
  );
  a.n = rows.length;
  a.dias = new Set(rows.map((r) => r.fecha)).size;
  a.t = a.c > 0 ? a.v / a.c : null;
  a.upc = a.c > 0 ? a.u / a.c : null;
  return a;
}

export function MonthComparisonDashboard({
  month,
  onMonthChange,
  tiendas = [],
  supervisoras = [],
  selectedSup = '__all',
  onSelectSup,
  currentUser = null,
  isAdmin = false,
  showToast = () => {},
}) {
  const [selectedTiendaId, setSelectedTiendaId] = useState('');
  const [metric, setMetric] = useState('v'); // 'v' | 'c' | 'u' | 't'
  const [curRows, setCurRows] = useState([]);
  const [prevRows, setPrevRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const prevMonth = useMemo(() => prevMonthKey(month), [month]);

  // Carga asíncrona de datos para el mes actual y mes anterior
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!month) return;
      setIsLoading(true);
      try {
        const pm = prevMonthKey(month);
        const [cData, pData] = await Promise.all([
          api.getCargasMes(month),
          api.getCargasMes(pm),
        ]);
        if (isMounted) {
          setCurRows(cData || []);
          setPrevRows(pData || []);
        }
      } catch (err) {
        console.error('Error loading month comparison data:', err);
        if (isMounted) {
          showToast('Error al cargar datos comparativos de meses', 'error');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [month]);

  // Tiendas asignadas / visibles según supervisora activa
  const visibleTiendas = useMemo(() => {
    if (!selectedSup || selectedSup === '__all') return tiendas;
    return tiendas.filter((t) => t.sup === selectedSup);
  }, [tiendas, selectedSup]);

  // Si la tienda seleccionada no está dentro de visibleTiendas, se limpia
  useEffect(() => {
    if (selectedTiendaId && !visibleTiendas.some((t) => t.id === selectedTiendaId)) {
      setSelectedTiendaId('');
    }
  }, [visibleTiendas, selectedTiendaId]);

  // Tienda ID Map para resolver nombres
  const tiendaNameMap = useMemo(() => {
    const map = {};
    tiendas.forEach((t) => {
      map[t.id] = t.name;
    });
    return map;
  }, [tiendas]);

  // Filtrado de filas según alcance de supervisora y tienda
  const filterRowsByScope = (rows) => {
    if (selectedTiendaId) {
      return rows.filter((r) => r.tiendaId === selectedTiendaId);
    }
    if (!selectedSup || selectedSup === '__all') {
      return rows;
    }
    const storeIds = new Set(visibleTiendas.map((t) => t.id));
    return rows.filter((r) => storeIds.has(r.tiendaId));
  };

  // Hoy y Ayer en formato YYYY-MM-DD para marcar días cerrados
  const todayYmd = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }, []);

  // Modelo comparativo unificado
  const model = useMemo(() => {
    const cur = filterRowsByScope(curRows);
    const prev = filterRowsByScope(prevRows);

    const pBySlot = new Map();
    monthDays(prevMonth).forEach((s) => {
      const o = slotOf(s);
      pBySlot.set(`${o.wk}|${o.wd}`, s);
    });

    const days = monthDays(month).map((s) => {
      const o = slotOf(s);
      const ps = pBySlot.get(`${o.wk}|${o.wd}`) || null;
      const closed = s <= todayYmd;
      const a = closed ? agg(cur.filter((r) => r.fecha === s)) : null;
      const b = ps ? agg(prev.filter((r) => r.fecha === ps)) : null;
      return {
        s,
        ps,
        wk: o.wk,
        wd: o.wd,
        closed,
        a,
        b,
        comp: closed && Boolean(ps),
      };
    });

    const uniqueWeeks = [...new Set(days.map((d) => d.wk))].sort((x, y) => x - y);
    const weeks = uniqueWeeks.map((wk) => {
      const ds = days.filter((d) => d.wk === wk);
      const dc = ds.filter((d) => d.comp);
      const pAll = ds.filter((d) => d.ps).map((d) => d.ps);
      return {
        wk,
        ds,
        a: agg(cur.filter((r) => dc.some((d) => d.s === r.fecha))),
        b: agg(prev.filter((r) => dc.some((d) => d.ps === r.fecha))),
        bFull: agg(prev.filter((r) => pAll.includes(r.fecha))),
        nComp: dc.length,
        nDays: ds.length,
        closedAll: ds.every((d) => d.closed),
      };
    });

    const compDays = days.filter((d) => d.comp);
    const A = agg(cur.filter((r) => compDays.some((d) => d.s === r.fecha)));
    const B = agg(prev.filter((r) => compDays.some((d) => d.ps === r.fecha)));

    // Tiendas breakdown
    const allStoreIds = [...new Set([...cur.map((r) => r.tiendaId), ...prev.map((r) => r.tiendaId)])];
    const storeBreakdown = allStoreIds
      .map((id) => {
        const a = agg(cur.filter((r) => r.tiendaId === id && compDays.some((d) => d.s === r.fecha)));
        const b = agg(prev.filter((r) => r.tiendaId === id && compDays.some((d) => d.ps === r.fecha)));
        const valA = mOf(a, metric);
        const valB = mOf(b, metric);
        const diff = valA - valB;
        const p = pctV(valA, valB);
        return {
          id,
          name: tiendaNameMap[id] || id,
          a: valA,
          b: valB,
          diff,
          p,
        };
      })
      .sort((x, y) => (y.p ?? -1e9) - (x.p ?? -1e9));

    return {
      cur,
      prev,
      days,
      weeks,
      compDays,
      A,
      B,
      Ptot: agg(prev),
      Ctot: agg(cur.filter((r) => r.fecha <= todayYmd)),
      storeBreakdown,
    };
  }, [curRows, prevRows, month, prevMonth, selectedTiendaId, selectedSup, visibleTiendas, metric, todayYmd, tiendaNameMap]);

  // Nombres de mes formateados
  const curMonthName = useMemo(() => {
    if (!month) return '';
    const d = parseYmd(month + '-01');
    const name = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    return name.charAt(0).toUpperCase() + name.slice(1);
  }, [month]);

  const prevMonthName = useMemo(() => {
    if (!prevMonth) return '';
    const d = parseYmd(prevMonth + '-01');
    const name = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    return name.charAt(0).toUpperCase() + name.slice(1);
  }, [prevMonth]);

  // Exportar Excel / CSV
  const handleExportCsv = () => {
    const lines = [
      'Semana;Día mes actual;Día mes anterior;Venta actual;Venta anterior;Var % venta;Comandas actual;Comandas anterior;Unidades actual;Unidades anterior',
    ];

    model.days.forEach((d) => {
      const a = d.closed && d.a ? d.a : null;
      const b = d.b;
      const varV = d.comp && b && b.v ? ((a.v - b.v) / b.v * 100).toFixed(1) : '';
      const [y, m, day] = d.s.split('-');
      const fmtCurDate = `${day}/${m}/${y}`;
      let fmtPrevDate = '';
      if (d.ps) {
        const [py, pm, pd] = d.ps.split('-');
        fmtPrevDate = `${pd}/${pm}/${py}`;
      }

      lines.push(
        [
          `"${wkLbl(d.wk)}"`,
          fmtCurDate,
          fmtPrevDate,
          a ? a.v.toFixed(2) : '',
          b ? b.v.toFixed(2) : '',
          varV,
          a ? a.c : '',
          b ? b.c : '',
          a ? a.u : '',
          b ? b.u : '',
        ].join(';')
      );
    });

    const supLabel = selectedSup === '__all' ? 'Todas' : (supervisoras.find((s) => s.id === selectedSup)?.name || selectedSup).replace(/[^\wÁÉÍÓÚáéíóúÑñ\-]+/g, '_');
    exportCsv(`Comparativo_${supLabel}_${month}_vs_${prevMonth}.csv`, lines);
    showToast('Reporte comparativo descargado', 'success');
  };

  const kpisContainerRef = useRef(null);

  useGSAP(() => {
    if (kpisContainerRef.current) {
      gsap.fromTo(
        kpisContainerRef.current.children,
        { opacity: 0, y: 15, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.06, ease: 'power2.out', clearProps: 'transform' }
      );
    }
  }, [month, selectedTiendaId, selectedSup]);

  // Datos para los gráficos comparativos
  const compWeeksList = useMemo(() => model.weeks.filter((w) => w.nComp > 0), [model.weeks]);
  const maxWkVal = useMemo(() => {
    const allVals = compWeeksList.flatMap((w) => [mOf(w.a, metric), mOf(w.b, metric)]);
    return Math.max(...allVals, 1);
  }, [compWeeksList, metric]);

  const compDaysList = useMemo(() => model.days.filter((d) => d.ps), [model.days]);
  const maxDayVal = useMemo(() => {
    const allVals = compDaysList.flatMap((d) => {
      const aVal = d.closed && d.a && d.a.n ? mOf(d.a, metric) : 0;
      const bVal = d.b && d.b.n ? mOf(d.b, metric) : 0;
      return [aVal, bVal];
    });
    return Math.max(...allVals, 1);
  }, [compDaysList, metric]);

  const fmLunes = useMemo(() => (month ? firstMonday(month) : null), [month]);
  const pfmLunes = useMemo(() => (prevMonth ? firstMonday(prevMonth) : null), [prevMonth]);

  return (
    <div className="space-y-6 mt-12 pt-8 border-t border-slate-800">
      {/* Encabezado y Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-amber-500" />
            <span>Comparativo Mes vs Anterior</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Mismos días equivalentes de cada semana partiendo del primer lunes del mes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Selector de Mes */}
          <CustomMonthPicker value={month} onChange={onMonthChange} />

          {/* Exportar CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isLoading || model.compDays.length === 0}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-lg shadow-emerald-600/25 active:scale-95 cursor-pointer whitespace-nowrap"
            title="Descargar detalle comparativo en formato CSV/Excel"
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            <span>Descargar CSV</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros Contextuales (Tienda + Métrica) */}
      <div className="p-3.5 sm:p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-inner flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Filtro Supervisora (si admin o Elizabeth) */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400">Supervisora:</span>
            <CustomSupervisorSelect
              value={selectedSup}
              onChange={onSelectSup}
              supervisoras={supervisoras}
              includeAllOption={true}
              allOptionLabel="Todas las supervisoras"
              className="w-full sm:w-56"
            />
          </div>

          {/* Filtro Tienda */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400">Tienda:</span>
            <select
              value={selectedTiendaId}
              onChange={(e) => setSelectedTiendaId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer w-full sm:w-auto"
            >
              <option value="">
                {selectedSup === '__all' ? 'Todas las tiendas' : 'Todas las tiendas asignadas'}
              </option>
              {visibleTiendas
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name, 'es'))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Filtro Selector de Métrica */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 w-full sm:w-auto justify-center">
          {[
            { id: 'v', label: 'Venta', icon: DollarSign },
            { id: 'c', label: 'Comandas', icon: Receipt },
            { id: 'u', label: 'Unidades', icon: ShoppingBag },
            { id: 't', label: 'Ticket prom.', icon: Target },
          ].map((m) => {
            const Icon = m.icon;
            const active = metric === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMetric(m.id)}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer ${
                  active
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Nota descriptiva de la regla de cálculo */}
      <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl flex items-start gap-2.5 text-xs text-slate-400">
        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p>
            <strong className="text-slate-200">Criterio semanal:</strong> Cada día del mes se compara con el mismo día de la misma semana del mes anterior partiendo del <b>primer lunes</b> de cada mes.
            {fmLunes && pfmLunes && (
              <span className="text-amber-400/90 ml-1">
                (1.er lunes actual: {pad(fmLunes.getDate())}/{pad(fmLunes.getMonth() + 1)} · 1.er lunes anterior: {pad(pfmLunes.getDate())}/{pad(pfmLunes.getMonth() + 1)}).
              </span>
            )}
            {' '}<span className="text-slate-300 font-semibold">{model.compDays.length} días comparables a la fecha.</span>
            {model.prev.length === 0 && !isLoading && (
              <span className="text-amber-400 font-bold ml-1">· El mes anterior no tiene registros de carga.</span>
            )}
          </p>
        </div>
      </div>

      {/* Resumen Superior de KPIs */}
      <div ref={kpisContainerRef} className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 font-mono-numbers">
        {[
          { key: 'v', label: 'Venta a la fecha', isMoney: true, icon: DollarSign },
          { key: 'c', label: 'Comandas a la fecha', isMoney: false, icon: Receipt },
          { key: 'u', label: 'Unidades a la fecha', isMoney: false, icon: ShoppingBag },
          { key: 't', label: 'Ticket Promedio', isMoney: true, icon: Target },
        ].map((kpi) => {
          const Icon = kpi.icon;
          const a = mOf(model.A, kpi.key);
          const b = mOf(model.B, kpi.key);
          const full = mOf(model.Ptot, kpi.key);
          const p = pctV(a, b);
          const isPositive = (p ?? 0) >= 0;

          return (
            <div
              key={kpi.key}
              className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 sm:p-5 relative overflow-hidden flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                  <span>{kpi.label}</span>
                  <Icon className="w-4 h-4 text-amber-500/80" />
                </div>
                <div
                  className={`font-black tracking-tight text-white mb-1.5 ${getCardNumberFontSize(a, {
                    isMoney: kpi.isMoney,
                  })}`}
                >
                  <AnimatedNumber
                    value={a}
                    formatter={(v) => (kpi.isMoney ? ARS.format(v) : INT.format(v))}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px] sm:text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Mismos días ant.:</span>
                  <span className="font-bold text-slate-300">
                    {mFmt(kpi.key, b)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Variación:</span>
                  {p != null ? (
                    <span
                      className={`font-bold flex items-center gap-0.5 ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {isPositive ? '+' : '-'}{fmtPct(p)}%
                    </span>
                  ) : (
                    <span className="text-slate-500">–</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[10px]">
                  <span>{prevMonthName.split(' ')[0]} completo:</span>
                  <span>{mFmt(kpi.key, full)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gráficos Visuales de Comparación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfico 1: Por Semana (Barras) */}
        <div className="p-4 sm:p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>{MET_L[metric]} por semana</span>
              </h3>
              <p className="text-[11px] text-slate-400">Mes actual vs mismo período del mes anterior</p>
            </div>
            {/* Leyenda */}
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
                <span>{curMonthName.split(' ')[0]}</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-600"></span>
                <span>{prevMonthName.split(' ')[0]}</span>
              </span>
            </div>
          </div>

          {compWeeksList.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-slate-500">
              Sin semanas cerradas para comparar
            </div>
          ) : (
            <div className="h-48 flex items-end gap-3 sm:gap-6 pt-4 px-2 border-b border-slate-800">
              {compWeeksList.map((w) => {
                const aVal = mOf(w.a, metric);
                const bVal = mOf(w.b, metric);
                const aH = Math.max(Math.round((aVal / maxWkVal) * 100), 4);
                const bH = Math.max(Math.round((bVal / maxWkVal) * 100), 4);
                const p = pctV(aVal, bVal);

                return (
                  <div key={w.wk} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-white transition">
                      {p != null ? `${p >= 0 ? '+' : ''}${p.toFixed(0)}%` : ''}
                    </span>
                    <div className="w-full flex items-end justify-center gap-1.5 sm:gap-2 h-32">
                      {/* Barra Anterior */}
                      <div
                        style={{ height: `${bH}%` }}
                        className="w-1/2 max-w-[28px] bg-slate-600/80 hover:bg-slate-500 rounded-t transition-all relative group/bar"
                        title={`${prevMonthName}: ${mFmt(metric, bVal)}`}
                      />
                      {/* Barra Actual */}
                      <div
                        style={{ height: `${aH}%` }}
                        className="w-1/2 max-w-[28px] bg-amber-500 hover:bg-amber-400 rounded-t shadow-lg shadow-amber-500/20 transition-all relative group/bar"
                        title={`${curMonthName}: ${mFmt(metric, aVal)}`}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-300 mt-1 truncate">
                      {wkLbl(w.wk)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gráfico 2: Evolución Día por Día */}
        <div className="p-4 sm:p-5 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-amber-500" />
                  <span>{MET_L[metric]} día por día</span>
                </h3>
                <p className="text-[11px] text-slate-400">Comparativa con el día equivalente</p>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>{curMonthName.split(' ')[0]}</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                  <span>{prevMonthName.split(' ')[0]}</span>
                </span>
              </div>
            </div>

            {/* Visualizador de barras compactas día a día */}
            <div className="h-44 flex items-end gap-1 sm:gap-1.5 pt-4 border-b border-slate-800 overflow-x-auto px-1">
              {compDaysList.map((d) => {
                const aVal = d.closed && d.a && d.a.n ? mOf(d.a, metric) : 0;
                const bVal = d.b && d.b.n ? mOf(d.b, metric) : 0;
                const aH = aVal > 0 ? Math.max(Math.round((aVal / maxDayVal) * 100), 6) : 0;
                const bH = bVal > 0 ? Math.max(Math.round((bVal / maxDayVal) * 100), 6) : 0;
                const dayNum = d.s.split('-')[2];

                return (
                  <div
                    key={d.s}
                    className="flex-1 min-w-[12px] flex flex-col items-center gap-1 h-full justify-end group cursor-default"
                    title={`${fmtDay(d.s)}: ${mFmt(metric, aVal)} vs ${fmtDay(d.ps)}: ${mFmt(metric, bVal)}`}
                  >
                    <div className="w-full flex items-end justify-center gap-0.5 h-32">
                      <div
                        style={{ height: `${bH}%` }}
                        className="w-1/2 bg-slate-600/70 group-hover:bg-slate-500 rounded-t transition-all"
                      />
                      <div
                        style={{ height: `${aH}%` }}
                        className={`w-1/2 rounded-t transition-all ${
                          d.closed ? 'bg-amber-500 group-hover:bg-amber-400' : 'bg-slate-800'
                        }`}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 group-hover:text-amber-400">
                      {dayNum}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-[10px] text-slate-500 text-right mt-2">
            Pasa el mouse sobre cada día para ver los valores comparados
          </p>
        </div>
      </div>

      {/* Tabla 1: Semana contra Semana */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="p-4 border-b border-slate-800 bg-slate-900/80">
          <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
            <span>📅 Desglose Semana contra Semana</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Suma de los días comparables de cada bloque semanal
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm font-mono-numbers">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/40">
                <th className="py-3 px-4 font-bold">Semana</th>
                <th className="py-3 px-3 font-bold text-slate-300">{curMonthName.split(' ')[0]}</th>
                <th className="py-3 px-3 font-bold text-slate-400">{prevMonthName.split(' ')[0]}</th>
                <th className="py-3 px-3 font-bold text-right text-amber-400">Actual</th>
                <th className="py-3 px-3 font-bold text-right text-slate-400">Anterior</th>
                <th className="py-3 px-3 font-bold text-right">Diferencia</th>
                <th className="py-3 px-4 font-bold text-right">Var. %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {model.weeks.map((w) => {
                const aVal = mOf(w.a, metric);
                const bVal = mOf(w.b, metric);
                const cmp = w.nComp > 0;
                const diff = cmp ? aVal - bVal : null;
                const p = cmp ? pctV(aVal, bVal) : null;
                const isPos = (diff ?? 0) >= 0;

                return (
                  <tr
                    key={w.wk}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      !cmp ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{wkLbl(w.wk)}</div>
                      <div className="text-[11px] text-slate-500 font-sans">
                        {w.nComp < w.nDays && w.nComp > 0
                          ? `${w.nComp} de ${w.nDays} días comparables`
                          : !cmp
                          ? 'Sin días equivalentes aún'
                          : `${w.nDays} días`}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{rangeTxt(w.ds.map((d) => d.s))}</td>
                    <td className="py-3 px-3 text-slate-500">{rangeTxt(w.ds.map((d) => d.ps))}</td>
                    <td className="py-3 px-3 text-right font-bold text-white">
                      {cmp ? mFmt(metric, aVal) : '–'}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      {cmp ? mFmt(metric, bVal) : w.ds.some((d) => d.ps) ? mFmt(metric, mOf(w.bFull, metric)) : '–'}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold">
                      {diff != null ? (
                        <span className={isPos ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPos ? '+' : ''}{mFmt(metric, diff)}
                        </span>
                      ) : (
                        '–'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-black">
                      {p != null ? (
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs ${
                            isPos
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isPos ? '▲ +' : '▼ -'}{fmtPct(p)}%
                        </span>
                      ) : (
                        '–'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-950/80 border-t-2 border-slate-700 font-bold text-slate-200">
              <tr>
                <td className="py-3 px-4 font-black text-white" colSpan={3}>
                  Total comparable a la fecha
                </td>
                <td className="py-3 px-3 text-right text-amber-400 font-black">
                  {mFmt(metric, mOf(model.A, metric))}
                </td>
                <td className="py-3 px-3 text-right text-slate-300">
                  {mFmt(metric, mOf(model.B, metric))}
                </td>
                <td className="py-3 px-3 text-right">
                  {(() => {
                    const diffTot = mOf(model.A, metric) - mOf(model.B, metric);
                    const isPos = diffTot >= 0;
                    return (
                      <span className={isPos ? 'text-emerald-400' : 'text-rose-400'}>
                        {isPos ? '+' : ''}{mFmt(metric, diffTot)}
                      </span>
                    );
                  })()}
                </td>
                <td className="py-3 px-4 text-right">
                  {(() => {
                    const pTot = pctV(mOf(model.A, metric), mOf(model.B, metric));
                    if (pTot == null) return '–';
                    const isPos = pTot >= 0;
                    return (
                      <span
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-black ${
                          isPos
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {isPos ? '▲ +' : '▼ -'}{fmtPct(pTot)}%
                      </span>
                    );
                  })()}
                </td>
              </tr>
              <tr className="text-slate-400 text-xs border-t border-slate-800">
                <td className="py-2.5 px-4 font-medium" colSpan={4}>
                  {prevMonthName} completo
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-slate-300">
                  {mFmt(metric, mOf(model.Ptot, metric))}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Tabla 2: Día contra Día */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="p-4 border-b border-slate-800 bg-slate-900/80">
          <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
            <span>🗓️ Desglose Día contra Día</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cada día comparado contra el mismo día de la misma semana del mes anterior
          </p>
        </div>

        <div className="overflow-x-auto max-h-[460px]">
          <table className="w-full text-left border-collapse text-xs sm:text-sm font-mono-numbers">
            <thead className="sticky top-0 bg-slate-950 z-10">
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4 font-bold">Día ({curMonthName.split(' ')[0]})</th>
                <th className="py-3 px-3 font-bold text-slate-400">Se compara con</th>
                <th className="py-3 px-3 font-bold text-right text-amber-400">Actual</th>
                <th className="py-3 px-3 font-bold text-right text-slate-400">Anterior</th>
                <th className="py-3 px-3 font-bold text-right">Diferencia</th>
                <th className="py-3 px-4 font-bold text-right">Var. %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {model.days.map((d) => {
                const aVal = d.a && d.a.n ? mOf(d.a, metric) : null;
                const bVal = d.b && d.b.n ? mOf(d.b, metric) : null;
                const diff = d.comp && aVal != null && bVal != null ? aVal - bVal : null;
                const p = d.comp ? pctV(aVal, bVal) : null;
                const isPos = (diff ?? 0) >= 0;

                return (
                  <tr
                    key={d.s}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      !d.closed ? 'opacity-40 bg-slate-950/20' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4 font-bold text-white">
                      {fmtDay(d.s)}
                      {d.closed && d.a && !d.a.n && (
                        <span className="ml-2 text-[10px] text-amber-500 font-normal">sin cargas</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {d.ps ? (
                        <>
                          {fmtDay(d.ps)}
                          {d.b && !d.b.n && (
                            <span className="ml-2 text-[10px] text-slate-500 font-normal">sin cargas</span>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-500 italic">sin {DOW[d.wd].toLowerCase()} equiv.</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-white">
                      {d.closed && aVal != null ? mFmt(metric, aVal) : '–'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {bVal != null ? mFmt(metric, bVal) : '–'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium">
                      {diff != null ? (
                        <span className={isPos ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPos ? '+' : ''}{mFmt(metric, diff)}
                        </span>
                      ) : (
                        '–'
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-black">
                      {p != null ? (
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs ${
                            isPos
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {isPos ? '▲ +' : '▼ -'}{fmtPct(p)}%
                        </span>
                      ) : (
                        '–'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla 3: Por Tienda */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="p-4 border-b border-slate-800 bg-slate-900/80">
          <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-500" />
            <span>Por Tienda · Mismos días comparables</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Ranking comparativo ordenado por porcentaje de crecimiento en {MET_L[metric].toLowerCase()}
          </p>
        </div>

        <div className="overflow-x-auto max-h-[460px]">
          <table className="w-full text-left border-collapse text-xs sm:text-sm font-mono-numbers">
            <thead className="sticky top-0 bg-slate-950 z-10">
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4 font-bold">Tienda</th>
                <th className="py-3 px-3 font-bold text-right text-amber-400">Actual</th>
                <th className="py-3 px-3 font-bold text-right text-slate-400">Anterior</th>
                <th className="py-3 px-3 font-bold text-right">Diferencia</th>
                <th className="py-3 px-4 font-bold text-right">Var. %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {model.storeBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    Todavía no hay cargas para comparar en las tiendas seleccionadas.
                  </td>
                </tr>
              ) : (
                model.storeBreakdown.map((s) => {
                  const isPos = s.diff >= 0;
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-white">{s.name}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-white">
                        {mFmt(metric, s.a)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400">
                        {mFmt(metric, s.b)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        <span className={isPos ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPos ? '+' : ''}{mFmt(metric, s.diff)}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-black">
                        {s.p != null ? (
                          <span
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs ${
                              isPos
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {isPos ? '▲ +' : '▼ -'}{fmtPct(s.p)}%
                          </span>
                        ) : (
                          '–'
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
