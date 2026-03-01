import { Usuario } from './usuario.model';
import { Oferta } from './oferta.model';
import { Producto } from './producto.model';

export interface Favorito {
  id: number;
  usuario?: Usuario;
  oferta?: Oferta;
  producto?: Producto;
  fechaGuardado?: string; // LocalDateTime (ISO 8601 string en el front)
  nota?: string;
}
