import { Usuario } from './usuario.model';
import { Producto } from './producto.model';

export interface Mensaje {
  id: number;
  texto: string;
  fechaCreacion?: string; // LocalDateTime
  estaActivo?: boolean;
  producto?: Producto;
  usuario?: Usuario;
}
