import { Producto } from './producto';
import { Oferta } from './oferta';

// Union type para manejar tanto Productos como Ofertas en el feed
export type NexusItem = Producto | Oferta;

// Type guards para distinguir entre Producto y Oferta
export function isProducto(item: NexusItem): item is Producto {
  return (item as Producto).publicador !== undefined;
}

export function isOferta(item: NexusItem): item is Oferta {
  return (item as Oferta).precioOferta !== undefined;
}

// Helper para obtener el precio de cualquier item
export function getPrecio(item: NexusItem): number {
  return isOferta(item) ? item.precioOferta : (item as Producto).precio;
}

// Helper para obtener la imagen principal
export function getImagenPrincipal(item: NexusItem): string {
  return item.imagenPrincipal || 'assets/placeholder.jpg';
}