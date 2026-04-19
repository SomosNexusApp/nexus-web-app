import { Injectable } from '@angular/core';

// estructura del payload que viene dentro del JWT
// el backend codifica estos datos en el token al hacer login
export interface JwtPayload {
  id: number;
  username: string; // 'username' o el 'sub' del JWT de Spring Security
  sub: string; // subject real del JWT (generalmente el username)
  email: string;
  roles: string[];
  exp: number; // expiracion en segundos (no milisegundos!)
  iat: number; // issued at: cuando se creo el token
}

// servicio que gestiona los tokens JWT guardados en el localStorage del navegador
// tenemos dos claves separadas: una para el usuario normal y otra para el admin
@Injectable({ providedIn: 'root' })
export class JwtService {
  private readonly USER_KEY = 'nexus_jwt';        // clave del localStorage para usuario
  private readonly ADMIN_KEY = 'nexus_admin_jwt'; // clave del localStorage para admin

  // guarda el token en localStorage (en la clave correcta segun si es admin o no)
  saveToken(token: string, isAdmin = false): void {
    localStorage.setItem(isAdmin ? this.ADMIN_KEY : this.USER_KEY, token);
  }

  // recupera el token del localStorage
  // si el token parece malformado (no tiene 3 partes separadas por .) lo borra y devuelve null
  // un JWT valido siempre tiene formato: header.payload.signature
  getToken(isAdmin = false): string | null {
    const key = isAdmin ? this.ADMIN_KEY : this.USER_KEY;
    const token = localStorage.getItem(key);
    if (token) {
      if (token.split('.').length !== 3) {
        console.warn(`Nexus: Token ${isAdmin ? 'admin' : 'user'} malformado detectado. Limpiando...`);
        this.removeToken(isAdmin);
        return null;
      }
      return token;
    }
    return null;
  }

  // borra el token del localStorage (para logout)
  removeToken(isAdmin = false): void {
    localStorage.removeItem(isAdmin ? this.ADMIN_KEY : this.USER_KEY);
  }

  // decodifica el payload del JWT sin necesitar la clave secreta
  // el payload es la parte del medio (partes[1]) y va en base64url
  // ojo: esto NO valida la firma, solo lee los datos. La validacion la hace el backend
  decodePayload(isAdmin = false): JwtPayload | null {
    const token = this.getToken(isAdmin);
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('JWT malformado: no tiene 3 partes');
        return null;
      }

      const base64Url = parts[1];
      if (!base64Url) return null;

      // el JWT usa base64url (con - y _) y hay que convertirlo a base64 estandar (con + y /)
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error decodificando JWT', e);
      return null;
    }
  }

  isExpired(isAdmin = false): boolean {
    const payload = this.decodePayload(isAdmin);
    if (!payload) return true;

    // exp está en segundos, Date.now() en milisegundos, por eso dividimos entre 1000
    return Math.floor(Date.now() / 1000) >= payload.exp;
  }

  // devuelve true solo si existe el token Y no ha expirado
  isValid(isAdmin = false): boolean {
    return this.getToken(isAdmin) !== null && !this.isExpired(isAdmin);
  }
}
