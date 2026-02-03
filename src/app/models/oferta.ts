import { Actor } from './actor';

export interface Oferta {
  id: number;
  urlOferta: string; // Esta hace de imagen y link en tu backend
  tienda: string;
  precioOferta: number;
  precioOriginal: number;
  fechaExpiracion: string;
  actor: Actor; // Puede ser Empresa o Usuario
}