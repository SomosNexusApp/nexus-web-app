import { Actor } from './actor.model';
import { Oferta } from './oferta.model';

export interface Comentario {
  id: number;
  texto: string;
  fecha?: string; // LocalDateTime
  esReportado?: boolean;
  oferta?: Oferta;
  actor?: Actor;
}
