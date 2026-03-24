import { Actor } from './actor.model';

export type TipoCuenta = 'PERSONAL' | 'EMPRESA';

export interface Usuario extends Actor {
  avatar?: string;
  biografia?: string;
  ubicacion?: string;
  tipoCuenta: TipoCuenta;
  cuentaPrivada: boolean;
  terminosAceptados: boolean;
  newsletterSuscrito: boolean;
  googleId?: string;
  facebookId?: string;
  isSocial?: boolean;
  versionTerminosAceptados?: string;
  fechaAceptacionTerminos?: string;
  reputacion: number;
  totalVentas: number;
  esVerificado: boolean;
  perfilPublico: boolean;
  mostrarTelefono: boolean;
  mostrarUbicacion: boolean;
  // direccionPorDefecto se podría extraer a una interface DireccionEnvio
  direccionPorDefecto?: any;
}
