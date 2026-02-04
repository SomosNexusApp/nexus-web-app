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
  imagenPrincipal: string; // URL de Cloudinary - OBLIGATORIO
  galeriaImagenes?: string[]; // Array de URLs de Cloudinary - OPCIONAL (max 5)
  publicador: Usuario;
  fechaPublicacion?: string;
  categoria?: string;
}

// DTOs para crear/actualizar productos
export interface ProductoCreateDTO {
  titulo: string;
  descripcion: string;
  precio: number;
  tipoOferta: TipoOferta;
  categoria?: string;
}

export interface ProductoUpdateDTO {
  titulo?: string;
  descripcion?: string;
  precio?: number;
  tipoOferta?: TipoOferta;
  estadoProducto?: EstadoProducto;
  categoria?: string;
}