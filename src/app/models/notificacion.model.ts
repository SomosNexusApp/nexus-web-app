export type TipoNotificacion =
  | 'NUEVA_COMPRA'
  | 'NUEVO_MENSAJE'
  | 'ENVIO_ACTUALIZADO'
  | 'NUEVA_VALORACION'
  | 'SPARK_EN_OFERTA'
  | 'SISTEMA'
  | 'DEVOLUCION'
  | 'COMPRA_CONFIRMADA';

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  url?: string;
  leida: boolean;
  fecha?: string; // LocalDateTime viene como string ISO 8601 del backend
}
