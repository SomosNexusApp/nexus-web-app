import { Usuario } from './usuario.model';
import { Empresa } from './empresa.model';
import { Categoria } from './categoria.model';

export type BadgeOferta =
  | 'CHOLLAZO'
  | 'DESTACADA'
  | 'NUEVA'
  | 'EXPIRA_HOY'
  | 'PORCENTAJE'
  | 'GRATUITA';

export interface Oferta {
  id: number;
  titulo: string;
  descripcion?: string;
  precioOferta: number;
  precioOriginal?: number;
  tienda?: string;
  urlOferta?: string;
  categoria?: Categoria;
  imagenPrincipal?: string;
  galeriaImagenes?: string[];
  actor?: Usuario | Empresa;
  esActiva: boolean;
  badge?: BadgeOferta;
  fechaPublicacion?: string;
  fechaExpiracion?: string;
  sparkCount: number;
  dripCount: number;
  sparkScore: number;
  numeroVistas: number;
  numeroCompartidos: number;
  numeroComentarios: number;
  codigoDescuento?: string;
  esOnline: boolean;
  ciudadOferta?: string;
  gastosEnvio?: number;
  miVoto?: boolean | null;
  estado?: 'ACTIVA' | 'PAUSADA' | 'AGOTADA' | 'ELIMINADA';
  diasRestantesAgotado?: number;
}
