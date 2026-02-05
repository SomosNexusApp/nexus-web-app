export enum TipoNotificacion {
  NUEVO_MENSAJE = 'NUEVO_MENSAJE',
  OFERTA_EXPIRA_PRONTO = 'OFERTA_EXPIRA_PRONTO',
  BAJADA_PRECIO = 'BAJADA_PRECIO',
  RESPUESTA_COMENTARIO = 'RESPUESTA_COMENTARIO',
  PRODUCTO_VENDIDO = 'PRODUCTO_VENDIDO',
  OFERTA_DESTACADA = 'OFERTA_DESTACADA',
  SPARK_MILESTONE = 'SPARK_MILESTONE'
}

export interface Notificacion {
  id: number;
  usuario?: any;
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  leida: boolean;
  urlDestino?: string;
  fechaCreacion: string;
}