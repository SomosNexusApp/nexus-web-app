import { Actor } from './actor.model';
import { Oferta } from './oferta.model';
import { Producto } from './producto.model';

export interface SparkVoto {
  id: number;
  actor?: Actor;
  oferta?: Oferta;
  producto?: Producto;
  valor: number;
  fechaVoto?: string;
}
