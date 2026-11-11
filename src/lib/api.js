import { getSupabase } from './supabase';

const LS_CONFIG_KEY = 'mg_structure_v8';
const LS_CARGAS_KEY = 'mg_local_cargas';

// Default initial dataset with standard Mi Gusto structure
// Default initial dataset with exact Mi Gusto structure from operational team
export const INITIAL_CONFIG = {
  globalCargaSupervisorId: 'none',
  supervisoras: [
    {
      id: 'sup_damaris',
      name: 'Damaris Burgos',
      title: 'Supervisora de Tiendas',
      avatarColor: 'from-pink-500 to-rose-600',
    },
    {
      id: 'sup_lidya',
      name: 'Lidya Tello',
      title: 'Administradora General',
      avatarColor: 'from-sky-500 to-indigo-600',
    },
    {
      id: 'sup_evelyn',
      name: 'Evelyn Cedrón',
      title: 'Supervisora de Tiendas',
      avatarColor: 'from-teal-500 to-cyan-600',
    },
    // Supervisores de Tiendas Propias
    {
      id: 'sup_selene',
      name: 'Selene Hernández',
      title: 'Supervisora Tienda Propia',
      avatarColor: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'sup_sasha',
      name: 'Sasha Alfini',
      title: 'Supervisora Tienda Propia',
      avatarColor: 'from-purple-500 to-violet-600',
    },
    {
      id: 'sup_martin',
      name: 'Martín Sastre',
      title: 'Supervisor Tienda Propia',
      avatarColor: 'from-blue-500 to-cyan-600',
    },
  ],
  tiendas: [
    // Damaris Burgos (18 locales)
    { id: 't_ballester', name: 'Ballester', sup: 'sup_damaris' },
    { id: 't_balvanera', name: 'Balvanera', sup: 'sup_damaris' },
    { id: 't_barrancas_belgrano', name: 'Barrancas de Belgrano', sup: 'sup_damaris' },
    { id: 't_belgrano', name: 'Belgrano', sup: 'sup_damaris' },
    { id: 't_caballito', name: 'Caballito', sup: 'sup_damaris', isExperience: true },
    { id: 't_del_viso', name: 'Del Viso', sup: 'sup_damaris' },
    { id: 't_don_torcuato', name: 'Don Torcuato', sup: 'sup_damaris' },
    { id: 't_floresta', name: 'Floresta', sup: 'sup_damaris' },
    { id: 't_ituzaingo', name: 'Ituzaingó', sup: 'sup_damaris' },
    { id: 't_martinez', name: 'Martínez', sup: 'sup_damaris' },
    { id: 't_mataderos', name: 'Mataderos', sup: 'sup_damaris' },
    { id: 't_moreno', name: 'Moreno', sup: 'sup_damaris' },
    { id: 't_munro', name: 'Munro', sup: 'sup_damaris' },
    { id: 't_palermo', name: 'Palermo', sup: 'sup_damaris' },
    { id: 't_paternal', name: 'Paternal', sup: 'sup_damaris' },
    { id: 't_puerto_madero', name: 'Puerto Madero', sup: 'sup_damaris' },
    { id: 't_tigre', name: 'Tigre', sup: 'sup_damaris' },
    { id: 't_villa_adelina', name: 'Villa Adelina', sup: 'sup_damaris' },

    // Evelyn Cedrón (18 locales)
    { id: 't_bella_vista', name: 'Bella Vista', sup: 'sup_evelyn' },
    { id: 't_campana', name: 'Campana', sup: 'sup_evelyn' },
    { id: 't_devoto', name: 'Devoto', sup: 'sup_evelyn' },
    { id: 't_escobar', name: 'Escobar', sup: 'sup_evelyn' },
    { id: 't_florida', name: 'Florida', sup: 'sup_evelyn' },
    { id: 't_general_pacheco', name: 'General Pacheco', sup: 'sup_evelyn' },
    { id: 't_hurlingham', name: 'Hurlingham', sup: 'sup_evelyn' },
    { id: 't_jose_c_paz', name: 'José C. Paz', sup: 'sup_evelyn' },
    { id: 't_los_polvorines', name: 'Los Polvorines', sup: 'sup_evelyn' },
    { id: 't_maschwitz', name: 'Maschwitz', sup: 'sup_evelyn' },
    { id: 't_merlo', name: 'Merlo', sup: 'sup_evelyn' },
    { id: 't_muniz', name: 'Muñiz', sup: 'sup_evelyn' },
    { id: 't_pilar_centro', name: 'Pilar Centro', sup: 'sup_evelyn' },
    { id: 't_pilar_derqui', name: 'Pilar Derqui', sup: 'sup_evelyn' },
    { id: 't_san_fernando', name: 'San Fernando', sup: 'sup_evelyn' },
    { id: 't_san_martin', name: 'San Martín', sup: 'sup_evelyn' },
    { id: 't_san_miguel', name: 'San Miguel', sup: 'sup_evelyn' },
    { id: 't_villa_urquiza', name: 'Villa Urquiza', sup: 'sup_evelyn' },

    // Tiendas Propias de Mi Gusto (1 supervisora dedicada por tienda)
    { id: 't_canitas', name: 'Cañitas', sup: 'sup_selene', isPropia: true, isExperience: true },
    { id: 't_villa_crespo', name: 'Villa Crespo', sup: 'sup_sasha', isPropia: true },
    { id: 't_vicente_lopez', name: 'Vicente López', sup: 'sup_martin', isPropia: true, isExperience: true },
  ],
};

export const api = {
  // Config: supervisoras & tiendas
  async getConfig() {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('mg_config')
          .select('data')
          .eq('id', 'estructura')
          .single();
        if (data && data.data) {
          return {
            ...INITIAL_CONFIG,
            ...data.data,
            globalCargaSupervisorId: data.data.globalCargaSupervisorId || 'none',
          };
        }
        if (error && error.code !== 'PGRST116') {
          console.warn('Error fetching config from Supabase, falling back to local:', error);
        }
      } catch (err) {
        console.warn('Supabase fetch failed:', err);
      }
    }

    const local = localStorage.getItem(LS_CONFIG_KEY);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        return {
          ...INITIAL_CONFIG,
          ...parsed,
          globalCargaSupervisorId: parsed.globalCargaSupervisorId || 'none',
        };
      } catch (e) {}
    }

    // Default init
    localStorage.setItem(LS_CONFIG_KEY, JSON.stringify(INITIAL_CONFIG));
    return INITIAL_CONFIG;
  },

  async saveConfig(nextConfig) {
    localStorage.setItem(LS_CONFIG_KEY, JSON.stringify(nextConfig));
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('mg_config')
          .upsert({ id: 'estructura', data: nextConfig, updated_at: new Date().toISOString() });
      } catch (err) {
        console.error('Failed to sync config with Supabase:', err);
      }
    }
    return nextConfig;
  },

  // Cargas del día
  async getCargasDia(fecha) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('mg_cargas')
          .select('*')
          .eq('fecha', fecha);
        if (!error && Array.isArray(data)) {
          const map = {};
          data.forEach((row) => {
            map[row.tienda_id] = {
              id: row.id,
              tiendaId: row.tienda_id,
              tiendaNombre: row.tienda_nombre,
              supervisoraId: row.supervisora_id,
              supervisoraNombre: row.supervisora_nombre,
              fecha: row.fecha,
              mes: row.mes,
              comandas: Number(row.comandas),
              venta: Number(row.venta),
              unidades: Number(row.unidades),
              ticketPromedio: row.ticket_promedio,
              unidadesPorComanda: row.unidades_por_comanda,
            };
          });
          return map;
        }
      } catch (e) {
        console.warn('Supabase getCargasDia error, using local fallback:', e);
      }
    }

    const localRaw = localStorage.getItem(LS_CARGAS_KEY);
    const all = localRaw ? JSON.parse(localRaw) : [];
    const diaRows = all.filter((r) => r.fecha === fecha);
    const map = {};
    diaRows.forEach((r) => {
      map[r.tiendaId] = r;
    });
    return map;
  },

  // Guardar múltiples cargas del día
  async saveCargasDia(items) {
    const supabase = getSupabase();
    
    // 1. Guardar localmente
    const localRaw = localStorage.getItem(LS_CARGAS_KEY);
    let all = localRaw ? JSON.parse(localRaw) : [];
    
    items.forEach((item) => {
      const idx = all.findIndex((x) => x.tiendaId === item.tiendaId && x.fecha === item.fecha);
      if (idx >= 0) {
        all[idx] = { ...all[idx], ...item };
      } else {
        all.push(item);
      }
    });
    localStorage.setItem(LS_CARGAS_KEY, JSON.stringify(all));

    // 2. Guardar en Supabase si está disponible
    if (supabase) {
      const rows = items.map((r) => ({
        id: `${r.tiendaId}_${r.fecha}`,
        tienda_id: r.tiendaId,
        tienda_nombre: r.tiendaNombre,
        supervisora_id: r.supervisoraId || '',
        supervisora_nombre: r.supervisoraNombre || '',
        fecha: r.fecha,
        mes: r.fecha.slice(0, 7),
        comandas: r.comandas,
        venta: r.venta,
        unidades: r.unidades,
        ticket_promedio: r.comandas > 0 ? Math.round((r.venta / r.comandas) * 100) / 100 : null,
        unidades_por_comanda: r.comandas > 0 ? Math.round((r.unidades / r.comandas) * 100) / 100 : null,
        cargado_en: r.cargadoEn || new Date().toISOString(),
        cargado_por: r.cargadoPor || null,
        modificado_por: r.modificadoPor || null,
        modificado_en: r.modificadoEn || null,
      }));

      const { error } = await supabase.from('mg_cargas').upsert(rows);
      if (error) {
        console.error('Supabase upsert error:', error);
        throw error;
      }
    }

    return true;
  },

  // Helper para consultar todas las filas con paginación Range (evita el tope de 1000 registros por query de Supabase)
  async _fetchAllSupabaseRows(buildQuery) {
    const PAGE_SIZE = 1000;
    let allData = [];
    let from = 0;

    while (true) {
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await buildQuery().range(from, to);
      if (error) {
        throw error;
      }
      if (!Array.isArray(data) || data.length === 0) {
        break;
      }
      allData = allData.concat(data);
      if (data.length < PAGE_SIZE) {
        break;
      }
      from += PAGE_SIZE;
    }
    return allData;
  },

  // Cargas del mes
  async getCargasMes(mes) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const data = await this._fetchAllSupabaseRows(() =>
          supabase
            .from('mg_cargas')
            .select('*')
            .eq('mes', mes)
        );

        if (Array.isArray(data)) {
          return data.map((row) => ({
            id: row.id,
            tiendaId: row.tienda_id,
            tiendaNombre: row.tienda_nombre,
            supervisoraId: row.supervisora_id,
            supervisoraNombre: row.supervisora_nombre,
            fecha: row.fecha,
            mes: row.mes,
            comandas: Number(row.comandas),
            venta: Number(row.venta),
            unidades: Number(row.unidades),
            ticketPromedio: row.ticket_promedio,
            unidadesPorComanda: row.unidades_por_comanda,
            cargadoEn: row.cargado_en,
            cargadoPor: row.cargado_por,
            modificadoPor: row.modificado_por,
            modificadoEn: row.modificado_en,
          }));
        }
      } catch (e) {
        console.warn('Supabase getCargasMes error, using local fallback:', e);
      }
    }

    const localRaw = localStorage.getItem(LS_CARGAS_KEY);
    const all = localRaw ? JSON.parse(localRaw) : [];
    return all.filter((r) => r.fecha && r.fecha.startsWith(mes));
  },

  // Cargas por rango de fechas (desde - hasta en formato YYYY-MM-DD)
  async getCargasRango(fechaDesde, fechaHasta) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const data = await this._fetchAllSupabaseRows(() =>
          supabase
            .from('mg_cargas')
            .select('*')
            .gte('fecha', fechaDesde)
            .lte('fecha', fechaHasta)
            .order('fecha', { ascending: false })
        );

        if (Array.isArray(data)) {
          return data.map((row) => ({
            id: row.id,
            tiendaId: row.tienda_id,
            tiendaNombre: row.tienda_nombre,
            supervisoraId: row.supervisora_id,
            supervisoraNombre: row.supervisora_nombre,
            fecha: row.fecha,
            mes: row.mes,
            comandas: Number(row.comandas),
            venta: Number(row.venta),
            unidades: Number(row.unidades),
            ticketPromedio: row.ticket_promedio,
            unidadesPorComanda: row.unidades_por_comanda,
            cargadoEn: row.cargado_en,
            cargadoPor: row.cargado_por,
            modificadoPor: row.modificado_por,
            modificadoEn: row.modificado_en,
          }));
        }
      } catch (e) {
        console.warn('Supabase getCargasRango error, using local fallback:', e);
      }
    }

    const localRaw = localStorage.getItem(LS_CARGAS_KEY);
    const all = localRaw ? JSON.parse(localRaw) : [];
    return all.filter((r) => r.fecha && r.fecha >= fechaDesde && r.fecha <= fechaHasta);
  },

  // Obtener todas las cargas registradas (para historial administrativo)
  async getAllCargas() {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const data = await this._fetchAllSupabaseRows(() =>
          supabase
            .from('mg_cargas')
            .select('*')
            .order('fecha', { ascending: false })
            .order('tienda_nombre', { ascending: true })
        );

        if (Array.isArray(data)) {
          return data.map((row) => ({
            id: row.id,
            tiendaId: row.tienda_id,
            tiendaNombre: row.tienda_nombre,
            supervisoraId: row.supervisora_id,
            supervisoraNombre: row.supervisora_nombre,
            fecha: row.fecha,
            mes: row.mes,
            comandas: Number(row.comandas),
            venta: Number(row.venta),
            unidades: Number(row.unidades),
            ticketPromedio: row.ticket_promedio,
            unidadesPorComanda: row.unidades_por_comanda,
            cargadoEn: row.cargado_en,
            cargadoPor: row.cargado_por,
            modificadoPor: row.modificado_por,
            modificadoEn: row.modificado_en,
          }));
        }
      } catch (e) {
        console.warn('Supabase getAllCargas error, using local fallback:', e);
      }
    }

    const localRaw = localStorage.getItem(LS_CARGAS_KEY);
    const all = localRaw ? JSON.parse(localRaw) : [];
    return all.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  },

  // Eliminar un registro individual de carga
  async deleteCargaRecord(id, tiendaId, fecha) {
    const targetId = id || `${tiendaId}_${fecha}`;
    const supabase = getSupabase();

    // 1. Eliminar localmente
    const localRaw = localStorage.getItem(LS_CARGAS_KEY);
    if (localRaw) {
      try {
        const all = JSON.parse(localRaw);
        const filtered = all.filter((x) => {
          if (x.id && targetId) return x.id !== targetId;
          return !(x.tiendaId === tiendaId && x.fecha === fecha);
        });
        localStorage.setItem(LS_CARGAS_KEY, JSON.stringify(filtered));
      } catch (e) {
        console.warn('Error deleting local carga record:', e);
      }
    }

    // 2. Eliminar en Supabase
    if (supabase) {
      try {
        const { error } = await supabase
          .from('mg_cargas')
          .delete()
          .eq('id', targetId);
        if (error) {
          console.error('Supabase deleteCargaRecord error:', error);
          throw error;
        }
      } catch (err) {
        console.error('Failed to delete carga from Supabase:', err);
        throw err;
      }
    }

    return true;
  },

  // Planificación de supervisoras
  async getPlanesSemana(semana) {
    const supabase = getSupabase();
    const LS_PLANES_KEY = `mg_planes_${semana}`;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('mg_planes')
          .select('*')
          .eq('semana', semana);

        if (!error && Array.isArray(data)) {
          const map = {};
          data.forEach((row) => {
            const plan = typeof row.data === 'string' ? JSON.parse(row.data) : row.data || row;
            map[plan.supId || row.sup_id] = plan;
          });
          // Cache locally
          localStorage.setItem(LS_PLANES_KEY, JSON.stringify(map));
          return map;
        }
      } catch (err) {
        console.warn('Supabase getPlanesSemana error, fallback to local:', err);
      }
    }

    const localRaw = localStorage.getItem(LS_PLANES_KEY);
    if (localRaw) {
      try {
        return JSON.parse(localRaw);
      } catch (e) {}
    }
    return {};
  },

  async savePlan(supId, semana, planData, updatedBy) {
    const key = `${supId}_${semana}`;
    const LS_PLANES_KEY = `mg_planes_${semana}`;
    const payload = {
      ...planData,
      supId,
      semana,
      actualizado: new Date().toISOString(),
      actualizadoPor: updatedBy || '',
    };

    // 1. Guardar local
    try {
      const localRaw = localStorage.getItem(LS_PLANES_KEY);
      const current = localRaw ? JSON.parse(localRaw) : {};
      current[supId] = payload;
      localStorage.setItem(LS_PLANES_KEY, JSON.stringify(current));
    } catch (e) {
      console.warn('Error saving plan locally:', e);
    }

    // 2. Guardar en Supabase (mg_planes o mg_config fallback)
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('mg_planes')
          .upsert({
            id: key,
            sup_id: supId,
            semana,
            data: payload,
            updated_at: new Date().toISOString(),
          });
        if (error) {
          // Intentar guardar en mg_config como respaldo si mg_planes no existe aún
          await supabase.from('mg_config').upsert({
            id: `plan_${key}`,
            data: payload,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Failed to sync plan with Supabase, saved locally:', err);
      }
    }

    return payload;
  },

  // Sincronizar automáticamente datos guardados localmente offline hacia Supabase
  async syncLocalDataToSupabase() {
    const supabase = getSupabase();
    if (!supabase) return { syncedCargas: 0, syncedPlanes: 0 };

    let syncedCargas = 0;
    let syncedPlanes = 0;

    // 1. Sincronizar cargas guardadas en localStorage (mg_local_cargas)
    try {
      const localRaw = localStorage.getItem(LS_CARGAS_KEY);
      const localItems = localRaw ? JSON.parse(localRaw) : [];
      if (Array.isArray(localItems) && localItems.length > 0) {
        // Filtrar elementos válidos que tengan fecha y tiendaId
        const validItems = localItems.filter((r) => r.tiendaId && r.fecha);
        if (validItems.length > 0) {
          const rows = validItems.map((r) => ({
            id: r.id || `${r.tiendaId}_${r.fecha}`,
            tienda_id: r.tiendaId,
            tienda_nombre: r.tiendaNombre || '',
            supervisora_id: r.supervisoraId || '',
            supervisora_nombre: r.supervisoraNombre || '',
            fecha: r.fecha,
            mes: r.fecha.slice(0, 7),
            comandas: Number(r.comandas) || 0,
            venta: Number(r.venta) || 0,
            unidades: Number(r.unidades) || 0,
            ticket_promedio: r.comandas > 0 ? Math.round((Number(r.venta) / Number(r.comandas)) * 100) / 100 : null,
            unidades_por_comanda: r.comandas > 0 ? Math.round((Number(r.unidades) / Number(r.comandas)) * 100) / 100 : null,
            cargado_en: r.cargadoEn || new Date().toISOString(),
            cargado_por: r.cargadoPor || null,
            modificado_por: r.modificadoPor || null,
            modificado_en: r.modificadoEn || null,
          }));

          // Upsert en lotes de hasta 100
          for (let i = 0; i < rows.length; i += 100) {
            const batch = rows.slice(i, i + 100);
            const { error } = await supabase.from('mg_cargas').upsert(batch);
            if (!error) {
              syncedCargas += batch.length;
            } else {
              console.warn('Sync batch error on mg_cargas:', error);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error syncing local cargas to Supabase:', e);
    }

    // 2. Sincronizar planes semanales guardados en localStorage (mg_planes_YYYY-MM-DD)
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('mg_planes_')) {
          const semana = key.replace('mg_planes_', '');
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const plansMap = JSON.parse(raw);
              for (const [supId, planData] of Object.entries(plansMap)) {
                if (planData && typeof planData === 'object') {
                  const planId = `${supId}_${semana}`;
                  const { error } = await supabase.from('mg_planes').upsert({
                    id: planId,
                    sup_id: supId,
                    semana,
                    data: planData,
                    updated_at: planData.actualizado || new Date().toISOString(),
                  });
                  if (!error) syncedPlanes++;
                }
              }
            } catch (err) {}
          }
        }
      }
    } catch (e) {
      console.warn('Error syncing local planes to Supabase:', e);
    }

    if (syncedCargas > 0 || syncedPlanes > 0) {
      console.info(`[AutoSync] Sincronizados con éxito: ${syncedCargas} cargas y ${syncedPlanes} planes.`);
    }

    return { syncedCargas, syncedPlanes };
  },
};

