import { Actor } from './actor.model';

export type TipoNotificacion =
  | 'NUEVA_COMPRA'
  | 'NUEVO_MENSAJE'
  | 'ENVIO_ACTUALIZADO'
  | 'NUEVA_VALORACION'
  | 'SPARK_EN_OFERTA'
  | 'SISTEMA'
  | 'DEVOLUCION'
  | 'COMPRA_CONFIRMADA';

export interface NotificacionInApp {
  id: number;
  actor?: Actor;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  url?: string;
  leida: boolean;
  fecha?: string;
}
