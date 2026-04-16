import { Usuario } from './usuario.model';
import { Empresa } from './empresa.model';
import { Categoria } from './categoria.model';

export type TipoOferta = 'VENTA' | 'INTERCAMBIO' | 'DONACION';
export type CondicionProducto =
  | 'NUEVO'
  | 'COMO_NUEVO'
  | 'MUY_BUEN_ESTADO'
  | 'BUEN_ESTADO'
  | 'ACEPTABLE';
export type EstadoProducto = 'DISPONIBLE' | 'RESERVADO' | 'VENDIDO' | 'PAUSADO' | 'EXPIRADO' | 'ELIMINADO';

export interface Producto {
  id: number;
  titulo: string;
  descripcion: string;
  precio: number;
  tipoOferta: TipoOferta;
  estado: EstadoProducto;
  vendedor?: Usuario | Empresa;
  categoria?: Categoria;
  marca?: string;
  modelo?: string;
  talla?: string;
  color?: string;
  condicion?: CondicionProducto;
  imagenPrincipal?: string;
  galeriaImagenes?: string[];
  ubicacion?: string;
  admiteEnvio: boolean;
  precioEnvio?: number;
  precioNegociable: boolean;
  numeroVistas: number;
  numeroFavoritos: number;
  fechaPublicacion?: string;
  fechaActualizacion?: string;
  diasRestantesVendido?: number;
  diasRestantesExpirado?: number;
}
