import { Actor } from './actor';

export interface Oferta {
  id: number;
  titulo: string;
  descripcion: string;
  imagenPrincipal: string; // URL de Cloudinary - OBLIGATORIO (banner de la oferta)
  galeriaImagenes?: string[]; // Array de URLs de Cloudinary - OPCIONAL (max 4)
  tienda: string;
  precioOferta: number;
  precioOriginal: number;
  fechaExpiracion: string;
  urlOferta: string; // Link externo a la tienda
  actor: Actor; // Puede ser Usuario o Empresa
  fechaPublicacion?: string;
  categoria?: string;
  esActiva?: boolean;
}

// DTOs para crear/actualizar ofertas
export interface OfertaCreateDTO {
  titulo: string;
  descripcion: string;
  tienda: string;
  precioOferta: number;
  precioOriginal: number;
  fechaExpiracion: string;
  urlOferta: string;
  categoria?: string;
}

export interface OfertaUpdateDTO {
  titulo?: string;
  descripcion?: string;
  tienda?: string;
  precioOferta?: number;
  precioOriginal?: number;
  fechaExpiracion?: string;
  urlOferta?: string;
  categoria?: string;
}