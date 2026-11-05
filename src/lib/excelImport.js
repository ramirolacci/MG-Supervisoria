import * as XLSX from 'xlsx';
import { formatMoneyInput, formatThousands } from './formatters.js';

/**
 * Normaliza cadenas de texto para comparación flexible:
 * - minúsculas
 * - sin acentos / diacríticos
 * - remueve palabras vacías comunes como "sucursal", "tienda", "local", "mg", "mi gusto"
 * - limpia signos y espacios múltiples
 */
export function normalizeStoreName(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(sucursal|tienda|local|mg|mi gusto)\b/gi, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Mapa de alias conocidos para variantes frecuentes que vienen de reportes de ventas
 */
const KNOWN_ALIASES = {
  'pilar cruce derqui': 'pilar derqui',
  'cruce derqui': 'pilar derqui',
  'derqui': 'pilar derqui',
  'pilar palmas': 'pilar derqui',
  'barrancas': 'barrancas de belgrano',
  'barrancas belgrano': 'barrancas de belgrano',
  'caballitos': 'caballito',
  'pacheco': 'general pacheco',
  'gral pacheco': 'general pacheco',
  'polvorines': 'los polvorines',
  'canitas': 'canitas',
  'las canitas': 'canitas',
  'vicente lopez': 'vicente lopez',
  'v lopez': 'vicente lopez',
  'villa adelina': 'villa adelina',
  'v adelina': 'villa adelina',
  'villa crespo': 'villa crespo',
  'v crespo': 'villa crespo',
  'villa urquiza': 'villa urquiza',
  'v urquiza': 'villa urquiza',
  'jose c paz': 'jose c paz',
  'j c paz': 'jose c paz',
  'san martin': 'san martin',
  'san fernando': 'san fernando',
  'san miguel': 'san miguel',
  'puerto madero': 'puerto madero',
  'p madero': 'puerto madero',
  'madero': 'puerto madero',
  'don torcuato': 'don torcuato',
  'd torcuato': 'don torcuato',
  'del viso': 'del viso',
  'd viso': 'del viso',
};

const IGNORE_PATTERNS = /^(producto|id|codigo|total|totales|eventos|sucursal mas cercana)$/i;

/**
 * Empareja un nombre de sucursal del Excel con la lista de tiendas del sistema
 */
export function findStoreMatch(rawName, stores) {
  if (!rawName || !Array.isArray(stores)) return null;

  const rawStr = String(rawName).trim();
  // Ignorar filas o columnas marcadas como viejas o cerradas
  if (/cerrad/i.test(rawStr) || /viejo/i.test(rawStr)) return null;

  let norm = normalizeStoreName(rawStr);
  if (!norm || IGNORE_PATTERNS.test(norm)) return null;

  // 1. Verificar si tiene alias explícito
  if (KNOWN_ALIASES[norm]) {
    norm = KNOWN_ALIASES[norm];
  }

  // 2. Coincidencia exacta con nombre normalizado
  let found = stores.find((s) => normalizeStoreName(s.name) === norm);
  if (found) return found;

  // 3. Coincidencia exacta con ID (ej: t_ballester)
  found = stores.find((s) => normalizeStoreName(s.id) === norm);
  if (found) return found;

  // 4. Token match (lógica de María para nombres con palabras clave)
  const tok = (x) => x.split(' ').filter((w) => w && !['de', 'la', 'los', 'las', 'el'].includes(w));
  const b = tok(norm);
  const cand = stores.filter((t) => {
    const a = tok(normalizeStoreName(t.name));
    return a.length && b.length && (a.every((x) => b.includes(x)) || b.every((x) => a.includes(x)));
  });
  if (cand.length === 1) return cand[0];

  return null;
}

/**
 * Parsea comandas y unidades a entero
 */
export function parseCount(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return Math.round(val);
  const s = String(val).replace(/[^0-9]/g, '');
  if (!s) return null;
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}

/**
 * Parsea el valor monetario a float respetando formato argentino o anglosajón
 */
export function parseMoney(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number') {
    return Math.round(raw * 100) / 100;
  }
  let s = String(raw).replace(/[\s$]/g, '');
  if (!s) return null;

  if (s.includes('.') && s.includes(',')) {
    const lastDot = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');
    if (lastComma > lastDot) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (s.includes(',')) {
    const commaCount = (s.match(/,/g) || []).length;
    if (commaCount === 1) {
      s = s.replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (s.includes('.')) {
    const parts = s.split('.');
    if (parts.length === 2 && parts[1].length !== 3) {
      // decimal
    } else {
      s = s.replace(/\./g, '');
    }
  }

  const n = parseFloat(s);
  return isNaN(n) ? null : Math.round(n * 100) / 100;
}

/**
 * Procesa un solo archivo (ArrayBuffer) y vuelca sus datos en el storeDataMap acumulativo
 */
function processSingleWorkbook({ name, size, buffer }, allStores, storeDataMap, skippedSet, detectedDatesSet) {
  // Detección especial si el archivo es un Frameset HTML (guardado como página web con carpeta _archivos)
  const textPreview = new TextDecoder('utf-8', { fatal: false }).decode(buffer.slice(0, 4000));
  const isFrameset = /Excel\s+Workbook\s+Frameset|<frameset|<frame\s+src=/i.test(textPreview);

  if (isFrameset) {
    const match = textPreview.match(/href=["']([^"']+\.htm[l]?)["']|src=["']([^"']+\.htm[l]?)["']/i);
    const referencedSheet = match ? (match[1] || match[2]) : 'sheet001.htm';
    const cleanSheetName = referencedSheet.split('/').pop() || 'sheet001.htm';

    throw new Error(
      `El archivo "${name}" fue guardado en Excel como "Página web" y los datos reales están en la subcarpeta ("${cleanSheetName}"). ` +
      `Podés arrastrar directamente ese archivo "${cleanSheetName}" aquí, o en Excel elegir Archivo ➔ Guardar como ➔ "Libro de Excel (*.xlsx)".`
    );
  }

  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: 'array' });
  } catch (err) {
    // Fallback: tratar como texto html/string
    workbook = XLSX.read(textPreview, { type: 'string' });
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error(`El archivo "${name}" no contiene ninguna hoja con datos.`);
  }

  let fileDetectedMetric = [];
  let fileMatchedCount = 0;

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!aoa || aoa.length === 0) return;

    // Detectar si el texto contiene una fecha DD/MM/AAAA o AAAA-MM-DD
    const previewHeader = aoa.slice(0, 8).flat().join(' ');
    const dm = previewHeader.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](20\d\d)\b/);
    if (dm) {
      detectedDatesSet.add(`${dm[3]}-${String(dm[2]).padStart(2, '0')}-${String(dm[1]).padStart(2, '0')}`);
    }

    // =========================================================================
    // CASO A: REPORTE POR PRODUCTOS (MATRIZ) - Sucursales en las columnas
    // =========================================================================
    let matrixHeaderRow = -1;
    let matrixCols = [];

    for (let r = 0; r < Math.min(aoa.length, 15); r++) {
      const row = aoa[r];
      if (!Array.isArray(row)) continue;

      const matches = row
        .map((cell, cIdx) => [cIdx, cell, findStoreMatch(cell, allStores)])
        .filter((x) => x[2]);

      // Si al menos 3 columnas coinciden con tiendas de la lista, es formato Matriz de Productos
      if (matches.length >= 3) {
        matrixHeaderRow = r;
        matrixCols = matches;
        break;
      }
    }

    if (matrixHeaderRow >= 0) {
      if (!fileDetectedMetric.includes('Unidades')) fileDetectedMetric.push('Unidades');

      // Registrar columnas no reconocidas
      aoa[matrixHeaderRow].forEach((c, idx) => {
        if (idx < 2) return;
        const raw = String(c || '').trim();
        if (raw && !findStoreMatch(raw, allStores) && !IGNORE_PATTERNS.test(normalizeStoreName(raw)) && !/viejo|cerrad/i.test(raw)) {
          skippedSet.add(raw);
        }
      });

      const bodyRows = aoa.slice(matrixHeaderRow + 1);
      // Tomar las filas "TOTAL" (ej: TOTAL EMPANADAS, TOTAL SIN TAB) excluyendo "TOTAL FINAL"
      const totRows = bodyRows.filter(
        (r) => /^total\b/i.test(String(r[0] || '').trim()) && !/^total (final|general)$/i.test(String(r[0] || '').trim())
      );
      // Si no hay fila de totales por categoría, sumar todos los productos excluyendo totales
      const useRows = totRows.length > 0
        ? totRows
        : bodyRows.filter((r) => !/^total/i.test(String(r[0] || '').trim()) && String(r[0] || '').trim() !== '');

      matrixCols.forEach(([cIdx, rawHeader, store]) => {
        let totalUnits = 0;
        let hasData = false;

        useRows.forEach((r) => {
          const raw = r[cIdx];
          if (raw !== '' && raw !== null && raw !== undefined) {
            const val = typeof raw === 'number' ? raw : parseCount(raw);
            if (val !== null && !isNaN(val)) {
              totalUnits += val;
              hasData = true;
            }
          }
        });

        if (hasData) {
          fileMatchedCount++;
          if (!storeDataMap.has(store.id)) {
            storeDataMap.set(store.id, {
              store,
              rawSucursal: String(rawHeader).trim(),
              comandas: null,
              venta: null,
              unidades: null,
              sources: new Set(),
            });
          }
          const entry = storeDataMap.get(store.id);
          entry.unidades = (entry.unidades || 0) + totalUnits;
          entry.sources.add(name);
        }
      });

      return; // procesada esta hoja
    }

    // =========================================================================
    // CASO B: REPORTE DE VENTAS (TABLA) - Sucursales en las filas
    // =========================================================================
    let headerRowIdx = -1;
    let colSucursal = -1;

    for (let r = 0; r < Math.min(aoa.length, 15); r++) {
      const row = aoa[r];
      if (!Array.isArray(row)) continue;
      const sIdx = row.findIndex((c) =>
        /^(sucursal|sucursales|local|locales|tienda|tiendas|punto)/i.test(String(c || '').trim())
      );
      if (sIdx >= 0) {
        headerRowIdx = r;
        colSucursal = sIdx;
        break;
      }
    }

    // Fallback si no hay cabecera explícita "SUCURSAL", buscar fila donde alguna celda sea una tienda
    if (colSucursal === -1) {
      for (let r = 0; r < Math.min(aoa.length, 25); r++) {
        const row = aoa[r];
        if (!Array.isArray(row)) continue;
        for (let c = 0; c < Math.min(row.length, 5); c++) {
          if (findStoreMatch(row[c], allStores)) {
            headerRowIdx = r - 1;
            colSucursal = c;
            break;
          }
        }
        if (colSucursal >= 0) break;
      }
    }

    if (colSucursal >= 0) {
      const headerRow = headerRowIdx >= 0 ? aoa[headerRowIdx] : [];
      let colComandas = -1;
      let colVentas = -1;
      let colUnidades = -1;

      headerRow.forEach((cell, idx) => {
        if (idx === colSucursal) return;
        const txt = String(cell || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        if (/comanda|ticket|pedido|orden|cmda/i.test(txt)) colComandas = idx;
        else if (/venta|importe|monto|factur|neto|\$/i.test(txt)) colVentas = idx;
        else if (/unidad|cantidad|cant|empanada|uds/i.test(txt)) colUnidades = idx;
      });

      if (colComandas !== -1 && !fileDetectedMetric.includes('Comandas')) fileDetectedMetric.push('Comandas');
      if (colVentas !== -1 && !fileDetectedMetric.includes('Ventas')) fileDetectedMetric.push('Ventas');
      if (colUnidades !== -1 && !fileDetectedMetric.includes('Unidades')) fileDetectedMetric.push('Unidades');

      const dataRows = aoa.slice(Math.max(0, headerRowIdx + 1));
      dataRows.forEach((row) => {
        if (!Array.isArray(row)) return;
        const rawSucursal = row[colSucursal];
        if (!rawSucursal) return;
        const rawStr = String(rawSucursal).trim();
        if (/^total/i.test(rawStr)) return;

        const store = findStoreMatch(rawStr, allStores);
        if (!store) {
          if (!IGNORE_PATTERNS.test(normalizeStoreName(rawStr)) && !/viejo|cerrad/i.test(rawStr)) {
            skippedSet.add(rawStr);
          }
          return;
        }

        fileMatchedCount++;
        if (!storeDataMap.has(store.id)) {
          storeDataMap.set(store.id, {
            store,
            rawSucursal: rawStr,
            comandas: null,
            venta: null,
            unidades: null,
            sources: new Set(),
          });
        }

        const entry = storeDataMap.get(store.id);
        entry.sources.add(name);

        if (colComandas !== -1 && row[colComandas] !== '' && row[colComandas] !== undefined) {
          const c = parseCount(row[colComandas]);
          if (c !== null) entry.comandas = c;
        }
        if (colVentas !== -1 && row[colVentas] !== '' && row[colVentas] !== undefined) {
          const v = parseMoney(row[colVentas]);
          if (v !== null) entry.venta = v;
        }
        if (colUnidades !== -1 && row[colUnidades] !== '' && row[colUnidades] !== undefined) {
          const u = parseCount(row[colUnidades]);
          if (u !== null) entry.unidades = u;
        }
      });
    }
  });

  return {
    fileName: name,
    fileSize: size,
    detectedMetric: fileDetectedMetric.length > 0 ? fileDetectedMetric.join(' + ') : 'General',
    matchedCount: fileMatchedCount,
  };
}

/**
 * Lee uno o varios archivos Excel (.xls, .xlsx, .csv, .htm) exportados de DataLive u otras planillas,
 * procesa tanto reportes por fila (Reporte de ventas) como por columna (Reporte por productos),
 * fusiona automáticamente sus métricas por sucursal y retorna el resultado unificado.
 *
 * @param {File|File[]} files - Uno o múltiples archivos File seleccionados o arrastrados
 * @param {Array} allStores - Lista completa de tiendas del sistema
 * @param {Set} activeStoreIds - Set de IDs de las tiendas activas para la supervisora / vista actual
 */
export async function parseExcelData(files, allStores = [], activeStoreIds = new Set()) {
  const fileArray = Array.isArray(files) ? files : [files];
  if (fileArray.length === 0) {
    throw new Error('No se seleccionó ningún archivo.');
  }

  const storeDataMap = new Map();
  const fileSummaries = [];
  const skippedSet = new Set();
  const detectedDatesSet = new Set();

  for (const file of fileArray) {
    const buffer = await file.arrayBuffer();
    const summary = processSingleWorkbook(
      { name: file.name, size: file.size, buffer },
      allStores,
      storeDataMap,
      skippedSet,
      detectedDatesSet
    );
    fileSummaries.push(summary);
  }

  if (storeDataMap.size === 0) {
    throw new Error(
      'No se encontraron sucursales de Mi Gusto en los archivos subidos. ' +
      'Verificá que el archivo contenga los nombres de las sucursales (ej: San Miguel, Pacheco, Ballester, etc.).'
    );
  }

  const matchedActive = [];
  const matchedOther = [];

  storeDataMap.forEach((entry) => {
    const comandas = entry.comandas;
    const venta = entry.venta;
    const unidades = entry.unidades;

    const item = {
      store: entry.store,
      rawSucursal: entry.rawSucursal,
      comandas: comandas ?? 0,
      venta: venta ?? 0,
      unidades: unidades ?? 0,
      hasComandas: comandas !== null,
      hasVenta: venta !== null,
      hasUnidades: unidades !== null,
      // Formateados para los inputs de carga
      rc: comandas !== null ? formatThousands(comandas) : '',
      rv: venta !== null ? formatMoneyInput(venta) : '',
      ru: unidades !== null ? formatThousands(unidades) : '',
      sources: Array.from(entry.sources),
    };

    if (activeStoreIds.has(entry.store.id)) {
      matchedActive.push(item);
    } else {
      matchedOther.push(item);
    }
  });

  // Ordenar alfabéticamente por nombre de tienda
  matchedActive.sort((a, b) => a.store.name.localeCompare(b.store.name));
  matchedOther.sort((a, b) => a.store.name.localeCompare(b.store.name));

  // Totales de lo que se aplicará a la vista activa
  const totalComandas = matchedActive.reduce((sum, r) => sum + r.comandas, 0);
  const totalVentas = matchedActive.reduce((sum, r) => sum + r.venta, 0);
  const totalUnidades = matchedActive.reduce((sum, r) => sum + r.unidades, 0);

  return {
    fileCount: fileArray.length,
    fileSummaries,
    fileName: fileArray.length === 1 ? fileArray[0].name : `${fileArray.length} archivos DataLive combinados`,
    fileSize: fileArray.reduce((acc, f) => acc + f.size, 0),
    matchedActive,
    matchedOther,
    skipped: Array.from(skippedSet),
    detectedDates: Array.from(detectedDatesSet),
    summary: {
      totalDetected: matchedActive.length + matchedOther.length,
      activeCount: matchedActive.length,
      otherCount: matchedOther.length,
      skippedCount: skippedSet.size,
      totalComandas,
      totalVentas,
      totalUnidades,
    },
  };
}
