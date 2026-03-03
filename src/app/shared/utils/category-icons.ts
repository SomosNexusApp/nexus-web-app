// src/app/shared/utils/category-icons.ts
// SVG path data — Lucide-compatible, viewBox="0 0 24 24", fill="none", stroke

const ICON_MAP: Record<string, string> = {
  // ── Tech & Electronics ──
  electronica:
    'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18',
  tecnologia:
    'M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6zm10 10v2m-4 2h8',
  informatica:
    'M12 3c-4.97 0-9 3.19-9 7s4.03 7 9 7c.46 0 .96-.04 1.4-.1L17 21v-3.49C19.37 16.04 21 13.66 21 11c0-3.87-4-8-9-8z',
  telefonia: 'M12 18h.01M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z',
  movil: 'M12 18h.01M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z',
  television:
    'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7zm8 13v-2m-4 2h8',
  tv: 'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7zm8 13v-2m-4 2h8',
  consola:
    'M6 11h4m2 0h4M9 9v4M19 9v4M5 4a2 2 0 0 0-2 2v7a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4V6a2 2 0 0 0-2-2H5z',
  // ── Gaming ── (gamepad icon: clearer shape)
  gaming:
    'M6 11h4m2 0h4M9 9v4M19 9v4M5 4a2 2 0 0 0-2 2v7a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4V6a2 2 0 0 0-2-2H5z',
  videojuegos:
    'M6 11h4m2 0h4M9 9v4M19 9v4M5 4a2 2 0 0 0-2 2v7a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4V6a2 2 0 0 0-2-2H5z',
  // ── Fashion ──
  moda: 'M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z',
  ropa: 'M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z',
  calzado: 'M2 16s0-8 6-8 6 8 6 8H2zm14-8s4 0 6 4v4h-6V8z',
  belleza: 'M9 3h1v11H9zm5 0h1v11h-1zm-7 7h9m-9 3h9M6 21a2 2 0 0 1-2-2V3h16v16a2 2 0 0 1-2 2H6z',
  perfume: 'M9 3h1v11H9zm5 0h1v11h-1zm-7 7h9m-9 3h9M6 21a2 2 0 0 1-2-2V3h16v16a2 2 0 0 1-2 2H6z',
  // ── Home ──
  hogar: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  casa: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  muebles: 'M2 4h20v5H2zm1 5h18v13H3zm4 0v13m10-13v13m-7-6h4',
  decoracion: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  electrodomesticos:
    'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm3 4v4m4-4v4m-7 4h10',
  // ── Sports ──
  deporte:
    'M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zm0 0c2.76 0 5-4.48 5-10S14.76 2 12 2s-5 4.48-5 10 2.24 10 5 10zm-10-10h20',
  deportes:
    'M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zm0 0c2.76 0 5-4.48 5-10S14.76 2 12 2s-5 4.48-5 10 2.24 10 5 10zm-10-10h20',
  fitness: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zm0 0v6',
  bicicleta:
    'M5 19a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm14 0a2 2 0 1 0-4 0 2 2 0 0 0 4 0zm-9-4h4l2-5H8l-2 5h4zm-5 0L7 8h4',
  // ── Vehicles ──
  vehiculos:
    'M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h11l5 5v5h-2M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0m10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0',
  coches:
    'M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h11l5 5v5h-2M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0m10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0',
  motos: 'M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0m10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0M3 7h3l3 6h8l2-5H8',
  // ── Books ──
  libros:
    'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
  // ── Music ──
  musica: 'M9 18V5l12-2v13 M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6m12-2a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  audio:
    'M3 18v-6a9 9 0 0 1 18 0v6 M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z',
  instrumentos: 'M9 18V5l12-2v13 M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  // ── Photography ──
  fotografia:
    'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  camara:
    'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  // ── Garden ──
  jardin: 'M12 22V12m0 0C12 7 7 5 2 5c5 0 10 2 10 7m0 0c0-5 5-7 10-7-5 0-10 2-10 7',
  // ── Pets ──
  mascotas:
    'M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.344-2.5M8 14v.5M16 14v.5M11.25 16.25h1.5L12 17l-.75-.75zM4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306',
  // ── Collectibles ──
  coleccionismo:
    'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  // ── Art ──
  arte: 'M2 13.5V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.5M2 13.5A2.5 2.5 0 0 1 4.5 11h15a2.5 2.5 0 0 1 0 5H4.5A2.5 2.5 0 0 1 2 13.5zM12 11V3m0 0L8 7m4-4 4 4',
  // ── Tools ──
  herramientas:
    'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
  bricolaje:
    'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
  // ── Toys ──
  juguetes: 'M15 7h2a5 5 0 0 1 0 10h-2m-6 0H7A5 5 0 0 1 7 7h2m-3 5h10',
  // ── Health ──
  salud: 'M22 12h-4l-3 9L9 3l-3 9H2',
  // ── Services / Other ──
  servicios: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  otros: 'M4 6h16M4 12h16M4 18h16',
};

const COLOR_MAP: Record<string, string> = {
  electronica: '#6366f1',
  tecnologia: '#3b82f6',
  informatica: '#0ea5e9',
  telefonia: '#8b5cf6',
  movil: '#8b5cf6',
  television: '#1d4ed8',
  tv: '#1d4ed8',
  consola: '#7c3aed',
  gaming: '#7c3aed',
  videojuegos: '#7c3aed',
  moda: '#ec4899',
  ropa: '#f472b6',
  calzado: '#f43f5e',
  belleza: '#e879f9',
  perfume: '#e879f9',
  hogar: '#f59e0b',
  casa: '#f59e0b',
  muebles: '#d97706',
  decoracion: '#ca8a04',
  electrodomesticos: '#b45309',
  deporte: '#22c55e',
  deportes: '#22c55e',
  fitness: '#10b981',
  bicicleta: '#16a34a',
  vehiculos: '#94a3b8',
  coches: '#64748b',
  motos: '#78716c',
  libros: '#a78bfa',
  musica: '#06b6d4',
  audio: '#0891b2',
  instrumentos: '#0284c7',
  fotografia: '#1d4ed8',
  camara: '#1d4ed8',
  jardin: '#84cc16',
  mascotas: '#fb923c',
  coleccionismo: '#fbbf24',
  arte: '#c084fc',
  herramientas: '#94a3b8',
  bricolaje: '#78716c',
  juguetes: '#f97316',
  salud: '#34d399',
  servicios: '#a8b4ff',
  otros: '#a8b4ff',
};

const ICON_DEFAULT = 'M4 6h16M4 12h16M4 18h16';
const COLOR_DEFAULT = '#a8b4ff';

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function getCategoryIconPath(slug: string): string {
  const n = normalize(slug);
  for (const [k, v] of Object.entries(ICON_MAP)) {
    if (n === k || n.startsWith(k) || k.startsWith(n)) return v;
  }
  // partial match fallback
  for (const [k, v] of Object.entries(ICON_MAP)) {
    if (n.includes(k) || k.includes(n)) return v;
  }
  return ICON_DEFAULT;
}

export function getCategoryColor(slug: string): string {
  const n = normalize(slug);
  for (const [k, v] of Object.entries(COLOR_MAP)) {
    if (n === k || n.startsWith(k) || k.startsWith(n)) return v;
  }
  for (const [k, v] of Object.entries(COLOR_MAP)) {
    if (n.includes(k) || k.includes(n)) return v;
  }
  return COLOR_DEFAULT;
}
