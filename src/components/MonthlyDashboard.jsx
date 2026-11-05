import React, { useRef } from 'react';
import { ARS, INT, DEC, fmtDay, getCardNumberFontSize } from '../lib/formatters';
import { CustomMonthPicker } from './CustomMonthPicker';
import { Calendar, DollarSign, Receipt, ShoppingBag, Target, FileText } from 'lucide-react';
import { gsap, useGSAP } from '../lib/animations';
import { AnimatedNumber } from './AnimatedNumber';

export function MonthlyDashboard({
  month,
  onMonthChange,
  kpis,
  storesMonthly,
  supervisorasMonthly,
  daysMonthly,
  isAllSupervisors,
  onExportMonthPdf,
  onExportMonthCsv,
}) {
  const kpiGridRef = useRef(null);
  const storesTableRef = useRef(null);

  useGSAP(() => {
    if (kpiGridRef.current) {
      gsap.fromTo(
        kpiGridRef.current.children,
        { opacity: 0, y: 12, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.06, ease: 'power2.out', clearProps: 'transform' }
      );
    }
    if (storesTableRef.current && storesTableRef.current.children.length > 0) {
      gsap.fromTo(
        storesTableRef.current.children,
        { opacity: 0, x: -8 },
        { opacity: 1, x: 0, duration: 0.35, stagger: 0.02, ease: 'power2.out', clearProps: 'transform' }
      );
    }
  }, [month, storesMonthly.length]);
  return (
    <div className="space-y-6 mt-12 pt-8 border-t border-slate-800">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>📅 Registro Mensual Acumulado</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Análisis consolidado, cumplimiento de carga y rendimiento de locales
          </p>
        </div>

        <div className="flex items-center gap-3">
          <CustomMonthPicker
            value={month}
            onChange={onMonthChange}
          />
        </div>
      </div>

      {/* KPI Cards Grid: Responsive mobile layout (Venta 1st row, Comandas & Unidades 2x2 2nd row, Cumplimiento 3rd row) */}
      <div ref={kpiGridRef} className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 font-mono-numbers">
        {/* Venta Acumulada */}
        <div className="bg-slate-900/90 border border-slate-800/90 hover:border-emerald-500/40 rounded-2xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between gsap-card shadow-xl group min-h-[170px] sm:min-h-[175px] order-1 lg:order-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-sm shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-sans">
                  Venta Total Mes
                </p>
                <p className="text-[10px] text-slate-500 font-sans">
                  Facturación acumulada
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-sans">
              Facturación
            </span>
          </div>

          <div className="my-2 min-h-[44px] flex items-center">
            <p className={`${getCardNumberFontSize(kpis.venta, { isMoney: true })} font-black text-emerald-400 tracking-tight whitespace-nowrap`}>
              <AnimatedNumber value={kpis.venta} formatter={(v) => ARS.format(v)} />
            </p>
          </div>

          <div className="text-[11px] text-slate-400 font-sans flex items-center justify-between pt-2 border-t border-slate-800/60 mt-1">
            <span>Ticket promedio</span>
            <span className="font-bold text-emerald-300 font-mono-numbers">
              {kpis.ticketPromedio ? (
                <AnimatedNumber value={kpis.ticketPromedio} formatter={(v) => ARS.format(v)} />
              ) : (
                '–'
              )}
            </span>
          </div>
        </div>

        {/* Comandas Totales */}
        <div className="bg-slate-900/90 border border-slate-800/90 hover:border-blue-500/40 rounded-2xl p-3.5 sm:p-5 relative overflow-hidden flex flex-col justify-between gsap-card shadow-xl group min-h-[160px] sm:min-h-[175px] order-2 lg:order-2 col-span-1">
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
            <p className={`${getCardNumberFontSize(kpis.comandas)} font-black text-white tracking-tight whitespace-nowrap`}>
              <AnimatedNumber value={kpis.comandas} formatter={(v) => INT.format(v)} />
            </p>
          </div>

          <div className="text-[10px] sm:text-[11px] text-slate-400 font-sans flex items-center justify-between pt-2 border-t border-slate-800/60 mt-1">
            <span className="truncate">Cargas</span>
            <span className="font-bold text-blue-300 font-mono-numbers shrink-0">
              {kpis.cargasRealizadas}
            </span>
          </div>
        </div>

        {/* Unidades Totales */}
        <div className="bg-slate-900/90 border border-slate-800/90 hover:border-purple-500/40 rounded-2xl p-3.5 sm:p-5 relative overflow-hidden flex flex-col justify-between gsap-card shadow-xl group min-h-[160px] sm:min-h-[175px] order-3 lg:order-3 col-span-1">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-2">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20 shadow-sm shrink-0">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 font-sans truncate">
                  Unidades Totales
                </p>
                <p className="text-[9px] sm:text-[10px] text-slate-500 font-sans truncate">
                  Empanadas
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-sans">
              Empanadas
            </span>
          </div>

          <div className="my-2 min-h-[44px] flex items-center">
            <p className={`${getCardNumberFontSize(kpis.unidades)} font-black text-purple-300 tracking-tight whitespace-nowrap`}>
              <AnimatedNumber value={kpis.unidades} formatter={(v) => INT.format(v)} />
            </p>
          </div>

          <div className="text-[10px] sm:text-[11px] text-slate-400 font-sans flex items-center justify-between pt-2 border-t border-slate-800/60 mt-1">
            <span className="truncate">Unid./cmda</span>
            <span className="font-bold text-purple-300 font-mono-numbers shrink-0">
              {kpis.unidPorComanda ? (
                <AnimatedNumber value={kpis.unidPorComanda} decimals={1} formatter={(v) => DEC.format(v)} />
              ) : (
                '–'
              )}
            </span>
          </div>
        </div>

        {/* Cumplimiento de Carga */}
        <div className="bg-slate-900/90 border border-slate-800/90 hover:border-teal-500/40 rounded-2xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between gsap-card shadow-xl group min-h-[170px] sm:min-h-[175px] order-4 lg:order-4 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/20 shadow-sm shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-sans">
                  Cumplimiento
                </p>
                <p className="text-[10px] text-slate-500 font-sans">
                  Meta operativa mensual
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 font-sans">
              Objetivo
            </span>
          </div>

          <div className="my-2 min-h-[44px] flex items-center">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-teal-300 tracking-tight whitespace-nowrap">
              <AnimatedNumber value={kpis.cumplimientoPorcentaje} formatter={(v) => `${v}%`} />
            </p>
          </div>

          <div className="text-[11px] text-slate-400 font-sans flex items-center justify-between pt-2 border-t border-slate-800/60 mt-1">
            <span>Cargas esperadas</span>
            <span className="font-bold text-teal-300 font-mono-numbers">
              {kpis.cargasRealizadas}/{kpis.cargasEsperadas}
            </span>
          </div>
        </div>
      </div>

      {/* Supervisor Ranking if All view is selected */}
      {isAllSupervisors && supervisorasMonthly.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 sm:p-5 border-b border-slate-800/80">
            <h3 className="text-base font-bold text-white">Ranking Mensual por Supervisora</h3>
            <p className="text-xs text-slate-400">Comparativa de desempeño del equipo</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-mono-numbers">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 font-sans">Supervisora</th>
                  <th className="py-3 px-4 text-right">Tiendas</th>
                  <th className="py-3 px-4 text-right">Comandas</th>
                  <th className="py-3 px-4 text-right">Venta</th>
                  <th className="py-3 px-4 text-right">Unidades</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {supervisorasMonthly.map((sup, idx) => (
                  <tr key={sup.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 text-center font-bold">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-sans font-bold text-white">{sup.name}</td>
                    <td className="py-3.5 px-4 text-right text-slate-400">{sup.tiendasCount} tiendas</td>
                    <td className="py-3.5 px-4 text-right text-slate-300">{INT.format(sup.comandas)}</td>
                    <td className="py-3.5 px-4 text-right text-amber-400 font-bold">{ARS.format(sup.venta)}</td>
                    <td className="py-3.5 px-4 text-right text-slate-300">{INT.format(sup.unidades)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stores Monthly Ranking */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800/80">
          <h3 className="text-base font-bold text-white">Ranking del Mes por Tienda</h3>
          <p className="text-xs text-slate-400">Total acumulado de días cargados en el mes seleccionado</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono-numbers">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 font-sans">Tienda</th>
                <th className="py-3 px-4 text-center">Días Cargados</th>
                <th className="py-3 px-4 text-right">Comandas</th>
                <th className="py-3 px-4 text-right">Venta</th>
                <th className="py-3 px-4 text-right">Unidades</th>
                <th className="py-3 px-4 text-right">Ticket Prom.</th>
                <th className="py-3 px-4 text-right">Unid./Comanda</th>
              </tr>
            </thead>
            <tbody ref={storesTableRef} className="divide-y divide-slate-800/50">
              {storesMonthly.map((store, idx) => (
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
                    <div className="font-sans font-bold text-white">{store.name}</div>
                    {store.supervisoraNombre && (
                      <div className="text-xs text-slate-500">{store.supervisoraNombre}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        store.diasCargados === store.diasEsperados
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

      {/* Day by Day Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800/80">
          <h3 className="text-base font-bold text-white">Detalle Día por Día</h3>
          <p className="text-xs text-slate-400">Totales diarios registrados en el mes</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono-numbers">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-sans">Fecha</th>
                <th className="py-3 px-4 text-center">Tiendas Cargadas</th>
                <th className="py-3 px-4 text-right">Comandas</th>
                <th className="py-3 px-4 text-right">Venta</th>
                <th className="py-3 px-4 text-right">Unidades</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {daysMonthly.map((day) => (
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
                  <td className="py-3.5 px-4 text-right font-bold text-slate-200">{ARS.format(day.venta)}</td>
                  <td className="py-3.5 px-4 text-right text-slate-300">{INT.format(day.unidades)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
