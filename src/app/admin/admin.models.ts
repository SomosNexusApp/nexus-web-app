// ─── Admin Models ────────────────────────────────────────────────────────────

export interface AdminKpis {
  usuariosTotal: number;
  usuariosDelta: number;
  productosActivos: number;
  productosDelta: number;
  ofertasActivas: number;
  ofertasDelta: number;
  comprasHoy: number;
  comprasDelta: number;
  revenueMes: number;
  revenueDelta: number;
  reportesPendientes: number;
  reportesDelta: number;
}

export interface DiaValorDTO {
  dia: string;
  valor: number;
}

export interface CatValorDTO {
  categoria: string;
  valor: number;
}

export interface AdminUsuario {
  id: number;
  user: string;
  email: string;
  nombre?: string;
  apellidos?: string;
  avatar?: string;
  rol?: string;
  tipoCuenta?: string;
  esVerificado: boolean;
  cuentaVerificada: boolean;
  baneado: boolean;
  suspendidoHasta?: string;
  motivoSuspension?: string;
  motivoBan?: string;
  fechaRegistro?: string;
  totalVentas: number;
  reportesRecibidos: number;
  flagFraude: boolean;
  motivoFlag?: string;
  reputacion: number;
}

export interface AdminReporte {
  id: number;
  tipo: string;
  motivo: string;
  descripcion?: string;
  estado: string;
  fecha: string;
  reportador: { id: number; user: string; avatar?: string };
  actorDenunciado?: { id: number; user: string; avatar?: string };
  productoDenunciado?: { id: number; titulo: string; imagenPrincipal?: string };
  ofertaDenunciada?: { id: number; titulo: string };
  comentarioDenunciado?: { id: number; contenido: string };
  resolucion?: string;
  fechaResolucion?: string;
  notaInterna?: string;
}

export interface AdminDevolucion {
  id: number;
  estado: string;
  motivo: string;
  descripcion?: string;
  importeReembolso?: number;
  compra: {
    id: number;
    precioFinal: number;
    fechaCompra: string;
    comprador: { id: number; user: string; avatar?: string };
    producto: { id: number; titulo: string; imagenPrincipal?: string };
    vendedor?: { id: number; user: string; avatar?: string };
  };
  evidencias?: string[];
  fechaSolicitud?: string;
}

export interface AdminSancion {
  id: number;
  user: string;
  avatar?: string;
  tipo: 'SUSPENSION' | 'BAN';
  motivo: string;
  motivoLevantamiento?: string;
  adminQueSanciono?: string;
  fechaInicio?: string;
  fechaFin?: string;
  activo: boolean;
}

export interface AuditLogEntry {
  id: number;
  adminUser: string;
  accion: string;
  entidadTipo: string;
  entidadId?: number;
  detalle?: string;
  ip: string;
  timestamp: string;
}

export interface AdminHealth {
  version: string;
  uptime: string;
  status: 'UP' | 'DOWN' | 'DEGRADED';
}

export interface AdminFraudeFlag {
  id: number;
  user: string;
  avatar?: string;
  motivo: string;
  nReportes: number;
  nVentasFallidas: number;
  fechaPrimerFlag: string;
  estado: 'PENDIENTE' | 'REVISADO';
}

export interface AdminProductoSospechoso {
  id: number;
  titulo: string;
  imagenPrincipal?: string;
  precio: number;
  mediaPorCategoria: number;
  porcentajeBajoMedia: number;
  vendedor: { id: number; user: string };
  categoria: string;
}

export interface PagedResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
