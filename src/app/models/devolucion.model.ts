import { Compra } from './compra.model';

export type EstadoDevolucion = 'SOLICITADA' | 'ACEPTADA' | 'RECHAZADA' | 'COMPLETADA';
export type MotivoDevolucion =
  | 'PRODUCTO_DEFECTUOSO'
  | 'PRODUCTO_NO_CORRESPONDE'
  | 'DANO_EN_TRANSPORTE'
  | 'CAMBIO_DE_OPINION'
  | 'TALLA_INCORRECTA'
  | 'OTRO';

export interface Devolucion {
  id: number;
  compra?: Compra;
  estado: EstadoDevolucion;
  motivo: MotivoDevolucion;
  descripcion: string;
  notaVendedor?: string;
  importeDevolucion?: number;
  fechaSolicitud?: string;
  fechaResolucion?: string;
}
