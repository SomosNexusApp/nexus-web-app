import { Actor } from './actor.model';

export interface Empresa extends Actor {
  cif: string;
  nombreComercial: string;
  descripcion?: string;
  web?: string;
  logo?: string;
  verificada: boolean;
}
