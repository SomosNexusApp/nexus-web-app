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
  private readonly KEY = 'nexus_jwt';

  saveToken(token: string): void {
    localStorage.setItem(this.KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.KEY);
  }

  removeToken(): void {
    localStorage.removeItem(this.KEY);
  }

  decodePayload(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      // Decodificar Base64Url
      const base64Url = token.split('.')[1];
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

  isExpired(): boolean {
    const payload = this.decodePayload();
    if (!payload) return true;

    // exp está en segundos, Date.now() en milisegundos
    return Math.floor(Date.now() / 1000) >= payload.exp;
  }

  isValid(): boolean {
    return this.getToken() !== null && !this.isExpired();
  }
}
