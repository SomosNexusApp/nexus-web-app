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
  urlOferta: string;
  imagenPrincipal: string;
  galeriaImagenes?: string[];
  fechaExpiracion?: string;
  fechaPublicacion?: string;
  categoria?: string;
  esActiva?: boolean;
  
  // Sistema Spark
  sparkCount?: number;
  dripCount?: number;
  sparkScore?: number;
  numeroComentarios?: number;
  numeroVistas?: number;
  numeroCompartidos?: number;
  badge?: BadgeOferta;
  
  // Relaciones
  actor?: any;
}

export interface FiltroOferta {
  categoria?: string;
  tienda?: string;
  precioMinimo?: number;
  precioMaximo?: number;
  busqueda?: string;
  soloActivas?: boolean;
  ordenarPor?: 'spark' | 'precio' | 'fecha' | 'vistas';
  direccion?: 'asc' | 'desc';
  pagina?: number;
  tamañoPagina?: number;
}