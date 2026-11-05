import React, { useState, useRef, useEffect } from 'react';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  FileCheck,
  TrendingUp,
  Receipt,
  ShoppingBag,
  DollarSign,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { parseExcelData } from '../lib/excelImport';
import { ARS, INT, formatThousands, formatMoneyInput } from '../lib/formatters';
import { animateModalEnter, animateModalExit } from '../lib/animations';

function formatFechaDDMMAAAA(fechaStr) {
  if (!fechaStr) return '';
  const parts = String(fechaStr).split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return fechaStr;
}

export function ExcelImportModal({
  isOpen,
  onClose,
  allStores = [],
  activeStores = [],
  currentUser,
  activeSupName,
  selectedFecha,
  onApplyImport,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedStoreIds, setSelectedStoreIds] = useState(new Set());
  const fileInputRef = useRef(null);
  const backdropRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && modalRef.current && backdropRef.current) {
      animateModalEnter(modalRef.current, backdropRef.current);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeStoreIds = new Set(activeStores.map((s) => s.id));

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    setErrorMsg('');
    setIsProcessing(true);

    try {
      const result = await parseExcelData(file, allStores, activeStoreIds);
      setParseResult(result);
      // Por defecto seleccionamos todas las tiendas activas coincidentes
      setSelectedStoreIds(new Set(result.matchedActive.map((item) => item.store.id)));
    } catch (err) {
      console.error('Error procesando Excel:', err);
      setErrorMsg(err.message || 'No se pudo leer el archivo Excel.');
      setParseResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSelectStore = (storeId) => {
    setSelectedStoreIds((prev) => {
      const next = new Set(prev);
      if (next.has(storeId)) next.delete(storeId);
      else next.add(storeId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!parseResult) return;
    if (selectedStoreIds.size === parseResult.matchedActive.length) {
      setSelectedStoreIds(new Set());
    } else {
      setSelectedStoreIds(new Set(parseResult.matchedActive.map((item) => item.store.id)));
    }
  };

  const handleConfirm = () => {
    if (!parseResult) return;

    const itemsToApply = parseResult.matchedActive.filter((item) =>
      selectedStoreIds.has(item.store.id)
    );

    if (itemsToApply.length === 0) {
      setErrorMsg('Seleccioná al menos una sucursal para aplicar.');
      return;
    }

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
      });
    } catch (e) {}

    onApplyImport(itemsToApply);
    handleClose();
  };

  const handleClose = () => {
    if (modalRef.current && backdropRef.current) {
      animateModalExit(modalRef.current, backdropRef.current, () => {
        resetFile();
        onClose();
      });
    } else {
      resetFile();
      onClose();
    }
  };

  const resetFile = () => {
    setParseResult(null);
    setErrorMsg('');
    setSelectedStoreIds(new Set());
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Totales de los elementos seleccionados por el usuario en la previsualización
  const selectedItems = parseResult
    ? parseResult.matchedActive.filter((item) => selectedStoreIds.has(item.store.id))
    : [];

  const previewTotals = selectedItems.reduce(
    (acc, curr) => ({
      c: acc.c + curr.comandas,
      v: acc.v + curr.venta,
      u: acc.u + curr.unidades,
    }),
    { c: 0, v: 0, u: 0 }
  );

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) handleClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-slate-900 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
              <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Importación Inteligente de Excel</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Carga Rápida
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Carga diaria para <strong className="text-slate-200">{activeSupName}</strong> · Fecha:{' '}
                <strong className="text-slate-200">{formatFechaDDMMAAAA(selectedFecha)}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm space-y-3">
              <div className="flex items-center gap-2.5 font-bold text-amber-300">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
                <span>Atención con el formato del archivo</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">{errorMsg}</p>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                <p className="font-extrabold text-white flex items-center gap-1.5">
                  <span>💡 ¿Cómo solucionarlo rápidamente?</span>
                </p>
                <div className="space-y-1.5 text-slate-300">
                  <p>
                    <strong>Opción A (Recomendada):</strong> En Excel, andá a <em>Archivo ➔ Guardar como</em> y en el desplegable de Tipo elegí <strong className="text-amber-400">«Libro de Excel (*.xlsx)»</strong>. Luego arrastrá ese archivo.
                  </p>
                  <p>
                    <strong>Opción B (Directa):</strong> En tu carpeta de Descargas, entrá a la carpeta <code className="text-emerald-300">Reporte_ventas (4)_archivos</code> y arrastrá el archivo <strong className="text-emerald-300">sheet001.htm</strong> aquí.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Upload Dropzone if no file loaded */}
          {!parseResult ? (
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3.5 group ${
                  dragActive
                    ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                    : 'border-slate-700 hover:border-amber-500/60 bg-slate-950/60 hover:bg-slate-950/90'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv, .htm, .html"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-slate-800/80 group-hover:bg-amber-500/20 text-slate-400 group-hover:text-amber-400 flex items-center justify-center transition duration-300 shadow-inner">
                  {isProcessing ? (
                    <div className="w-7 h-7 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-7 h-7" />
                  )}
                </div>

                <div>
                  <p className="text-base sm:text-lg font-bold text-white group-hover:text-amber-400 transition">
                    {isProcessing ? 'Analizando archivo...' : 'Arrastrá tu archivo Excel aquí o hacé clic para buscar'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Formatos soportados: <span className="text-slate-300 font-mono">.xlsx</span>, <span className="text-slate-300 font-mono">.xls</span>, <span className="text-slate-300 font-mono">.csv</span>, <span className="text-slate-300 font-mono">.htm</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 mt-2">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Reconoce automáticamente columnas de <strong>SUCURSAL</strong>, <strong>COMANDAS</strong>, <strong>VENTAS</strong> y <strong>UNIDADES</strong></span>
                </div>
              </div>

              {/* Information pill */}
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-slate-300">Modo de importación activo:</p>
                  {activeStores.length >= allStores.length ? (
                    <p className="leading-relaxed">
                      Estás en la <strong className="text-amber-400">Vista General (Todas las tiendas)</strong> como <strong className="text-slate-200">{currentUser?.name}</strong>. Al subir el archivo, el sistema completará automáticamente los <strong className="text-white">{allStores.length} locales de la red</strong> en un solo paso.
                    </p>
                  ) : (
                    <p className="leading-relaxed">
                      Estás en la vista de <strong className="text-amber-400">{activeSupName}</strong> ({activeStores.length} tiendas). El sistema filtrará la planilla y **solo aplicará las {activeStores.length} tiendas de esta zona**, protegiendo las demás.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: Preview & Confirmation */
            <div className="space-y-5">
              {/* TOP SINGLE ROW: File Info + Listas para cargar Status Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                {/* File Info Box */}
                <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-white truncate" title={parseResult.fileName}>
                        {parseResult.fileName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {(parseResult.fileSize / 1024).toFixed(1)} KB · {parseResult.summary.totalDetected} sucursales detectadas
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={resetFile}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer shrink-0"
                  >
                    Cambiar archivo
                  </button>
                </div>

                {/* Listas para cargar Status Card */}
                <div className="p-3.5 rounded-2xl bg-emerald-950/25 border border-emerald-800/50 flex items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400">
                        Listas para cargar
                      </p>
                      <p className="text-base sm:text-lg font-black text-white font-mono-numbers truncate">
                        {parseResult.matchedActive.length} sucursales
                      </p>
                    </div>
                  </div>

                  {/* Compact badges for other or unmatched if any */}
                  {(parseResult.matchedOther.length > 0 || parseResult.unmatched.length > 0) && (
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono-numbers shrink-0">
                      {parseResult.matchedOther.length > 0 && (
                        <span className="px-2 py-1 rounded-lg bg-slate-800/90 text-slate-400 border border-slate-700/60" title="Sucursales de otras supervisoras">
                          {parseResult.matchedOther.length} otras
                        </span>
                      )}
                      {parseResult.unmatched.length > 0 && (
                        <span className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30" title="Filas no identificadas">
                          {parseResult.unmatched.length} omitidas
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* KPI Totals Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono-numbers">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">
                    Comandas Seleccionadas
                  </span>
                  <span className="text-xl font-black text-blue-400">
                    {INT.format(previewTotals.c)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">
                    Venta Neta Seleccionada
                  </span>
                  <span className="text-xl font-black text-emerald-400">
                    {ARS.format(previewTotals.v)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">
                    Unidades Seleccionadas
                  </span>
                  <span className="text-xl font-black text-purple-400">
                    {INT.format(previewTotals.u)}
                  </span>
                </div>
              </div>

              {/* Store List Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="font-bold text-slate-300">
                    Detalle de sucursales a cargar ({selectedStoreIds.size} seleccionadas):
                  </span>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-amber-400 hover:text-amber-300 font-bold transition cursor-pointer"
                  >
                    {selectedStoreIds.size === parseResult.matchedActive.length
                      ? 'Deseleccionar todas'
                      : 'Seleccionar todas'}
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/80 divide-y divide-slate-800/60 font-mono-numbers text-xs">
                  {parseResult.matchedActive.map((item) => {
                    const isChecked = selectedStoreIds.has(item.store.id);

                    return (
                      <div
                        key={item.store.id}
                        onClick={() => toggleSelectStore(item.store.id)}
                        className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition select-none ${
                          isChecked ? 'bg-slate-900/40 hover:bg-slate-900/80' : 'opacity-40 hover:opacity-75'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700 pointer-events-none"
                          />
                          <div className="min-w-0 font-sans">
                            <p className="font-extrabold text-white text-xs sm:text-sm truncate">
                              {item.store.name}
                            </p>
                            {item.rawSucursal !== item.store.name && (
                              <p className="text-[10px] text-slate-500 truncate">
                                En Excel: &quot;{item.rawSucursal}&quot;
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-6 shrink-0 text-right">
                          <div>
                            <span className="text-[10px] text-slate-500 block font-sans">CMDAS.</span>
                            <span className="font-bold text-slate-200">{item.rc || '0'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block font-sans">VENTA</span>
                            <span className="font-extrabold text-emerald-400">${item.rv || '0'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block font-sans">UNID.</span>
                            <span className="font-bold text-slate-200">{item.ru || '0'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions: Cancelar on right, AFTER Aplicar button */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-3">
          {parseResult && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedStoreIds.size === 0}
              className={`px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-black text-xs sm:text-sm transition flex items-center gap-2 shadow-xl ${
                selectedStoreIds.size > 0
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-amber-500/25 active:scale-95 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
              }`}
            >
              <span>Aplicar {selectedStoreIds.size} Tiendas a la Carga</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
