import React, { useState, useRef } from 'react';
import { ARS, INT, DEC, fmtDay, getCardNumberFontSize } from '../lib/formatters';
import { CustomDatePicker } from './CustomDatePicker';
import { CustomSupervisorSelect } from './CustomSupervisorSelect';
import { gsap, useGSAP } from '../lib/animations';
import { AnimatedNumber } from './AnimatedNumber';
import { 
  Calendar, 
  DollarSign, 
  Receipt, 
  ShoppingBag, 
  Target, 
  ArrowUpDown, 
  UserCheck, 
  TrendingUp, 
  Store,
  ChevronDown,
  Building2,
  Percent
} from 'lucide-react';

export function RangeReportDashboard({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  selectedSup,
  onSelectSup,
  supervisoras = [],
  tiendas = [],
  kpis = {},
  storesData = [],
  supervisorasData = [],
  daysData = [],
  isAllSupervisors = true,
  currentUser = null,
  isAdmin = false,
}) {
  const [sortField, setSortField] = useState('venta'); // 'venta' | 'comandas' | 'unidades' | 'ticketPromedio' | 'diasCargados'
  const [sortAsc, setSortAsc] = useState(false);
  const kpiGridRef = useRef(null);

  useGSAP(() => {
    if (kpiGridRef.current) {
      gsap.fromTo(
        kpiGridRef.current.children,
        { opacity: 0, y: 12, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.06, ease: 'power2.out', clearProps: 'transform' }
      );
    }
  }, [startDate, endDate, selectedSup]);

  // Ordenamiento de tiendas
  const sortedStores = [...storesData].sort((a, b) => {
    let valA = a[sortField] ?? 0;
    let valB = b[sortField] ?? 0;
    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector Toolbar: Rango de Fechas & Filtro de Supervisora */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Selector de Rango */}
          <div className="grid grid-cols-2 sm:flex sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="min-w-0">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1 truncate">
                <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Fecha Desde</span>
              </label>
              <div className="w-full sm:w-44">
                <CustomDatePicker
                  value={startDate}
                  maxDate={endDate}
                  onChange={onStartDateChange}
                  compact={true}
                  align="left"
                />
              </div>
            </div>

            <div className="hidden sm:flex items-center justify-center pt-5 text-slate-600 font-bold">
              →
            </div>

            <div className="min-w-0">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1 truncate">
                <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Fecha Hasta</span>
              </label>
              <div className="w-full sm:w-44">
                <CustomDatePicker
                  value={endDate}
                  minDate={startDate}
                  onChange={onEndDateChange}
                  compact={true}
                  align="right"
                />
              </div>
            </div>
          </div>

          {/* Selector de Supervisora (Si es Admin puede cambiar, si es Supervisora ve la suya) */}
          <div className="w-full lg:w-72">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Supervisión a evaluar</span>
            </label>
            {isAdmin ? (
              <CustomSupervisorSelect
                value={selectedSup}
                onChange={onSelectSup}
                supervisoras={supervisoras}
                tiendas={tiendas}
                allSupValue="__all"
                compact={true}
              />
            ) : (
              <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-bold text-xs sm:text-sm flex items-center justify-between">
                <span>{currentUser?.name || 'Supervisora'}</span>
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                  {storesData.length} tiendas
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid: Responsive mobile (Venta 1st row, Comandas & Empanadas 2nd row 2x2, Cumplimiento 3rd row) */}
      <div ref={kpiGridRef} className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 font-mono-numbers">
        {/* Venta Acumulada */}
        <div className="bg-slate-900/60 border border-slate-800 hover:border-amber-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden group shadow-xl transition-colors order-1 md:order-1 col-span-2 md:col-span-1">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">
              Venta del Período
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="min-h-[36px] flex items-center my-0.5">
            <div className={`${getCardNumberFontSize(kpis.venta, { isMoney: true })} font-black text-white tracking-tight whitespace-nowrap`}>
              <AnimatedNumber value={kpis.venta || 0} formatter={(v) => ARS.format(v)} />
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-1 font-sans">
            Ticket Promedio:{' '}
            {kpis.ticketPromedio ? (
              <span className="text-amber-300 font-bold font-mono-numbers">
                <AnimatedNumber value={kpis.ticketPromedio} formatter={(v) => ARS.format(v)} />
              </span>
            ) : (
              '–'
            )}
          </div>
        </div>

        {/* Comandas Totales */}
        <div className="bg-slate-900/60 border border-slate-800 hover:border-blue-500/30 rounded-2xl p-3.5 sm:p-5 relative overflow-hidden group shadow-xl transition-colors order-2 md:order-2 col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans truncate">
              Comandas Totales
            </span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="min-h-[36px] flex items-center my-0.5">
            <div className={`${getCardNumberFontSize(kpis.comandas)} font-black text-white tracking-tight whitespace-nowrap`}>
              <AnimatedNumber value={kpis.comandas || 0} formatter={(v) => INT.format(v)} />
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-1 font-sans truncate">
            <span className="text-blue-300 font-bold font-mono-numbers">
              <AnimatedNumber value={kpis.cargasRealizadas || 0} formatter={(v) => INT.format(v)} />
            </span>{' '}
            registros
          </div>
        </div>

        {/* Unidades Totales */}
        <div className="bg-slate-900/60 border border-slate-800 hover:border-purple-500/30 rounded-2xl p-3.5 sm:p-5 relative overflow-hidden group shadow-xl transition-colors order-3 md:order-3 col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans truncate">
              Empanadas (Unid.)
            </span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="min-h-[36px] flex items-center my-0.5">
            <div className={`${getCardNumberFontSize(kpis.unidades)} font-black text-white tracking-tight whitespace-nowrap`}>
              <AnimatedNumber value={kpis.unidades || 0} formatter={(v) => INT.format(v)} />
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-1 font-sans truncate">
            {kpis.unidPorComanda ? (
              <>
                <span className="text-purple-300 font-bold font-mono-numbers">
                  <AnimatedNumber value={kpis.unidPorComanda} decimals={1} formatter={(v) => DEC.format(v)} />
                </span>{' '}
                /cmda
              </>
            ) : (
              '–'
            )}
          </div>
        </div>

        {/* Cumplimiento de Carga en el Rango */}
        <div className="bg-slate-900/60 border border-slate-800 hover:border-emerald-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden group shadow-xl transition-colors order-4 md:order-4 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">
              Cumplimiento
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-400 tracking-tight">
            <AnimatedNumber value={kpis.cumplimientoPorcentaje || 0} />%
          </div>
          <div className="text-xs text-slate-500 mt-1 font-sans">
            <span className="text-emerald-300 font-bold font-mono-numbers">
              <AnimatedNumber value={kpis.cargasRealizadas || 0} formatter={(v) => INT.format(v)} />
            </span>
            /
            <span className="font-mono-numbers">
              {kpis.cargasEsperadas || 0}
            </span>{' '}
            esperadas ({kpis.totalDias || 0} días)
          </div>
        </div>
      </div>

      {/* Si se ven todas las supervisoras: Comparativa / Ranking de Supervisoras en el rango */}
      {isAllSupervisors && supervisorasData.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>👥 Rendimiento por Supervisora en el Período</span>
              </h3>
              <p className="text-xs text-slate-400">
                Comparativa consolidada de todas las tiendas asignadas a cada supervisora
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-mono-numbers">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 font-sans">Supervisora</th>
                  <th className="py-3 px-4 text-center">Tiendas</th>
                  <th className="py-3 px-4 text-center">Cumplimiento</th>
                  <th className="py-3 px-4 text-right">Comandas</th>
                  <th className="py-3 px-4 text-right">Venta Total</th>
                  <th className="py-3 px-4 text-right">Unidades</th>
                  <th className="py-3 px-4 text-right">Ticket Prom.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {supervisorasData.map((sup, idx) => (
                  <tr key={sup.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 text-center font-bold">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-sans font-bold text-white">
                      {sup.name}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-400 font-sans">
                      {sup.tiendasCount} tiendas
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        sup.cumplimientoPorcentaje >= 95
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : sup.cumplimientoPorcentaje >= 75
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                      }`}>
                        {sup.cumplimientoPorcentaje}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-300">
                      {INT.format(sup.comandas)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-amber-400">
                      {ARS.format(sup.venta)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-300">
                      {INT.format(sup.unidades)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-400 font-semibold">
                      {sup.ticketPromedio ? ARS.format(sup.ticketPromedio) : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabla Detallada por Tienda (con columnas ordenables) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-400" />
              <span>Desempeño y Cumplimiento por Tienda</span>
            </h3>
            <p className="text-xs text-slate-400">
              Totales acumulados del rango seleccionado ({startDate} al {endDate}). Tocá cualquier columna para ordenar.
            </p>
          </div>
          <div className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-mono">
            {sortedStores.length} tiendas analizadas
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono-numbers">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 font-sans cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    <span>Tienda</span>
                    {sortField === 'name' && <ArrowUpDown className="w-3 h-3 text-amber-400" />}
                  </div>
                </th>
                <th className="py-3 px-4 text-center cursor-pointer hover:text-white" onClick={() => handleSort('diasCargados')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Días Cargados</span>
                    {sortField === 'diasCargados' && <ArrowUpDown className="w-3 h-3 text-amber-400" />}
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('comandas')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Comandas</span>
                    {sortField === 'comandas' && <ArrowUpDown className="w-3 h-3 text-amber-400" />}
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('venta')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Venta Total</span>
                    {sortField === 'venta' && <ArrowUpDown className="w-3 h-3 text-amber-400" />}
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('unidades')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Unidades</span>
                    {sortField === 'unidades' && <ArrowUpDown className="w-3 h-3 text-amber-400" />}
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('ticketPromedio')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Ticket Prom.</span>
                    {sortField === 'ticketPromedio' && <ArrowUpDown className="w-3 h-3 text-amber-400" />}
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Unid./Comanda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {sortedStores.map((store, idx) => (
                <tr key={store.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 text-center font-bold">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        idx === 0
                          ? 'bg-amber-500 text-slate-950'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-900'
                          : idx === 2
                          ? 'bg-amber-800 text-amber-200'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-sans font-bold text-white flex items-center gap-2">
                      <span>{store.name}</span>
                      {store.isPropia && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Propia
                        </span>
                      )}
                      {store.isExperience && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Experience
                        </span>
                      )}
                    </div>
                    {store.supervisoraNombre && (
                      <div className="text-xs text-slate-400 font-sans mt-0.5">
                        {store.supervisoraNombre}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        store.diasCargados === store.diasEsperados && store.diasEsperados > 0
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : store.diasCargados === 0
                          ? 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                          : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                      }`}
                    >
                      {store.diasCargados}/{store.diasEsperados}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-300">{INT.format(store.comandas)}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-amber-400">{ARS.format(store.venta)}</td>
                  <td className="py-3.5 px-4 text-right text-slate-300">{INT.format(store.unidades)}</td>
                  <td className="py-3.5 px-4 text-right text-emerald-400 font-semibold">
                    {store.ticketPromedio ? ARS.format(store.ticketPromedio) : '–'}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-300">
                    {store.unidPorComanda ? DEC.format(store.unidPorComanda) : '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalle Día por Día dentro del Rango */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800/80">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Evolución Diaria en el Período</span>
          </h3>
          <p className="text-xs text-slate-400">Comportamiento día por día dentro de las fechas seleccionadas</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono-numbers">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-sans">Fecha</th>
                <th className="py-3 px-4 text-center">Tiendas Cargadas</th>
                <th className="py-3 px-4 text-right">Comandas</th>
                <th className="py-3 px-4 text-right">Venta Diaria</th>
                <th className="py-3 px-4 text-right">Unidades</th>
                <th className="py-3 px-4 text-right">Ticket Promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {daysData.map((day) => {
                const dayTicket = day.comandas > 0 ? day.venta / day.comandas : null;
                return (
                  <tr key={day.fecha} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-sans font-semibold text-white">
                      {fmtDay(day.fecha)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          day.tiendasCargadas === day.totalTiendas
                            ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40'
                            : 'text-amber-400 bg-amber-950/40 border border-amber-800/40'
                        }`}
                      >
                        {day.tiendasCargadas}/{day.totalTiendas}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-300">{INT.format(day.comandas)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-amber-400">{ARS.format(day.venta)}</td>
                    <td className="py-3.5 px-4 text-right text-slate-300">{INT.format(day.unidades)}</td>
                    <td className="py-3.5 px-4 text-right text-emerald-400 font-semibold">
                      {dayTicket ? ARS.format(dayTicket) : '–'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
