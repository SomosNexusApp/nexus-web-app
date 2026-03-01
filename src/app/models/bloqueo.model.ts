import { Usuario } from './usuario.model';

export interface Bloqueo {
  id: number;
  bloqueador?: Usuario;
  bloqueado?: Usuario;
  fechaBloqueo?: string; // LocalDateTime
  motivo?: string;
}
