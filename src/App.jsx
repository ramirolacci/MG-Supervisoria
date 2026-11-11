import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { DatabaseModal } from './components/DatabaseModal';
import { LoginScreen } from './components/LoginScreen';
import { StoreRow } from './components/StoreRow';
import { DaySummaryBar } from './components/DaySummaryBar';
import { DayRankTable } from './components/DayRankTable';
import { MonthlyDashboard } from './components/MonthlyDashboard';
import { SupervisorKanbanBoard } from './components/SupervisorKanbanBoard';
import { HistoryRecordsSection } from './components/HistoryRecordsSection';
import { PlanificacionSupervisoras } from './components/PlanificacionSupervisoras';
import { RangeReportDashboard } from './components/RangeReportDashboard';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { CustomDatePicker } from './components/CustomDatePicker';
import { CustomMonthPicker } from './components/CustomMonthPicker';
import { CustomSupervisorSelect } from './components/CustomSupervisorSelect';
import { CustomGlobalGuardSelect } from './components/CustomGlobalGuardSelect';
import { Footer } from './components/Footer';
import { UserAvatar } from './components/UserAvatar';
import { ExcelImportModal } from './components/ExcelImportModal';
import { api } from './lib/api';
import { getSupabaseCredentials, getSupabase } from './lib/supabase';
import { getStoredSession, clearSession, isUserAdmin, canUserAccessHistory } from './lib/auth';
import { exportRankingPDF, exportRangeReportPDF } from './lib/pdfExport';
import {
  getYesterdayStr,
  fmtDayLong,
  todayStr,
  parseCount,
  parseMoney,
  formatMoneyInput,
  INT,
  ARS,
  exportCsv,
  MONTHF,
  parseYmd,
  pad,
  ymd,
  formatThousands,
} from './lib/formatters';
import { Calendar, UserCheck, AlertTriangle, CheckCircle, Copy, FileText, Save, RotateCcw, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import { animateTabEnter, animateTabExit, animateToastEnter, gsap } from './lib/animations';

const LS_SELECTED_SUP = 'mg_active_supervisora';
const ALL_SUP = '__all';

function getSubRoute() {
  const fullPath = window.location.pathname.replace(/\/+$/, '');
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  if (fullPath.endsWith('/planificacion') || fullPath === `${base}/planificacion`) {
    return 'planificacion';
  }
  return '';
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(() => getSubRoute());

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(getSubRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (subRoute) => {
    const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
    const targetUrl = subRoute ? `${base}/${subRoute}` : (base || '/');
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({}, '', targetUrl);
    }
    setCurrentRoute(subRoute);
  };

  const dateInputRef = useRef(null);
  const tabContentRef = useRef(null);
  const toastRef = useRef(null);
  const storeGridRef = useRef(null);
  const rankingContentRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(() => getStoredSession());
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const dbCreds = getSupabaseCredentials();

  // Core state
  const [config, setConfig] = useState({ supervisoras: [], tiendas: [] });
  const [selectedSup, setSelectedSup] = useState(() => {
    const session = getStoredSession();
    if (session?.supId) return session.supId;
    return localStorage.getItem(LS_SELECTED_SUP) || '';
  });
  const [selectedFecha, setSelectedFecha] = useState(getYesterdayStr());
  const [selectedMonth, setSelectedMonth] = useState(() => getYesterdayStr().slice(0, 7));

  // Date Range state for customized reporting
  const [rangeStartDate, setRangeStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return ymd(d);
  });
  const [rangeEndDate, setRangeEndDate] = useState(getYesterdayStr());
  const [rangeRows, setRangeRows] = useState([]);
  const [isLoadingRange, setIsLoadingRange] = useState(false);

  // Sync with currentUser when user logs in or switches
  useEffect(() => {
    if (currentUser?.supId) {
      setSelectedSup(currentUser.supId);
      localStorage.setItem(LS_SELECTED_SUP, currentUser.supId);
    }
  }, [currentUser]);

  // Day data: map of saved items { [tiendaId]: record }
  const [dayData, setDayData] = useState({});
  // Form draft state: { [tiendaId]: { rc: string, rv: string, ru: string } }
  const [formInputs, setFormInputs] = useState({});
  // Set of dirty store IDs
  const [dirtyStoreIds, setDirtyStoreIds] = useState(new Set());

  // Monthly data
  const [monthlyRows, setMonthlyRows] = useState([]);

  // All Cargas (for Elizabeth & Admin History tab)
  const [allCargas, setAllCargas] = useState([]);
  const [isLoadingAllCargas, setIsLoadingAllCargas] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState('carga'); // 'carga' | 'ranking' | 'kanban' | 'historial'
  const [rankingView, setRankingView] = useState('mes'); // 'mes' | 'dia'
  const [dayRankMetric, setDayRankMetric] = useState('v');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const isTabChangingRef = useRef(false);

  const handleTabChange = (nextTab) => {
    if (nextTab === activeTab || isTabChangingRef.current) return;
    if (tabContentRef.current) {
      isTabChangingRef.current = true;
      animateTabExit(tabContentRef.current, () => {
        setActiveTab(nextTab);
        isTabChangingRef.current = false;
      });
    } else {
      setActiveTab(nextTab);
    }
  };

  // GSAP: Animate tab transitions
  useEffect(() => {
    if (tabContentRef.current) {
      animateTabEnter(tabContentRef.current);
    }
  }, [activeTab]);

  const isRankingChangingRef = useRef(false);

  const handleRankingViewChange = (nextView) => {
    if (nextView === rankingView || isRankingChangingRef.current) return;
    if (rankingContentRef.current) {
      isRankingChangingRef.current = true;
      animateTabExit(rankingContentRef.current, () => {
        setRankingView(nextView);
        isRankingChangingRef.current = false;
      });
    } else {
      setRankingView(nextView);
    }
  };

  // GSAP: Animate Ranking View transitions (Mes / Día)
  useEffect(() => {
    if (rankingContentRef.current) {
      animateTabEnter(rankingContentRef.current);
    }
  }, [rankingView]);

  // GSAP: Animate toast notification
  useEffect(() => {
    if (toastMessage && toastRef.current) {
      animateToastEnter(toastRef.current);
    }
  }, [toastMessage]);

  // GSAP: Animate store rows when supervisor or date changes
  useEffect(() => {
    if (activeTab === 'carga' && storeGridRef.current && storeGridRef.current.children.length > 0) {
      gsap.fromTo(
        storeGridRef.current.children,
        { opacity: 0, y: 14, scale: 0.99 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.035, ease: 'power2.out', clearProps: 'transform' }
      );
    }
  }, [selectedSup, selectedFecha, activeTab]);

  // Permiso para ver u operar la pestaña de historial
  const canAccessHistory = canUserAccessHistory(currentUser);

  // Permiso para realizar Carga Global (Admins o Supervisor asignado de guardia)
  const isGlobalLoader = Boolean(
    isUserAdmin(currentUser) ||
    (config?.globalCargaSupervisorId &&
      (config.globalCargaSupervisorId === '__all' || config.globalCargaSupervisorId === currentUser?.supId))
  );

  const handleUpdateGlobalLoader = async (newSupId) => {
    try {
      const nextConfig = { ...config, globalCargaSupervisorId: newSupId };
      setConfig(nextConfig);
      await api.saveConfig(nextConfig);
      const supObj = config.supervisoras?.find((s) => s.id === newSupId);
      const label =
        newSupId === '__all'
          ? 'Todos los supervisores'
          : newSupId === 'none' || !newSupId
          ? 'Ninguno (Solo administradores)'
          : supObj?.name || newSupId;
      showToast(`Guardia de carga global asignada a: ${label}`, 'success');
    } catch (err) {
      console.error('Error updating global loader:', err);
      showToast('Error al actualizar permiso de guardia.', 'error');
    }
  };

  // 1. Initial Load: Config & Auto-Sync de cargas locales offline a Supabase
  useEffect(() => {
    api.getConfig().then((cfg) => {
      setConfig(cfg);
    });

    // Si el dispositivo tiene cargas o planes guardados localmente sin sincronizar,
    // se envían a Supabase de forma transparente en segundo plano
    api.syncLocalDataToSupabase().then((res) => {
      if (res && (res.syncedCargas > 0 || res.syncedPlanes > 0)) {
        showToast(`Se sincronizaron ${res.syncedCargas} cargas locales con la base de datos.`, 'info');
        loadDayData(selectedFecha);
        loadMonthData(selectedMonth);
      }
    }).catch((err) => {
      console.warn('AutoSync background notice:', err);
    });

    // Escucha en tiempo real de cambios en la configuración (Guardia de Carga Global)
    const supabase = getSupabase();
    let channel = null;

    if (supabase) {
      try {
        channel = supabase
          .channel('mg_config_realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'mg_config', filter: 'id=eq.estructura' },
            (payload) => {
              if (payload.new && payload.new.data) {
                const updatedData = payload.new.data;
                setConfig((prev) => ({
                  ...prev,
                  ...updatedData,
                  globalCargaSupervisorId: updatedData.globalCargaSupervisorId || 'none',
                }));
              }
            }
          )
          .subscribe();
      } catch (e) {
        console.warn('Realtime subscription error:', e);
      }
    }

    // Sincronización al volver a enfocar la ventana o pestaña
    const handleFocus = () => {
      api.getConfig().then((cfg) => {
        if (cfg) setConfig(cfg);
      });
    };
    window.addEventListener('focus', handleFocus);

    // Respaldo periódico cada 25 segundos
    const syncInterval = setInterval(() => {
      api.getConfig().then((cfg) => {
        if (cfg) {
          setConfig((prev) => {
            if (prev.globalCargaSupervisorId !== cfg.globalCargaSupervisorId) {
              return { ...prev, ...cfg };
            }
            return prev;
          });
        }
      });
    }, 25000);

    return () => {
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('focus', handleFocus);
      clearInterval(syncInterval);
    };
  }, []);

  // 2. Load Day Data
  const loadDayData = async (fecha) => {
    try {
      const data = await api.getCargasDia(fecha);
      setDayData(data);
      // Re-populate non-dirty inputs
      setFormInputs((prev) => {
        const next = { ...prev };
        config.tiendas.forEach((t) => {
          if (!dirtyStoreIds.has(t.id)) {
            const saved = data[t.id];
            next[t.id] = {
              rc: saved && saved.comandas !== undefined && saved.comandas !== null ? formatThousands(saved.comandas) : '',
              rv: saved && saved.venta !== undefined && saved.venta !== null ? formatMoneyInput(saved.venta) : '',
              ru: saved && saved.unidades !== undefined && saved.unidades !== null ? formatThousands(saved.unidades) : '',
            };
          }
        });
        return next;
      });
    } catch (err) {
      console.error('Error loading day data:', err);
    }
  };

  useEffect(() => {
    if (config.tiendas.length > 0) {
      loadDayData(selectedFecha);
    }
  }, [selectedFecha, config.tiendas]);

  // 3. Load Monthly Data
  const loadMonthData = async (mes) => {
    try {
      const rows = await api.getCargasMes(mes);
      setMonthlyRows(rows);
    } catch (err) {
      console.error('Error loading month data:', err);
    }
  };

  useEffect(() => {
    loadMonthData(selectedMonth);
  }, [selectedMonth]);

  // 3b. Load Range Data (for Customized Date Range Report)
  const loadRangeData = async (desde, hasta) => {
    if (!desde || !hasta) return;
    setIsLoadingRange(true);
    try {
      const rows = await api.getCargasRango(desde, hasta);
      setRangeRows(rows);
    } catch (err) {
      console.error('Error loading range data:', err);
    } finally {
      setIsLoadingRange(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ranking' && rankingView === 'rango') {
      loadRangeData(rangeStartDate, rangeEndDate);
    }
  }, [rangeStartDate, rangeEndDate, activeTab, rankingView]);

  // 4. Load All Cargas (for History Tab)
  const loadAllCargas = async () => {
    if (!canAccessHistory) return;
    setIsLoadingAllCargas(true);
    try {
      const rows = await api.getAllCargas();
      setAllCargas(rows);
    } catch (err) {
      console.error('Error loading all cargas:', err);
      showToast('No se pudo cargar el historial completo', 'error');
    } finally {
      setIsLoadingAllCargas(false);
    }
  };

  useEffect(() => {
    if (canAccessHistory && activeTab === 'historial') {
      loadAllCargas();
    }
  }, [canAccessHistory, activeTab]);

  // Handler to delete a single carga record from history
  const handleDeleteCargaRecord = async (record) => {
    try {
      await api.deleteCargaRecord(record.id, record.tiendaId, record.fecha);
      showToast(`Registro de ${record.tiendaNombre} (${record.fecha}) eliminado.`, 'info');
      await loadAllCargas();
      if (record.fecha === selectedFecha) {
        await loadDayData(selectedFecha);
      }
      if (record.fecha.startsWith(selectedMonth)) {
        await loadMonthData(selectedMonth);
      }
    } catch (err) {
      console.error('Error deleting record:', err);
      showToast('No se pudo eliminar el registro. Verificá permisos.', 'error');
    }
  };

  // Handler to update an existing carga record from history (Admin only)
  const handleUpdateCargaRecord = async (updatedRecord, originalRecord) => {
    try {
      // Si cambió de fecha o sucursal, la primary key de la BD (tiendaId_fecha) cambia.
      // Borramos el registro original para no dejar duplicados.
      if (
        originalRecord &&
        (originalRecord.tiendaId !== updatedRecord.tiendaId || originalRecord.fecha !== updatedRecord.fecha)
      ) {
        await api.deleteCargaRecord(originalRecord.id, originalRecord.tiendaId, originalRecord.fecha);
      }

      const payload = {
        ...updatedRecord,
        modificadoPor: currentUser?.name || 'Administración',
        modificadoEn: new Date().toISOString(),
      };

      await api.saveCargasDia([payload]);
      showToast(`Registro de ${updatedRecord.tiendaNombre} modificado exitosamente.`, 'success');
      await loadAllCargas();

      // Refrescar vistas del día y del mes involucradas
      const affectedDates = new Set([updatedRecord.fecha, originalRecord?.fecha].filter(Boolean));
      if (affectedDates.has(selectedFecha)) {
        await loadDayData(selectedFecha);
      }
      if (
        updatedRecord.fecha.startsWith(selectedMonth) ||
        (originalRecord && originalRecord.fecha.startsWith(selectedMonth))
      ) {
        await loadMonthData(selectedMonth);
      }
      return true;
    } catch (err) {
      console.error('Error updating record:', err);
      showToast('No se pudo actualizar el registro. Verificá la conexión.', 'error');
      throw err;
    }
  };

  // Filtered Stores by supervisor
  const activeStores = useMemo(() => {
    if (!selectedSup) return [];
    if (selectedSup === ALL_SUP) return config.tiendas;
    return config.tiendas.filter((t) => t.sup === selectedSup);
  }, [selectedSup, config.tiendas]);

  const activeSupName = useMemo(() => {
    if (selectedSup === ALL_SUP) return 'Todas las supervisoras';
    const s = config.supervisoras.find((x) => x.id === selectedSup);
    return s ? s.name : 'Sin supervisora';
  }, [selectedSup, config.supervisoras]);

  // Handle Input Changes
  const handleInputChange = (tiendaId, field, rawValue) => {
    setFormInputs((prev) => {
      const current = prev[tiendaId] || { rc: '', rv: '', ru: '' };
      return {
        ...prev,
        [tiendaId]: {
          ...current,
          [field === 'c' ? 'rc' : field === 'v' ? 'rv' : 'ru']: rawValue,
        },
      };
    });

    setDirtyStoreIds((prev) => {
      const next = new Set(prev);
      next.add(tiendaId);
      return next;
    });
  };

  // Evaluate store row validation state
  const evaluateRow = (tiendaId) => {
    const inputs = formInputs[tiendaId] || { rc: '', rv: '', ru: '' };
    const rc = inputs.rc.trim();
    const rv = inputs.rv.trim();
    const ru = inputs.ru.trim();

    const c = parseCount(rc);
    const v = parseMoney(rv);
    const u = parseCount(ru);

    const empty = !rc && !rv && !ru;
    const errs = [];
    if (rc && isNaN(c)) errs.push('comandas: solo números enteros');
    if (rv && isNaN(v)) errs.push('venta: ej. 1.669.515,40');
    if (ru && isNaN(u)) errs.push('unidades: solo números enteros');

    const complete = !isNaN(c) && !isNaN(v) && !isNaN(u);
    if (!empty && !complete && errs.length === 0) {
      errs.push('faltan completar campos');
    }

    return { rc, rv, ru, c, v, u, empty, complete, errs };
  };

  // Day live totals
  const dayTotals = useMemo(() => {
    let c = 0, v = 0, u = 0;
    activeStores.forEach((t) => {
      const ev = evaluateRow(t.id);
      if (ev.complete) {
        c += ev.c;
        v += ev.v;
        u += ev.u;
      } else if (dayData[t.id]) {
        c += dayData[t.id].comandas;
        v += dayData[t.id].venta;
        u += dayData[t.id].unidades;
      }
    });
    return { c, v, u };
  }, [activeStores, formInputs, dayData]);

  const loadedStoresCount = useMemo(() => {
    return activeStores.filter((t) => dayData[t.id] || evaluateRow(t.id).complete).length;
  }, [activeStores, dayData, formInputs]);

  // Save Day Action
  const handleSaveDay = async () => {
    if (dirtyStoreIds.size === 0) {
      showToast('No hay cambios para guardar.', 'info');
      return;
    }

    const bad = [];
    const itemsToSave = [];
    const itemsToDelete = [];

    dirtyStoreIds.forEach((tid) => {
      const ev = evaluateRow(tid);
      if (ev.empty) {
        // Si la tienda ya tenía carga registrada en la BD y el usuario borró los datos, se elimina la carga
        if (dayData[tid]) {
          itemsToDelete.push(tid);
        }
      } else if (ev.errs.length > 0 || !ev.complete) {
        bad.push(tid);
      } else {
        const store = config.tiendas.find((t) => t.id === tid) || { id: tid, name: 'Tienda', sup: '' };
        const supObj = config.supervisoras.find((s) => s.id === store.sup);
        itemsToSave.push({
          tiendaId: tid,
          tiendaNombre: store.name,
          supervisoraId: store.sup || '',
          supervisoraNombre: supObj ? supObj.name : '',
          fecha: selectedFecha,
          comandas: ev.c,
          venta: ev.v,
          unidades: ev.u,
          cargadoPor: currentUser?.name || 'Administración',
          cargadoEn: new Date().toISOString(),
        });
      }
    });

    if (bad.length > 0) {
      showToast(`Por favor revisá las tiendas marcadas con error (${bad.length})`, 'error');
      return;
    }

    if (itemsToSave.length === 0 && itemsToDelete.length === 0) {
      setDirtyStoreIds(new Set());
      showToast('No había datos que guardar o modificar.', 'info');
      return;
    }

    setIsSaving(true);
    try {
      if (itemsToSave.length > 0) {
        await api.saveCargasDia(itemsToSave);
      }
      if (itemsToDelete.length > 0) {
        for (const tid of itemsToDelete) {
          const existing = dayData[tid];
          await api.deleteCargaRecord(existing?.id, tid, selectedFecha);
        }
      }

      setDirtyStoreIds(new Set());
      await loadDayData(selectedFecha);
      await loadMonthData(selectedMonth);
      if (canAccessHistory) {
        loadAllCargas();
      }

      let msg = '';
      if (itemsToSave.length > 0 && itemsToDelete.length > 0) {
        msg = `¡Se guardaron ${itemsToSave.length} tiendas y se eliminaron ${itemsToDelete.length}!`;
      } else if (itemsToDelete.length > 0) {
        msg = `¡Se eliminó la carga de ${itemsToDelete.length} ${itemsToDelete.length === 1 ? 'tienda' : 'tiendas'} correctamente!`;
      } else {
        msg = `¡Se guardaron ${itemsToSave.length} tiendas correctamente!`;
      }
      showToast(msg, 'success');

      if (itemsToSave.length > 0) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 },
        });
      }
    } catch (err) {
      console.error(err);
      showToast('Hubo un error al guardar los cambios. Intentá de nuevo.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Discard changes
  const handleDiscardChanges = () => {
    setDirtyStoreIds(new Set());
    loadDayData(selectedFecha);
    showToast('Cambios descartados', 'info');
  };

  // Aplicar datos autocompletados desde Excel
  const handleApplyExcelImport = (itemsToApply) => {
    if (!itemsToApply || itemsToApply.length === 0) return;

    setFormInputs((prev) => {
      const next = { ...prev };
      itemsToApply.forEach((item) => {
        const current = next[item.store.id] || { rc: '', rv: '', ru: '' };
        next[item.store.id] = {
          rc: item.hasComandas ? item.rc : current.rc,
          rv: item.hasVenta ? item.rv : current.rv,
          ru: item.hasUnidades ? item.ru : current.ru,
        };
      });
      return next;
    });

    setDirtyStoreIds((prev) => {
      const next = new Set(prev);
      itemsToApply.forEach((item) => {
        next.add(item.store.id);
      });
      return next;
    });

    showToast(
      `¡Se completaron datos de ${itemsToApply.length} sucursales desde el Excel! Verificá y hacé clic en Guardar.`,
      'success'
    );
  };

  // WhatsApp formatted text generator
  const handleCopyWhatsApp = () => {
    if (dirtyStoreIds.size > 0) {
      showToast('Guardá primero los cambios antes de enviar por WhatsApp.', 'error');
      return;
    }
    const lines = [];
    lines.push(`*🥟 Carga diaria Mi Gusto*`);
    lines.push(`Supervisora: ${activeSupName}`);
    lines.push(`Día: ${fmtDayLong(selectedFecha)}`);
    lines.push('');

    let cTot = 0, vTot = 0, uTot = 0, countLoaded = 0;
    activeStores.forEach((t, i) => {
      const d = dayData[t.id];
      if (d) {
        countLoaded++;
        cTot += d.comandas;
        vTot += d.venta;
        uTot += d.unidades;
        const ticket = d.comandas > 0 ? ARS.format(d.venta / d.comandas) : '-';
        lines.push(`${i + 1}. *${t.name}*: ${INT.format(d.comandas)} cmdas · ${ARS.format(d.venta)} · ${INT.format(d.unidades)} unid. (Ticket: ${ticket})`);
      } else {
        lines.push(`• *${t.name}*: PENDIENTE DE CARGA`);
      }
    });

    lines.push('');
    lines.push(`*TOTAL (${countLoaded} de ${activeStores.length} tiendas):*`);
    lines.push(`💰 Venta: ${ARS.format(vTot)}`);
    lines.push(`🧾 Comandas: ${INT.format(cTot)}`);
    lines.push(`🥟 Unidades: ${INT.format(uTot)}`);

    const text = lines.join('\n');
    navigator.clipboard.writeText(text);
    showToast('¡Texto copiado para WhatsApp! Pegalo en el chat.', 'success');
  };

  // Export Day CSV
  const handleExportDayCsv = () => {
    const rows = [
      'Ranking;Fecha;Supervisora;Tienda;Comandas;Venta;Unidades;Ticket Promedio;Unidades por Comanda;Estado',
    ];
    let rank = 1;
    activeStores.forEach((t) => {
      const d = dayData[t.id];
      const supObj = config.supervisoras.find((s) => s.id === t.sup);
      const supName = supObj ? supObj.name : 'Sin supervisora';
      if (d) {
        const ticket = d.comandas > 0 ? (d.venta / d.comandas).toFixed(2) : '';
        const upc = d.comandas > 0 ? (d.unidades / d.comandas).toFixed(2) : '';
        rows.push(`${rank++};${selectedFecha};"${supName}";"${t.name}";${d.comandas};${d.venta};${d.unidades};${ticket};${upc};Cargada`);
      } else {
        rows.push(`;${selectedFecha};"${supName}";"${t.name}";;;;;;Pendiente`);
      }
    });
    exportCsv(`Carga_MiGusto_${selectedFecha}.csv`, rows);
    showToast('Excel del día descargado', 'success');
  };

  // Exportar Ranking / Métricas en PDF de alta calidad
  const handleExportRankingPdf = () => {
    try {
      if (rankingView === 'rango') {
        exportRangeReportPDF({
          startDate: rangeStartDate,
          endDate: rangeEndDate,
          supervisorName: activeSupName,
          kpis: rangeData.kpis,
          storesData: rangeData.storesData,
          supervisorasData: rangeData.supervisorasData,
          isAllSupervisors: selectedSup === ALL_SUP,
        });
        showToast('Informe PDF del período generado y descargado', 'success');
      } else {
        exportRankingPDF({
          rankingView,
          dateTitle: fmtDayLong(selectedFecha),
          month: selectedMonth,
          rankedList: rankedDayList,
          kpis: monthlyData.kpis,
          storesMonthly: monthlyData.storesMonthly,
          supervisorasMonthly: monthlyData.supervisorasMonthly,
        });
        showToast('Informe PDF de métricas generado y descargado', 'success');
      }
    } catch (err) {
      console.error('Error generating ranking PDF:', err);
      showToast('Error al generar el PDF del reporte', 'error');
    }
  };

  // Export Range CSV
  const handleExportRangeCsv = () => {
    const rows = [
      'Fecha;Supervisora;Tienda;Comandas;Venta;Unidades;Ticket Promedio;Unidades por Comanda',
    ];
    rangeRows.forEach((r) => {
      const ticket = r.comandas > 0 ? (r.venta / r.comandas).toFixed(2) : '';
      const upc = r.comandas > 0 ? (r.unidades / r.comandas).toFixed(2) : '';
      rows.push(`${r.fecha};"${r.supervisoraNombre || ''}";"${r.tiendaNombre}";${r.comandas};${r.venta};${r.unidades};${ticket};${upc}`);
    });
    exportCsv(`Reporte_MiGusto_${rangeStartDate}_al_${rangeEndDate}.csv`, rows);
    showToast('Excel del rango descargado', 'success');
  };

  // Export Month CSV (mantenido como utilitario opcional)
  const handleExportMonthCsv = () => {
    const rows = [
      'Fecha;Supervisora;Tienda;Comandas;Venta;Unidades;Ticket Promedio;Unidades por Comanda',
    ];
    monthlyRows.forEach((r) => {
      const ticket = r.comandas > 0 ? (r.venta / r.comandas).toFixed(2) : '';
      const upc = r.comandas > 0 ? (r.unidades / r.comandas).toFixed(2) : '';
      rows.push(`${r.fecha};"${r.supervisoraNombre || ''}";"${r.tiendaNombre}";${r.comandas};${r.venta};${r.unidades};${ticket};${upc}`);
    });
    exportCsv(`Registro_MiGusto_${selectedMonth}.csv`, rows);
    showToast('Excel del mes descargado', 'success');
  };

  // Day Ranking calculation
  const rankedDayList = useMemo(() => {
    const list = activeStores.map((t) => {
      const d = dayData[t.id];
      const ev = evaluateRow(t.id);
      const isLoaded = Boolean(d || ev.complete);
      const comandas = ev.complete ? ev.c : d ? d.comandas : 0;
      const venta = ev.complete ? ev.v : d ? d.venta : 0;
      const unidades = ev.complete ? ev.u : d ? d.unidades : 0;
      const ticketPromedio = comandas > 0 ? venta / comandas : 0;

      const supObj = config.supervisoras.find((s) => s.id === t.sup);

      return {
        tiendaId: t.id,
        tiendaNombre: t.name,
        supervisoraNombre: selectedSup === ALL_SUP && supObj ? supObj.name : null,
        isPropia: t.isPropia,
        isExperience: t.isExperience,
        isLoaded,
        comandas,
        venta,
        unidades,
        ticketPromedio,
      };
    });

    return list.sort((a, b) => {
      if (a.isLoaded !== b.isLoaded) return b.isLoaded - a.isLoaded;
      if (dayRankMetric === 'v') return b.venta - a.venta;
      if (dayRankMetric === 'c') return b.comandas - a.comandas;
      if (dayRankMetric === 'u') return b.unidades - a.unidades;
      if (dayRankMetric === 't') return b.ticketPromedio - a.ticketPromedio;
      return 0;
    });
  }, [activeStores, dayData, formInputs, dayRankMetric, selectedSup, config.supervisoras]);

  // Monthly KPIs & Breakdowns
  const monthlyData = useMemo(() => {
    const storeIds = new Set(activeStores.map((t) => t.id));
    const filtered = selectedSup === ALL_SUP ? monthlyRows : monthlyRows.filter((r) => storeIds.has(r.tiendaId));

    let venta = 0, comandas = 0, unidades = 0;
    filtered.forEach((r) => {
      venta += r.venta;
      comandas += r.comandas;
      unidades += r.unidades;
    });

    const ticketPromedio = comandas > 0 ? venta / comandas : null;
    const unidPorComanda = comandas > 0 ? unidades / comandas : null;

    // Days in selected month up to yesterday
    const [y, m] = selectedMonth.split('-').map(Number);
    const lastDayOfMonth = new Date(y, m, 0).getDate();
    const daysArr = [];
    const yday = getYesterdayStr();
    for (let d = 1; d <= lastDayOfMonth; d++) {
      const s = `${selectedMonth}-${pad(d)}`;
      if (s <= yday) daysArr.push(s);
    }

    const totalStores = activeStores.length;
    const cargasEsperadas = daysArr.length * totalStores;
    const cargasRealizadas = filtered.length;
    const cumplimientoPorcentaje = cargasEsperadas > 0 ? Math.round((cargasRealizadas / cargasEsperadas) * 100) : 0;

    // Store breakdown
    const storesMonthly = activeStores.map((t) => {
      const storeRows = filtered.filter((r) => r.tiendaId === t.id);
      let sVenta = 0, sCmdas = 0, sUnid = 0;
      storeRows.forEach((r) => {
        sVenta += r.venta;
        sCmdas += r.comandas;
        sUnid += r.unidades;
      });
      const sTicket = sCmdas > 0 ? sVenta / sCmdas : null;
      const sUpc = sCmdas > 0 ? sUnid / sCmdas : null;

      const supObj = config.supervisoras.find((s) => s.id === t.sup);

      return {
        id: t.id,
        name: t.name,
        supervisoraNombre: selectedSup === ALL_SUP && supObj ? supObj.name : null,
        diasCargados: storeRows.length,
        diasEsperados: daysArr.length,
        comandas: sCmdas,
        venta: sVenta,
        unidades: sUnid,
        ticketPromedio: sTicket,
        unidPorComanda: sUpc,
      };
    }).sort((a, b) => b.venta - a.venta);

    // Supervisor ranking for All view
    const supervisorasMonthly = config.supervisoras.map((s) => {
      const sStores = config.tiendas.filter((t) => t.sup === s.id);
      const sStoreIds = new Set(sStores.map((t) => t.id));
      const sRows = monthlyRows.filter((r) => sStoreIds.has(r.tiendaId));

      let sv = 0, sc = 0, su = 0;
      sRows.forEach((r) => {
        sv += r.venta;
        sc += r.comandas;
        su += r.unidades;
      });

      return {
        id: s.id,
        name: s.name,
        tiendasCount: sStores.length,
        comandas: sc,
        venta: sv,
        unidades: su,
      };
    }).sort((a, b) => b.venta - a.venta);

    // Day by day list
    const daysMonthly = daysArr.slice().reverse().map((f) => {
      const fRows = filtered.filter((r) => r.fecha === f);
      let fv = 0, fc = 0, fu = 0;
      fRows.forEach((r) => {
        fv += r.venta;
        fc += r.comandas;
        fu += r.unidades;
      });
      return {
        fecha: f,
        tiendasCargadas: fRows.length,
        totalTiendas: totalStores,
        comandas: fc,
        venta: fv,
        unidades: fu,
      };
    });

    return {
      kpis: {
        venta,
        comandas,
        unidades,
        ticketPromedio,
        unidPorComanda,
        cargasRealizadas,
        cargasEsperadas,
        cumplimientoPorcentaje,
      },
      storesMonthly,
      supervisorasMonthly,
      daysMonthly,
    };
  }, [monthlyRows, activeStores, selectedMonth, selectedSup, config.supervisoras]);

  // Date Range KPIs & Breakdowns
  const rangeData = useMemo(() => {
    const storeIds = new Set(activeStores.map((t) => t.id));
    const filtered = selectedSup === ALL_SUP ? rangeRows : rangeRows.filter((r) => storeIds.has(r.tiendaId));

    let venta = 0, comandas = 0, unidades = 0;
    filtered.forEach((r) => {
      venta += r.venta;
      comandas += r.comandas;
      unidades += r.unidades;
    });

    const ticketPromedio = comandas > 0 ? venta / comandas : null;
    const unidPorComanda = comandas > 0 ? unidades / comandas : null;

    // Array de días en el rango especificado [rangeStartDate ... rangeEndDate]
    const daysArr = [];
    if (rangeStartDate && rangeEndDate && rangeStartDate <= rangeEndDate) {
      const cur = parseYmd(rangeStartDate);
      const end = parseYmd(rangeEndDate);
      while (cur <= end) {
        daysArr.push(ymd(cur));
        cur.setDate(cur.getDate() + 1);
      }
    }

    const totalStores = activeStores.length;
    const cargasEsperadas = daysArr.length * totalStores;
    const cargasRealizadas = filtered.length;
    const cumplimientoPorcentaje = cargasEsperadas > 0 ? Math.round((cargasRealizadas / cargasEsperadas) * 100) : 0;

    // Desglose por tienda
    const storesData = activeStores.map((t) => {
      const storeRows = filtered.filter((r) => r.tiendaId === t.id);
      let sVenta = 0, sCmdas = 0, sUnid = 0;
      storeRows.forEach((r) => {
        sVenta += r.venta;
        sCmdas += r.comandas;
        sUnid += r.unidades;
      });
      const sTicket = sCmdas > 0 ? sVenta / sCmdas : null;
      const sUpc = sCmdas > 0 ? sUnid / sCmdas : null;
      const supObj = config.supervisoras.find((s) => s.id === t.sup);

      return {
        id: t.id,
        name: t.name,
        supervisoraNombre: supObj ? supObj.name : null,
        isPropia: t.isPropia,
        isExperience: t.isExperience,
        diasCargados: storeRows.length,
        diasEsperados: daysArr.length,
        comandas: sCmdas,
        venta: sVenta,
        unidades: sUnid,
        ticketPromedio: sTicket,
        unidPorComanda: sUpc,
      };
    }).sort((a, b) => b.venta - a.venta);

    // Comparativa de supervisoras en el rango (para vista general de todas)
    const supervisorasData = config.supervisoras.map((s) => {
      const sStores = config.tiendas.filter((t) => t.sup === s.id);
      const sStoreIds = new Set(sStores.map((t) => t.id));
      const sRows = rangeRows.filter((r) => sStoreIds.has(r.tiendaId));

      let sv = 0, sc = 0, su = 0;
      sRows.forEach((r) => {
        sv += r.venta;
        sc += r.comandas;
        su += r.unidades;
      });

      const sEsperadas = daysArr.length * sStores.length;
      const sCumplimiento = sEsperadas > 0 ? Math.round((sRows.length / sEsperadas) * 100) : 0;

      return {
        id: s.id,
        name: s.name,
        tiendasCount: sStores.length,
        cargasRealizadas: sRows.length,
        cargasEsperadas: sEsperadas,
        cumplimientoPorcentaje: sCumplimiento,
        comandas: sc,
        venta: sv,
        unidades: su,
        ticketPromedio: sc > 0 ? sv / sc : null,
      };
    }).sort((a, b) => b.venta - a.venta);

    // Detalle día a día en el rango
    const daysData = daysArr.slice().reverse().map((f) => {
      const fRows = filtered.filter((r) => r.fecha === f);
      let fv = 0, fc = 0, fu = 0;
      fRows.forEach((r) => {
        fv += r.venta;
        fc += r.comandas;
        fu += r.unidades;
      });
      return {
        fecha: f,
        tiendasCargadas: fRows.length,
        totalTiendas: totalStores,
        comandas: fc,
        venta: fv,
        unidades: fu,
      };
    });

    return {
      kpis: {
        venta,
        comandas,
        unidades,
        ticketPromedio,
        unidPorComanda,
        cargasRealizadas,
        cargasEsperadas,
        cumplimientoPorcentaje,
        totalDias: daysArr.length,
      },
      storesData,
      supervisorasData,
      daysData,
    };
  }, [rangeRows, activeStores, rangeStartDate, rangeEndDate, selectedSup, config.supervisoras, config.tiendas]);

  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          if (user.supId) {
            setSelectedSup(user.supId);
            localStorage.setItem(LS_SELECTED_SUP, user.supId);
          }
        }}
      />
    );
  }

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setSelectedSup('');
    localStorage.removeItem(LS_SELECTED_SUP);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top Brand Navigation */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenDbModal={() => setIsDbModalOpen(true)}
        isDbConfigured={dbCreds.isConfigured}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        isPlanificacionRoute={currentRoute === 'planificacion'}
        onNavigate={navigateTo}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        currentUser={currentUser}
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      {/* Main Container */}
      <main className="max-w-[1600px] w-full mx-auto px-2 sm:px-6 lg:px-8 pt-3 sm:pt-6 flex-1 pb-16">
        {/* Toast notifications */}
        {toastMessage && (
          <div
            ref={toastRef}
            className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-2 border ${
              toastMessage.type === 'error'
                ? 'bg-rose-950 text-rose-200 border-rose-800'
                : toastMessage.type === 'info'
                ? 'bg-slate-900 text-slate-200 border-slate-700'
                : 'bg-emerald-950 text-emerald-200 border-emerald-800'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {currentRoute === 'planificacion' ? (
          <PlanificacionSupervisoras
            config={config}
            currentUser={currentUser}
            isAdmin={isUserAdmin(currentUser)}
            onNavigate={navigateTo}
          />
        ) : (
          <>
            {/* Main Tabs Navigation */}
            <div className="mb-6 bg-slate-900/70 p-1.5 rounded-2xl border border-slate-800 shadow-md">
              <div className={`grid gap-1 sm:flex sm:items-center sm:gap-1.5 ${canAccessHistory ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
                <button
                  onClick={() => handleTabChange('carga')}
                  className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-5 py-2.5 rounded-xl font-extrabold text-[11px] sm:text-sm gsap-button text-center transition-all duration-200 cursor-pointer ${
                    activeTab === 'carga'
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-sm sm:text-base">📋</span>
                  <span className="truncate">Carga diaria</span>
                </button>

                <button
                  onClick={() => handleTabChange('ranking')}
                  className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-5 py-2.5 rounded-xl font-extrabold text-[11px] sm:text-sm gsap-button text-center transition-all duration-200 cursor-pointer ${
                    activeTab === 'ranking'
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-sm sm:text-base">🏆</span>
                  <span className="truncate">
                    <span className="sm:hidden">Ranking</span>
                    <span className="hidden sm:inline">Ranking y Métricas</span>
                  </span>
                </button>

                <button
                  onClick={() => handleTabChange('kanban')}
                  className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-5 py-2.5 rounded-xl font-extrabold text-[11px] sm:text-sm gsap-button text-center transition-all duration-200 cursor-pointer ${
                    activeTab === 'kanban'
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-sm sm:text-base">🔀</span>
                  <span className="truncate">
                    <span className="sm:hidden">Sucursales</span>
                    <span className="hidden sm:inline">Sucursales y supervisores</span>
                  </span>
                  <span className="hidden lg:inline text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {config.tiendas.length}
                  </span>
                </button>

                {/* Pestaña Historial Exclusiva para Elizabeth y Admin */}
                {canAccessHistory && (
                  <button
                    onClick={() => handleTabChange('historial')}
                    className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-5 py-2.5 rounded-xl font-extrabold text-[11px] sm:text-sm gsap-button text-center transition-all duration-200 cursor-pointer ${
                      activeTab === 'historial'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'text-purple-300/80 hover:text-white hover:bg-purple-950/40 border border-purple-900/30'
                    }`}
                    title="Historial de todos los registros cargados (Solo Admin y Elizabeth)"
                  >
                    <span className="text-sm sm:text-base">📜</span>
                    <span className="truncate">Historial</span>
                    {allCargas.length > 0 && (
                      <span className="hidden lg:inline text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-200">
                        {allCargas.length}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div ref={tabContentRef} key={activeTab}>
            {activeTab === 'historial' && canAccessHistory ? (
              <HistoryRecordsSection
                cargas={allCargas}
                isLoading={isLoadingAllCargas}
                onRefresh={loadAllCargas}
                onDeleteRecord={handleDeleteCargaRecord}
                onUpdateRecord={handleUpdateCargaRecord}
                supervisoras={config.supervisoras}
                tiendas={config.tiendas}
                currentUser={currentUser}
              />
            ) : activeTab === 'kanban' ? (
              <SupervisorKanbanBoard
                config={config}
                currentUser={currentUser}
                onUpdateConfig={async (next) => {
                  setConfig(next);
                  await api.saveConfig(next);
                  showToast('Asignación de sucursales actualizada', 'success');
                }}
              />
            ) : activeTab === 'ranking' ? (
          /* TAB 2: RANKING Y MÉTRICAS */
          <div className="space-y-4 sm:space-y-6">
            {/* Header Filter Info with Día / Mes / Rango Toggle */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-3 sm:gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <span>
                    {rankingView === 'dia'
                      ? '🏆 Ranking del Día'
                      : rankingView === 'mes'
                      ? '📅 Métricas del Mes'
                      : '📊 Reporte por Rango de Fechas'}
                  </span>
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                  {rankingView === 'dia'
                    ? `Posiciones y rendimiento del día (${fmtDayLong(selectedFecha)})`
                    : rankingView === 'mes'
                    ? 'Acumulado mensual consolidado y detalle de cumplimiento'
                    : `Análisis consolidado del ${rangeStartDate} al ${rangeEndDate} · ${activeSupName}`}
                </p>
              </div>

              <div
                className={`w-full sm:w-auto flex gap-2 sm:gap-3 ${
                  rankingView === 'rango'
                    ? 'flex-col sm:flex-row items-stretch sm:items-center'
                    : 'flex-row items-center justify-between sm:justify-start'
                }`}
              >
                {/* Switch Día / Mes / Rango */}
                <div
                  className={`p-1 sm:p-1.5 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner ${
                    rankingView === 'rango'
                      ? 'w-full sm:w-auto grid grid-cols-3 sm:flex'
                      : 'flex w-fit'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleRankingViewChange('dia')}
                    className={`py-2 rounded-xl text-xs sm:text-sm font-black transition active:scale-95 cursor-pointer text-center ${
                      rankingView === 'rango'
                        ? 'w-full sm:w-auto px-2 sm:px-4'
                        : 'px-3.5 sm:px-4'
                    } ${
                      rankingView === 'dia'
                        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    Día
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRankingViewChange('mes')}
                    className={`py-2 rounded-xl text-xs sm:text-sm font-black transition active:scale-95 cursor-pointer text-center ${
                      rankingView === 'rango'
                        ? 'w-full sm:w-auto px-2 sm:px-4'
                        : 'px-3.5 sm:px-4'
                    } ${
                      rankingView === 'mes'
                        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    Mes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRankingViewChange('rango')}
                    className={`py-2 rounded-xl text-xs sm:text-sm font-black transition active:scale-95 cursor-pointer text-center ${
                      rankingView === 'rango'
                        ? 'w-full sm:w-auto px-2 sm:px-4'
                        : 'px-3.5 sm:px-4'
                    } ${
                      rankingView === 'rango'
                        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    Rango
                  </button>
                </div>

                {/* Contenedor de Botones de Exportar */}
                <div
                  className={`flex items-center gap-2 ${
                    rankingView === 'rango' ? 'w-full sm:w-auto' : 'w-auto'
                  }`}
                >
                  {/* Botón Exportar PDF de Ranking / Métricas / Rango */}
                  <button
                    type="button"
                    onClick={handleExportRankingPdf}
                    className={`flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-lg shadow-rose-600/25 active:scale-95 cursor-pointer whitespace-nowrap ${
                      rankingView === 'rango' ? 'flex-1 sm:flex-initial' : 'flex-initial'
                    }`}
                    title="Descargar informe ejecutivo en PDF de ranking o métricas"
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span>Exportar PDF</span>
                  </button>

                  {/* Botón Exportar CSV cuando esté en Rango */}
                  {rankingView === 'rango' && (
                    <button
                      type="button"
                      onClick={handleExportRangeCsv}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-lg shadow-emerald-600/25 active:scale-95 cursor-pointer whitespace-nowrap"
                      title="Descargar CSV del rango de fechas seleccionado"
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      <span>Exportar CSV</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Content: Day Ranking OR Monthly Dashboard OR Range Report Dashboard with smooth transitions */}
            <div ref={rankingContentRef}>
              {activeStores.length > 0 ? (
                rankingView === 'dia' ? (
                  <DayRankTable
                    rankedList={rankedDayList}
                    metric={dayRankMetric}
                    onMetricChange={setDayRankMetric}
                    dateTitle={fmtDayLong(selectedFecha)}
                  />
                ) : rankingView === 'mes' ? (
                  <MonthlyDashboard
                    month={selectedMonth}
                    onMonthChange={setSelectedMonth}
                    kpis={monthlyData.kpis}
                    storesMonthly={monthlyData.storesMonthly}
                    supervisorasMonthly={monthlyData.supervisorasMonthly}
                    daysMonthly={monthlyData.daysMonthly}
                    isAllSupervisors={selectedSup === ALL_SUP}
                    onExportMonthPdf={handleExportRankingPdf}
                    onExportMonthCsv={handleExportMonthCsv}
                  />
                ) : (
                  <RangeReportDashboard
                    startDate={rangeStartDate}
                    endDate={rangeEndDate}
                    onStartDateChange={setRangeStartDate}
                    onEndDateChange={setRangeEndDate}
                    selectedSup={selectedSup}
                    onSelectSup={(supId) => {
                      setSelectedSup(supId);
                      localStorage.setItem(LS_SELECTED_SUP, supId);
                    }}
                    supervisoras={config.supervisoras}
                    tiendas={config.tiendas}
                    kpis={rangeData.kpis}
                    storesData={rangeData.storesData}
                    supervisorasData={rangeData.supervisorasData}
                    daysData={rangeData.daysData}
                    isAllSupervisors={selectedSup === ALL_SUP}
                    currentUser={currentUser}
                    isAdmin={isUserAdmin(currentUser)}
                  />
                )
              ) : (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                  <p className="text-base font-semibold text-white mb-1">
                    Sin tiendas para mostrar métricas
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* TAB 1: CARGA DIARIA (Enfocada 100% en la carga) */
          <>
            {/* Hero & Selection Controls */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-xl mb-4 sm:mb-6">
          <div className={`grid gap-2.5 sm:gap-4 ${isUserAdmin(currentUser) ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {/* 1. Supervisor Selector */}
            <div className="min-w-0">
              <label className="block text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2 flex items-center justify-between truncate">
                <span className="flex items-center gap-1 sm:gap-1.5 truncate">
                  <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                  <span className="truncate">Supervisora a Cargo</span>
                </span>
                {!isUserAdmin(currentUser) && !isGlobalLoader && (
                  <span className="hidden sm:inline text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Asignada por sesión
                  </span>
                )}
                {!isUserAdmin(currentUser) && isGlobalLoader && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-black uppercase tracking-wider bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                    ⚡ De Guardia
                  </span>
                )}
              </label>

              {isUserAdmin(currentUser) ? (
                /* Admin: Can select any supervisor or all stores */
                <CustomSupervisorSelect
                  value={selectedSup}
                  onChange={(newSup) => {
                    if (dirtyStoreIds.size > 0) {
                      if (!confirm('Tenés cambios sin guardar. ¿Deseas descartarlos para cambiar de supervisora?')) {
                        return;
                      }
                      setDirtyStoreIds(new Set());
                    }
                    setSelectedSup(newSup);
                    localStorage.setItem(LS_SELECTED_SUP, newSup);
                  }}
                  supervisoras={config.supervisoras}
                  tiendas={config.tiendas}
                  allSupValue={ALL_SUP}
                />
              ) : isGlobalLoader ? (
                /* Supervisor on duty: Can toggle between their own stores and all stores! */
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 border border-amber-500/50 rounded-2xl shadow-inner">
                    <button
                      type="button"
                      onClick={() => {
                        if (dirtyStoreIds.size > 0) {
                          if (!confirm('Tenés cambios sin guardar. ¿Deseas descartarlos para cambiar de vista?')) return;
                          setDirtyStoreIds(new Set());
                        }
                        setSelectedSup(currentUser?.supId || '');
                        localStorage.setItem(LS_SELECTED_SUP, currentUser?.supId || '');
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                        selectedSup === currentUser?.supId
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <span>🏢 Mis Locales</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (dirtyStoreIds.size > 0) {
                          if (!confirm('Tenés cambios sin guardar. ¿Deseas descartarlos para cambiar de vista?')) return;
                          setDirtyStoreIds(new Set());
                        }
                        setSelectedSup(ALL_SUP);
                        localStorage.setItem(LS_SELECTED_SUP, ALL_SUP);
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                        selectedSup === ALL_SUP
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                          : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
                      }`}
                    >
                      <span>🌐 Toda la Red ({config.tiendas.length})</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Supervisor: Locked strictly to their own account */
                <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-2.5 sm:px-4 py-2 sm:py-3 text-white font-bold text-xs sm:text-base shadow-inner flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <UserAvatar
                      user={currentUser}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg shrink-0"
                      textClassName="text-xs font-extrabold text-white"
                    />
                    <span className="truncate">{currentUser?.name}</span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-amber-400 font-extrabold bg-amber-500/10 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-xl border border-amber-500/20 shrink-0">
                    {activeStores.length} <span className="hidden sm:inline">locales</span>
                  </span>
                </div>
              )}
            </div>

            {/* 2. Guardia Carga Global (Solo Administradores) */}
            {isUserAdmin(currentUser) && (
              <div className="min-w-0">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2 flex items-center justify-between truncate">
                  <span className="flex items-center gap-1 sm:gap-1.5 truncate">
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                    <span className="truncate">Guardia Carga Global</span>
                  </span>
                  <span className="hidden sm:inline text-[10px] text-amber-400 font-bold uppercase tracking-wider bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    Control Admin
                  </span>
                </label>

                <CustomGlobalGuardSelect
                  value={config.globalCargaSupervisorId || 'none'}
                  onChange={handleUpdateGlobalLoader}
                  supervisoras={config.supervisoras}
                  tiendas={config.tiendas}
                />
              </div>
            )}

            {/* 3. Date Selector */}
            <div className="min-w-0">
              <label className="block text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2 flex items-center gap-1 sm:gap-1.5 truncate">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                <span className="truncate">Día a Cargar</span>
              </label>

              <CustomDatePicker
                value={selectedFecha}
                maxDate={todayStr()}
                onChange={(val) => {
                  if (dirtyStoreIds.size > 0) {
                    if (!confirm('Tenés cambios sin guardar. ¿Deseas descartarlos para cambiar de fecha?')) {
                      return;
                    }
                    setDirtyStoreIds(new Set());
                  }
                  setSelectedFecha(val);
                }}
              />
            </div>
          </div>

          {/* Banner de Carga Rápida con Excel */}
          <div className="mt-3.5 sm:mt-4 pt-3.5 sm:pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-slate-300 text-center sm:text-left">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0 hidden sm:block" />
              <span>
                ¿Tenés la planilla de ventas de hoy? Cargá todas las tiendas de <strong className="text-white">{activeSupName}</strong> automáticamente.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsExcelModalOpen(true)}
              className="w-auto px-4 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 hover:text-white font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition active:scale-95 cursor-pointer shrink-0"
              title="Importar comandas, ventas y unidades desde planilla Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Importar Excel</span>
            </button>
          </div>

          {/* Banner de Guardia para Supervisora Habilitada */}
          {!isUserAdmin(currentUser) && isGlobalLoader && (
            <div className="mt-3.5 pt-3 border-t border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-gradient-to-r from-amber-500/15 via-slate-900/60 to-transparent p-3 rounded-xl border border-amber-500/30">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-white">
                    Estás habilitado/a para Carga Global
                  </p>
                  <p className="text-[11px] text-amber-200/80">
                    Administración te asignó la guardia de hoy. Podés alternar arriba entre <strong>"Mis Locales"</strong> y <strong>"Toda la Red"</strong> ({config.tiendas.length} sucursales).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Day Sticky Bar */}
        <DaySummaryBar
          dateTitle={`${fmtDayLong(selectedFecha)} ${selectedFecha === getYesterdayStr() ? '· Ayer' : ''}`}
          totalStores={activeStores.length}
          loadedStores={loadedStoresCount}
          totals={dayTotals}
          onSave={handleSaveDay}
          onDiscard={handleDiscardChanges}
          onCopyWhatsApp={handleCopyWhatsApp}
          onExportCsv={handleExportDayCsv}
          dirtyCount={dirtyStoreIds.size}
          isSaving={isSaving}
        />

        {/* Store Sheet */}
        <div ref={storeGridRef} className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
          {!selectedSup ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              <p className="text-base font-semibold text-white mb-1">
                Elegí tu nombre arriba para comenzar la carga
              </p>
              <p className="text-xs">
                Se guardará en tu dispositivo para recordar tu selección la próxima vez.
              </p>
            </div>
          ) : activeStores.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              <p className="text-base font-semibold text-white mb-1">
                No hay tiendas asignadas para esta supervisora
              </p>
              <p className="text-xs">
                Podés asignar tiendas en la sección de Administración abajo.
              </p>
            </div>
          ) : (
            activeStores.map((tienda) => {
              const values = evaluateRow(tienda.id);
              const saved = dayData[tienda.id];
              const isDirty = dirtyStoreIds.has(tienda.id);

              return (
                <StoreRow
                  key={tienda.id}
                  tienda={tienda}
                  values={values}
                  onChange={handleInputChange}
                  savedData={saved}
                  isDirty={isDirty}
                />
              );
            })
          )}
        </div>

        {/* Action buttons toolbar positioned directly below the store sheet */}
        {activeStores.length > 0 && (
          <div className="mt-6 bg-slate-900/60 border border-slate-800 rounded-3xl p-3.5 sm:p-5 shadow-xl">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 max-w-5xl mx-auto items-stretch">
              {/* Primary Save Button */}
              <button
                type="button"
                onClick={handleSaveDay}
                disabled={isSaving || dirtyStoreIds.size === 0}
                className={`py-3 px-2 sm:px-4 rounded-2xl font-black text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 shadow-xl ${
                  dirtyStoreIds.size > 0
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25 active:scale-95 cursor-pointer'
                    : 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
                }`}
                title={dirtyStoreIds.size > 0 ? `Guardar ${dirtyStoreIds.size} cambios` : 'No hay cambios para guardar'}
              >
                <Save className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {isSaving
                    ? 'Guardando...'
                    : dirtyStoreIds.size > 0
                    ? `Guardar (${dirtyStoreIds.size})`
                    : 'Guardar'}
                </span>
              </button>

              {/* Import Excel Button */}
              <button
                type="button"
                onClick={() => setIsExcelModalOpen(true)}
                className="py-3 px-2 sm:px-4 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 hover:border-emerald-500/60 text-emerald-300 hover:text-white font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 shadow-md shadow-emerald-950/30 cursor-pointer"
                title="Importar carga diaria desde planilla Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">Importar Excel</span>
              </button>

              {/* Discard changes button (always visible, disabled if no dirty stores) */}
              <button
                type="button"
                onClick={handleDiscardChanges}
                disabled={dirtyStoreIds.size === 0 || isSaving}
                className={`py-3 px-2 sm:px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 shadow-md ${
                  dirtyStoreIds.size > 0
                    ? 'bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/70 text-rose-300 hover:text-white shadow-rose-950/30 active:scale-95 cursor-pointer'
                    : 'bg-slate-900/40 border border-slate-800/60 text-slate-600 cursor-not-allowed opacity-50'
                }`}
                title={dirtyStoreIds.size > 0 ? 'Descartar cambios no guardados' : 'Sin cambios pendientes para descartar'}
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                <span className="truncate">Descartar</span>
              </button>

              {/* WhatsApp Share Button */}
              <button
                type="button"
                onClick={handleCopyWhatsApp}
                className="py-3 px-2 sm:px-4 rounded-2xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/70 text-emerald-400 font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 shadow-md shadow-emerald-950/30 cursor-pointer"
                title="Copiar resumen para WhatsApp"
              >
                <span className="text-base shrink-0 leading-none">📱</span>
                <span className="truncate">WhatsApp</span>
              </button>

              {/* Excel Export Button */}
              <button
                type="button"
                onClick={handleExportDayCsv}
                className="py-3 px-2 sm:px-4 rounded-2xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 shadow-md shadow-black/40 cursor-pointer"
                title="Exportar a CSV / Excel"
              >
                <span className="text-base shrink-0 leading-none">📊</span>
                <span className="truncate">Exportar</span>
              </button>
            </div>
          </div>
        )}
          </>
        )}
            </div>
          </>
        )}
      </main>

      {/* Screen Footer */}
      <Footer />

      {/* Database Modal */}
      <DatabaseModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        allStores={config.tiendas}
        activeStores={activeStores}
        currentUser={currentUser}
        activeSupName={activeSupName}
        selectedFecha={selectedFecha}
        onApplyImport={handleApplyExcelImport}
      />
    </div>
  );
}
