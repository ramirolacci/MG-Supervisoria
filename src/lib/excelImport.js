import * as XLSX from 'xlsx';
import { formatMoneyInput, formatThousands } from './formatters.js';

/**
 * Normaliza cadenas de texto para comparación flexible:
 * - minúsculas
 * - sin acentos / diacríticos
 * - remueve palabras vacías comunes como "sucursal", "tienda", "local"
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
  'barrancas': 'barrancas de belgrano',
  'barrancas belgrano': 'barrancas de belgrano',
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
  'don torcuato': 'don torcuato',
  'd torcuato': 'don torcuato',
  'del viso': 'del viso',
  'd viso': 'del viso',
};

/**
 * Empareja un nombre de sucursal del Excel con la lista de tiendas del sistema
 */
export function findStoreMatch(rawName, stores) {
  if (!rawName || !Array.isArray(stores)) return null;

  let norm = normalizeStoreName(rawName);
  if (!norm) return null;

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

  // 4. Subcadena contenida (ej: "Pilar Derqui" dentro de "Pilar Cruce Derqui")
  found = stores.find((s) => {
    const sNorm = normalizeStoreName(s.name);
    return norm.includes(sNorm) || sNorm.includes(norm);
  });
  if (found) return found;

  // 5. Coincidencia por palabras clave clave significativas (>= 4 letras)
  const normWords = norm.split(' ').filter((w) => w.length >= 4);
  if (normWords.length > 0) {
    found = stores.find((s) => {
      const sNorm = normalizeStoreName(s.name);
      return normWords.every((w) => sNorm.includes(w));
    });
    if (found) return found;
  }

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
 * Identifica qué fila es el encabezado y qué columna corresponde a cada campo
 */
export function detectHeaderColumns(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  for (let rIdx = 0; rIdx < Math.min(rows.length, 12); rIdx++) {
    const row = rows[rIdx];
    if (!Array.isArray(row)) continue;

    let colSucursal = -1;
    let colComandas = -1;
    let colVentas = -1;
    let colUnidades = -1;

    row.forEach((cell, cIdx) => {
      const txt = String(cell || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

      if (/^(sucursal|tienda|local|nombre|punto)/i.test(txt)) {
        colSucursal = cIdx;
      } else if (/^(comanda|comandas|tickets|ticket|cmda|cmdas)/i.test(txt)) {
        colComandas = cIdx;
      } else if (/^(venta|ventas|facturacion|importe|total)/i.test(txt)) {
        colVentas = cIdx;
      } else if (/^(unidad|unidades|empanada|empanadas|cant|cantidad)/i.test(txt)) {
        colUnidades = cIdx;
      }
    });

    // Si encontramos al menos sucursal y alguna de las métricas principales
    if (colSucursal !== -1 && (colComandas !== -1 || colVentas !== -1 || colUnidades !== -1)) {
      return {
        headerRowIndex: rIdx,
        columns: {
          sucursal: colSucursal,
          comandas: colComandas,
          ventas: colVentas,
          unidades: colUnidades,
        },
      };
    }
  }

  // Fallback si no hay cabecera explícita pero tiene 4 columnas clásicas [sucursal, comandas, ventas, unidades]
  return {
    headerRowIndex: 0,
    columns: { sucursal: 0, comandas: 1, ventas: 2, unidades: 3 },
  };
}

/**
 * Procesa un archivo Excel o CSV y devuelve el análisis de tiendas coincidentes
 */
export async function parseExcelData(file, allStores = [], activeStoreIds = new Set()) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target.result;

        // Detección especial si el archivo es un Frameset HTML (guardado como página web con carpeta _archivos)
        const textPreview = new TextDecoder('utf-8', { fatal: false }).decode(buffer.slice(0, 4000));
        const isFrameset = /Excel\s+Workbook\s+Frameset|<frameset|<frame\s+src=/i.test(textPreview);

        if (isFrameset) {
          const match = textPreview.match(/href=["']([^"']+\.htm[l]?)["']|src=["']([^"']+\.htm[l]?)["']/i);
          const referencedSheet = match ? (match[1] || match[2]) : 'sheet001.htm';
          const cleanSheetName = referencedSheet.split('/').pop() || 'sheet001.htm';

          throw new Error(
            `Este archivo fue guardado en Excel como "Página web" y los datos reales están en la subcarpeta ("${cleanSheetName}"). ` +
            `Podés arrastrar directamente ese archivo "${cleanSheetName}" aquí, o en Excel elegir Archivo ➔ Guardar como ➔ "Libro de Excel (*.xlsx)".`
          );
        }

        const workbook = XLSX.read(buffer, { type: 'array' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('El archivo no contiene ninguna hoja con datos.');
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

        if (!rawRows || rawRows.length === 0) {
          throw new Error('La planilla seleccionada no contiene filas o está vacía.');
        }

        const headerInfo = detectHeaderColumns(rawRows);
        if (!headerInfo) {
          throw new Error('No se pudieron detectar las columnas de SUCURSAL, COMANDAS, VENTAS o UNIDADES en el archivo.');
        }

        const { headerRowIndex, columns } = headerInfo;
        const dataRows = rawRows.slice(headerRowIndex + 1);

        const matchedActive = [];
        const matchedOther = [];
        const unmatched = [];

        dataRows.forEach((row, idx) => {
          if (!Array.isArray(row)) return;

          const rawSucursal = row[columns.sucursal];
          if (!rawSucursal || String(rawSucursal).trim() === '') return; // fila vacía

          const rawCmdas = columns.comandas !== -1 ? row[columns.comandas] : null;
          const rawVentas = columns.ventas !== -1 ? row[columns.ventas] : null;
          const rawUnid = columns.unidades !== -1 ? row[columns.unidades] : null;

          const store = findStoreMatch(rawSucursal, allStores);

          const comandas = parseCount(rawCmdas);
          const venta = parseMoney(rawVentas);
          const unidades = parseCount(rawUnid);

          const item = {
            rowNumber: headerRowIndex + 2 + idx,
            rawSucursal: String(rawSucursal).trim(),
            rawCmdas,
            rawVentas,
            rawUnid,
            comandas: comandas ?? 0,
            venta: venta ?? 0,
            unidades: unidades ?? 0,
            // Valores formateados listos para los inputs
            rc: comandas !== null ? formatThousands(comandas) : '',
            rv: venta !== null ? formatMoneyInput(venta) : '',
            ru: unidades !== null ? formatThousands(unidades) : '',
            store,
          };

          if (!store) {
            unmatched.push(item);
          } else if (activeStoreIds.has(store.id)) {
            matchedActive.push(item);
          } else {
            matchedOther.push(item);
          }
        });

        if (matchedActive.length === 0 && matchedOther.length === 0) {
          throw new Error(
            'No se encontraron sucursales de Mi Gusto en la planilla. Verificá que contenga los nombres de las sucursales (ej: San Miguel, Pacheco, Ballester, etc.).'
          );
        }

        // Totales de lo que se va a aplicar a la vista activa
        const totalComandas = matchedActive.reduce((sum, r) => sum + r.comandas, 0);
        const totalVentas = matchedActive.reduce((sum, r) => sum + r.venta, 0);
        const totalUnidades = matchedActive.reduce((sum, r) => sum + r.unidades, 0);

        resolve({
          fileName: file.name,
          fileSize: file.size,
          matchedActive,
          matchedOther,
          unmatched,
          summary: {
            totalDetected: matchedActive.length + matchedOther.length,
            activeCount: matchedActive.length,
            otherCount: matchedOther.length,
            unmatchedCount: unmatched.length,
            totalComandas,
            totalVentas,
            totalUnidades,
          },
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo en el navegador.'));
    };

    reader.readAsArrayBuffer(file);
  });
}
