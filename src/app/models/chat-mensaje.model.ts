import { Usuario } from './usuario.model';
import { Producto } from './producto.model';

export type TipoMensaje = 'TEXTO' | 'IMAGEN' | 'AUDIO' | 'GIF' | 'OFERTA_PRECIO';

export interface ChatMensaje {
  id: number;
  producto?: Producto;
  remitente?: Usuario;
  receptor?: Usuario;
  texto?: string;
  tipo: TipoMensaje;
  leido: boolean;
  fechaEnvio?: string;
  precioPropuesto?: number;
  estadoPropuesta?: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
  mediaUrl?: string;
}
