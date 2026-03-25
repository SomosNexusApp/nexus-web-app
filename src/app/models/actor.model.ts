export interface Actor {
  id: number;
  user: string; // En el backend es username/user
  email: string;
  password?: string; // Opcional porque no suele viajar al front por seguridad
  nombre?: string;
  apellidos?: string;
  telefono?: string;
  twoFactorEnabled: boolean;
  twoFactorMethod?: 'TOTP' | 'EMAIL';
  cuentaVerificada: boolean;
  cuentaEliminada: boolean;
  fechaRegistro?: string; // LocalDateTime como string ISO
  stripeCustomerId?: string;
  // El rol genérico ayuda a diferenciar interfaces en el Front
  rol?: 'USUARIO' | 'ADMIN' | 'EMPRESA';
  avatar?: string;
}
