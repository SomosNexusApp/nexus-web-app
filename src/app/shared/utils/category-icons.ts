// src/app/shared/utils/category-icons.ts
// SVG path data — Lucide-compatible, viewBox="0 0 24 24", fill="none", stroke

const ICON_MAP: Record<string, string> = {
  // Coincidencias con los identificadores del backend (PopulateDB)
  'cpu': 'M4 4h16v16H4V4zm0 5h16M4 15h16M9 4v16M15 4v16',
  'shirt': 'M20.38 3.46 16 2a4 4 0 0 0-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z',
  'home': 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  'car': 'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12.4V16c0 .6.4 1 1 1h2',
  'laptop': 'M2 16h20M2 16v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2M2 16V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10',
  'gamepad': 'M6 11h4m2 0h4M9 9v6M3 7h18a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z',
  'bicycle': 'M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zm0 0c2.76 0 5-4.48 5-10S14.76 2 12 2s-5 4.48-5 10 2.24 10 5 10zm-10-10h20',
  'book': 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
  'toy-brick': 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
  'building': 'M3 21h18M3 7v14M21 21V7M9 21V3h6v18',
  'archive': 'M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3m18 0v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8m18 0-9 6-9-6',
  
  // Subcategorías y fallbacks
  'smartphone': 'M12 18h.01M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z',
  'headphones': 'M3 18v-6a9 9 0 0 1 18 0v6 M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z',
  'tv': 'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7zm8 13v-2m-4 2h8',
  'camera': 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
};

const COLOR_DEFAULT = '#6366f1';
const ICON_DEFAULT = 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01';

export function getCategoryIconPath(icono: string | undefined, slug: string): string {
  // 1. Prioridad: Icono del backend
  if (icono && ICON_MAP[icono]) return ICON_MAP[icono];
  
  // 2. Fallback: Basado en el slug
  const cleanSlug = slug.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (ICON_MAP[cleanSlug]) return ICON_MAP[cleanSlug];
  
  return ICON_DEFAULT;
}

export function getCategoryColor(color: string | undefined): string {
  return color || COLOR_DEFAULT;
}
