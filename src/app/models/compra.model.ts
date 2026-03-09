import { Usuario } from './usuario.model';
import { Producto } from './producto.model';

export type EstadoCompra =
  | 'PENDIENTE'
  | 'PAGADO'
  | 'ENVIADO'
  | 'EN_TRANSITO'
  | 'ENTREGADO'
  | 'COMPLETADA'
  | 'CANCELADA'
  | 'EN_DISPUTA'
  | 'REEMBOLSADA';
export type TipoEnvio = 'DOMICILIO' | 'PUNTO_RECOGIDA' | 'RECOGIDA_PERSONAL';
export type MetodoEntrega = 'ENVIO_PAQUETERIA' | 'ENTREGA_EN_PERSONA';

export interface Compra {
  id: number;
  producto?: Producto;
  comprador?: Usuario;
  estado: EstadoCompra;
  stripePaymentIntentId?: string;
  precioFinal: number;
  precioEnvio?: number;
  metodoEntrega?: MetodoEntrega;

  // Datos de dirección desglosados
  dirNombre?: string;
  dirCalle?: string;
  dirCiudad?: string;
  dirCodigoPostal?: string;
  dirPais?: string;
  dirTelefono?: string;

  // Fechas de seguimiento
  fechaCompra?: string;
  fechaPago?: string;
  fechaEnvio?: string;
  fechaEntrega?: string;
  fechaCompletada?: string;
  fechaCancelacion?: string;

  // Nuevos campos de envío
  tipoEnvio?: TipoEnvio;
  costoEnvio?: number;
  comisionNexus?: number;
  direccionCompleta?: string;
  puntoRecogidaId?: string;
  // Peso y transportista del paquete
  pesoKg?: number;
  transportista?: string;
}
