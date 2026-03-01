import { Usuario } from './usuario.model';

export interface LoginRequest {
  email?: string;
  username?: string; // Dependiendo de si tu API permite login con usuario o email
  password?: string;
  codigo2FA?: string; // Útil si implementas verificación en 2 pasos
}

export interface RegisterRequest {
  username: string; // Requerido por AuthController.java
  email: string;
  password: string;
  nombre: string;
  apellidos: string;
  terminosAceptados: boolean;
  newsletterSuscrito: boolean;
  captchaToken: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  usuario: Usuario;
  esNuevoUsuario?: boolean;
  requires2FA?: boolean;
  tempToken?: string;
}
