import { Injectable } from '@angular/core';

export interface JwtPayload {
  id: number;
  username: string; // Tu backend Spring Security usa 'username' (subject) o puedes mapearlo
  sub: string; // Subject real del JWT
  email: string;
  roles: string[]; // Autoridades de Spring Security
  exp: number;
  iat: number;
}

@Injectable({ providedIn: 'root' })
export class JwtService {
  private readonly USER_KEY = 'nexus_jwt';
  private readonly ADMIN_KEY = 'nexus_admin_jwt';

  saveToken(token: string, isAdmin = false): void {
    localStorage.setItem(isAdmin ? this.ADMIN_KEY : this.USER_KEY, token);
  }

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

  removeToken(isAdmin = false): void {
    localStorage.removeItem(isAdmin ? this.ADMIN_KEY : this.USER_KEY);
  }

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

    // exp está en segundos, Date.now() en milisegundos
    return Math.floor(Date.now() / 1000) >= payload.exp;
  }

  isValid(isAdmin = false): boolean {
    return this.getToken(isAdmin) !== null && !this.isExpired(isAdmin);
  }
}
