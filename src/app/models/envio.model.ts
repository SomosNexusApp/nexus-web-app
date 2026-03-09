export type EstadoEnvio =
  | 'PENDIENTE_ENVIO'
  | 'PREPARANDO'
  | 'ENVIADO'
  | 'EN_TRANSITO'
  | 'EN_REPARTO'
  | 'ENTREGADO'
  | 'INCIDENCIA'
  | 'DEVUELTO'
  | 'CANCELADO';

export type Transportista = 'CORREOS' | 'SEUR' | 'MRW';

export interface Envio {
  id: number;
  compraId?: number;
  estado: EstadoEnvio;
  metodoEntrega?: string;

  // Datos destinatario
  nombreDestinatario?: string;
  direccion?: string;
  ciudad?: string;
  codigoPostal?: string;
  pais?: string;
  telefono?: string;

  // Transportista y código de envío
  transportistaEnum?: Transportista;
  transportista?: string; // legado / texto libre
  numeroSeguimiento?: string;
  urlSeguimiento?: string;

  // Código SHIP-XXXXXXXX y QR
  codigoEnvio?: string;
  qrBase64?: string; // PNG base64 sin prefijo data:image

  // Peso y precio
  pesoKg?: number;
  precioEnvio?: number;

  // Valoración comprador
  valoracionVendedor?: number;
  comentarioValoracion?: string;

  // Fechas
  fechaCreacion?: string;
  fechaEnvio?: string;
  fechaEstimadaEntrega?: string;
  fechaConfirmacionEntrega?: string;
}
