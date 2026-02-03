export interface Actor {
  id: number;
  nombre?: string; // Asumo que Actor tiene nombre/usuario
  fotoPerfil?: string;
  ubicacion?: string;
  reputacion?: number;
}

export interface Usuario extends Actor {
  telefono?: string;
  esVerificado: boolean;
  biografia?: string;
}

export interface Empresa extends Actor {
  cif: string;
  razonSocial?: string;
}

export interface Producto {
  id: number;
  titulo: string;
  descripcion: string;
  precio: number;
  imagenUrl: string; // FOTO DEL PRODUCTO
  tipoOferta: 'INTERCAMBIO' | 'VENTA' | 'SUBASTA'; // Enum
  estadoProducto: 'DISPONIBLE' | 'VENDIDO' | 'RESERVADO'; // Enum
  publicador: Usuario;
  fechaPublicacion?: string; // Heredado de DomainEntity si lo tienes expuesto
}

export interface Oferta {
  id: number;
  titulo: string;
  descripcion: string;
  tienda: string;
  precioOriginal: number;
  precioOferta: number;
  urlOferta: string; // URL de la FOTO según tu comentario en Java
  fechaExpiracion: string;
  actor: Actor; // Puede ser Usuario o Empresa
}

// Interfaz auxiliar para que la tarjeta sepa pintar ambos
export type NexusItem = Producto | Oferta;