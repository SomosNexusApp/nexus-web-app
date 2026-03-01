import { Compra } from './compra.model';

export type EstadoEnvio =
  | 'PENDIENTE_ENVIO'
  | 'EN_TRANSITO'
  | 'ENTREGADO'
  | 'INCIDENCIA'
  | 'DEVUELTO';

export interface Envio {
  id: number;
  compra?: Compra;
  estado: EstadoEnvio;
  transportista?: string;
  numeroSeguimiento?: string;
  urlSeguimiento?: string;
  precioEnvio?: number;
  fechaEnvio?: string;
  fechaEstimadaEntrega?: string;
  fechaConfirmacionEntrega?: string;
  nombreDestinatario?: string;
  direccion?: string;
  ciudad?: string;
  codigoPostal?: string;
}
