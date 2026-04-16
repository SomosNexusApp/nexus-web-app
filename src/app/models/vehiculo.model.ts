import { Usuario } from './usuario.model';
import { Empresa } from './empresa.model';
import { Categoria } from './categoria.model';
import { TipoOferta, CondicionProducto } from './producto.model';

export type TipoVehiculo = 'COCHE' | 'MOTO' | 'FURGONETA' | 'SCOOTER' | 'OTRO';
export type EstadoVehiculo = 'DISPONIBLE' | 'RESERVADO' | 'VENDIDO' | 'EXPIRADO' | 'PAUSADO' | 'ELIMINADO';

export interface Vehiculo {
  id: number;
  titulo: string;
  descripcion: string;
  precio: number;
  tipoOferta: TipoOferta;
  tipoVehiculo: TipoVehiculo;
  estadoVehiculo: EstadoVehiculo;
  condicion?: CondicionProducto;
  categoria?: Categoria;
  marca?: string;
  modelo?: string;
  anio?: number;
  kilometros?: number;
  combustible?: string;
  cambio?: string;
  potencia?: number;
  cilindrada?: number;
  color?: string;
  numeroPuertas?: number;
  plazas?: number;
  matricula?: string;
  itv?: boolean;
  fechaITV?: string;
  garantia?: boolean;
  ubicacion?: string;
  imagenPrincipal?: string;
  galeriaImagenes?: string[];
  publicador?: Usuario | Empresa;
  fechaPublicacion?: string;
  fechaCaducidad?: string;
  diasRestantesExpirado?: number;
}
