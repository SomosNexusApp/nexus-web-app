export enum BadgeOferta {
  LEGENDARY = 'LEGENDARY',
  FIRE = 'FIRE',
  HOT = 'HOT',
  TRENDING = 'TRENDING',
  NORMAL = 'NORMAL',
  EXPIRED = 'EXPIRED'
}

export interface Oferta {
  id: number;
  titulo: string;
  descripcion: string;
  tienda: string;
  precioOriginal: number;
  precioOferta: number;
  urlOferta: string; // ← URL externa (Amazon, etc.)
  imagenPrincipal: string;
  galeriaImagenes?: string[];
  fechaExpiracion?: string;
  fechaPublicacion?: string;
  categoria?: string;
  esActiva?: boolean;
  
  // Sistema Spark
  sparkCount?: number;
  dripCount?: number;
  numeroComentarios?: number;
  numeroVistas?: number;
  numeroCompartidos?: number;
  badge?: BadgeOferta;
  
  // Relaciones
  actor?: any;
}

export interface OfertaCreateDTO {
  titulo: string;
  descripcion: string;
  tienda: string;
  precioOriginal: number;
  precioOferta: number;
  urlOferta: string;
  fechaExpiracion?: string;
  categoria?: string;
}

export interface FiltroOfertaDTO {
  categoria?: string;
  tienda?: string;
  precioMinimo?: number;
  precioMaximo?: number;
  descuentoMinimo?: number;
  soloActivas?: boolean;
  badge?: BadgeOferta;
  ordenarPor?: 'spark' | 'precio' | 'descuento' | 'fecha';
  orden?: 'asc' | 'desc';
  busqueda?: string;
  pagina?: number;
  elementosPorPagina?: number;
}