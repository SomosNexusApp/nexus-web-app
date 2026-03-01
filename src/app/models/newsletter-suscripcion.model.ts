export type EstadoSuscripcion = 'PENDIENTE' | 'CONFIRMADA' | 'BAJA';

export interface NewsletterSuscripcion {
  id: number;
  email: string;
  nombre?: string;
  estado: EstadoSuscripcion;
  tokenConfirmacion?: string;
  fechaEnvioConfirmacion?: string;
  fechaConfirmacion?: string;
  tokenBaja?: string;
  fechaBaja?: string;
  motivoBaja?: string;
  recibirOfertas: boolean;
  recibirNoticias: boolean;
  recibirTrending: boolean;
  frecuencia: string; // Ej: 'DIARIO', 'SEMANAL', etc.
  fechaConsentimiento?: string;
  ipConsentimiento?: string;
  versionPolitica?: string;
  fechaRegistro?: string;
}
