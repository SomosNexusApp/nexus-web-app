import { Empresa } from './empresa.model';

export type TipoContrato = 'BASICO' | 'PREMIUM' | 'VIP';

export interface Contrato {
  id: number;
  tipoContrato: TipoContrato;
  fecha?: string;
  empresa?: Empresa;
}
