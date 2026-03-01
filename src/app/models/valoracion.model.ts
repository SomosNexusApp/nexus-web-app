import { Usuario } from './usuario.model';
import { Compra } from './compra.model';

export interface Valoracion {
  id: number;
  comprador?: Usuario;
  vendedor?: Usuario;
  compra?: Compra;
  puntuacion: number;
  comentario?: string;
  respuestaVendedor?: string;
  fecha?: string;
  fechaRespuesta?: string;
}
