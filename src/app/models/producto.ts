import { Usuario } from './actor';

export enum TipoOferta {
  VENTA = 'VENTA',
  INTERCAMBIO = 'INTERCAMBIO',
  SUBASTA = 'SUBASTA'
}

export enum EstadoProducto {
  DISPONIBLE = 'DISPONIBLE',
  RESERVADO = 'RESERVADO',
  VENDIDO = 'VENDIDO'
}

export interface Producto {
  id: number;
  titulo: string;
  descripcion: string;
  precio: number;
  tipoOferta: TipoOferta;
  estadoProducto: EstadoProducto;
  publicador: Usuario; // Relación ManyToOne con Usuario
  // NOTA: Tu backend no tiene campo imagenUrl en Producto, lo gestionaremos en el frontend
}