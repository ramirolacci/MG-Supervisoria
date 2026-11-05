import React, { useRef, useEffect } from 'react';
import { ARS, INT, getCardNumberFontSize } from '../lib/formatters';
import { CheckCircle2, TrendingUp, ShoppingBag, Receipt, DollarSign } from 'lucide-react';
import { gsap, useGSAP } from '../lib/animations';
import { AnimatedNumber } from './AnimatedNumber';

export function DaySummaryBar({
  dateTitle,
  totalStores,
  loadedStores,
  totals,
  onSave,
  onDiscard,
  onCopyWhatsApp,
  onExportCsv,
  dirtyCount,
  isSaving,
}) {
  const isAllLoaded = totalStores > 0 && loadedStores === totalStores;
  const cardsContainerRef = useRef(null);
  const badgeRef = useRef(null);

  useGSAP(() => {
    if (cardsContainerRef.current) {
      gsap.fromTo(
        cardsContainerRef.current.children,
        { opacity: 0, y: 12, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.08, ease: 'power2.out', clearProps: 'transform' }
      );
    }
  }, { scope: cardsContainerRef });

  useEffect(() => {
    if (isAllLoaded && badgeRef.current) {
      gsap.fromTo(
        badgeRef.current,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.5)' }
      );
    }
  }, [isAllLoaded]);

  return (
    <div className="space-y-4">
      {/* 1. STICKY TOP BAR: Title & Loaded Progress */}
      <div className="sticky top-[53px] sm:top-[70px] z-20 bg-slate-950/95 backdrop-blur-md border-y border-slate-800/80 -mx-2 sm:-mx-6 lg:-mx-8 px-2.5 sm:px-6 lg:px-8 py-2.5 sm:py-3 shadow-2xl transition-all duration-300">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3">
          {/* Title & Progress */}
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-white flex items-center gap-2 truncate">
              <span>{dateTitle}</span>
              {isAllLoaded && (
                <span
                  ref={badgeRef}
                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  100% Completo
                </span>
              )}
            </h2>
          </div>

          <div className="text-xs font-semibold shrink-0 flex items-center gap-2">
            <span
              className={
                totalStores === 0
                  ? 'text-slate-500'
                  : isAllLoaded
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }
            >
              {loadedStores} de {totalStores} tiendas cargadas
            </span>
            <div className="w-16 sm:w-28 bg-slate-800 rounded-full h-1.5 overflow-hidden hidden sm:block">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isAllLoaded ? 'bg-emerald-400' : 'bg-amber-500'
                }`}
                style={{
                  width: `${totalStores > 0 ? Math.round((loadedStores / totalStores) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. DASHBOARD KPI CARDS: Responsive mobile layout (Venta top full-width, Comandas & Unidades 2-col below) and 3-col on desktop */}
      <div
        ref={cardsContainerRef}
        className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4 font-mono-numbers"
      >
        {/* Comandas Totales */}
        <div className="bg-slate-900/90 border border-slate-800/90 hover:border-blue-500/40 rounded-2xl p-3 sm:p-5 relative overflow-hidden flex flex-col justify-between gsap-card shadow-xl group order-2 md:order-1 col-span-1">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20 shadow-sm shrink-0">
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 font-sans truncate">
                  Comandas Totales
                </p>
                <p className="text-[9px] sm:text-[10px] text-slate-500 font-sans truncate">
                  Pedidos registrados
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-sans">
              Tickets
            </span>
          </div>

          <div className="my-1 sm:my-2 min-h-[38px] sm:min-h-[44px] flex items-center">
            <p className={`${getCardNumberFontSize(totals.c)} font-black text-white tracking-tight whitespace-nowrap`}>
              <AnimatedNumber value={totals.c} formatter={(v) => INT.format(v)} />
            </p>
          </div>

          <div className="text-[10px] sm:text-[11px] text-slate-400 font-sans flex items-center justify-between pt-1.5 sm:pt-2 border-t border-slate-800/60 mt-1">
            <span className="truncate">Progreso</span>
            <span className="font-bold text-slate-300 font-mono-numbers shrink-0">
              {totalStores > 0 ? Math.round((loadedStores / totalStores) * 100) : 0}% completado
            </span>
          </div>
        </div>

        {/* Venta Total Neta */}
        <div className="bg-slate-900/90 border border-slate-800/90 hover:border-emerald-500/40 rounded-2xl p-3.5 sm:p-5 relative overflow-hidden flex flex-col justify-between gsap-card shadow-xl group order-1 md:order-2 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-sm shrink-0">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-sans">
                  Venta Total Neta
                </p>
                <p className="text-[10px] text-slate-500 font-sans">
                  Facturación consolidada
                </p>
              </div>
            </div>
            {totals.c > 0 && totals.v > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-sans flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>TP {ARS.format(totals.v / totals.c)}</span>
              </span>
            )}
          </div>

          <div className="my-1.5 sm:my-2 min-h-[40px] sm:min-h-[44px] flex items-center">
            <p className={`${getCardNumberFontSize(totals.v, { isMoney: true })} font-black text-emerald-400 tracking-tight whitespace-nowrap`}>
              <AnimatedNumber value={totals.v} formatter={(v) => ARS.format(v)} />
            </p>
          </div>

          <div className="text-[11px] text-slate-400 font-sans flex items-center justify-between pt-2 border-t border-slate-800/60 mt-1">
            <span>Ticket promedio</span>
            <span className="font-bold text-emerald-300 font-mono-numbers">
              {totals.c > 0 ? ARS.format(totals.v / totals.c) : '–'}
            </span>
          </div>
        </div>

        {/* Unidades Totales */}
        <div className="bg-slate-900/90 border border-slate-800/90 hover:border-purple-500/40 rounded-2xl p-3 sm:p-5 relative overflow-hidden flex flex-col justify-between gsap-card shadow-xl group order-3 md:order-3 col-span-1">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
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

          <div className="my-1 sm:my-2 min-h-[38px] sm:min-h-[44px] flex items-center">
            <p className={`${getCardNumberFontSize(totals.u)} font-black text-purple-300 tracking-tight whitespace-nowrap`}>
              <AnimatedNumber value={totals.u} formatter={(v) => INT.format(v)} />
            </p>
          </div>

          <div className="text-[10px] sm:text-[11px] text-slate-400 font-sans flex items-center justify-between pt-1.5 sm:pt-2 border-t border-slate-800/60 mt-1">
            <span className="truncate">Unid./cmda</span>
            <span className="font-bold text-purple-300 font-mono-numbers shrink-0">
              {totals.c > 0 ? `${(totals.u / totals.c).toFixed(1)}` : '–'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
