// src/app/services/auth-service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface LoginResponse {
  token: string;
  rol: string;
  username: string;
  userId: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  // Login normal
  login(credentials: { user: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        this.saveToken(res.token);
        this.saveUserData(res.userId, res.rol, res.username);
      })
    );
  }

  // Login con Google
  loginGoogle(token: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/google`, { token }).pipe(
      tap((res) => {
        this.saveToken(res.token);
        this.saveUserData(res.userId, res.rol, res.username);
      })
    );
  }

  // Login con Facebook
  loginFacebook(token: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/facebook`, { token }).pipe(
      tap((res) => {
        this.saveToken(res.token);
        this.saveUserData(res.userId, res.rol, res.username);
      })
    );
  }

  // Registro
  register(usuario: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, usuario);
  }

  // Verificar código
  verify(email: string, codigo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verificar`, { email, codigo });
  }

  // Guardar token
  private saveToken(token: string): void {
    localStorage.setItem('nexus_token', token);
  }

  // Guardar datos del usuario
  private saveUserData(userId: number, rol: string, username: string): void {
    localStorage.setItem('nexus_user_id', userId.toString());
    localStorage.setItem('nexus_user_role', rol);
    localStorage.setItem('nexus_username', username);
  }

  // Obtener token
  getToken(): string | null {
    return localStorage.getItem('nexus_token');
  }

  // Obtener ID del usuario
  getUserId(): number {
    const id = localStorage.getItem('nexus_user_id');
    return id ? parseInt(id, 10) : 0;
  }

  // Obtener rol del usuario
  getUserRole(): string | null {
    return localStorage.getItem('nexus_user_role');
  }

  // Obtener username
  getUsername(): string | null {
    return localStorage.getItem('nexus_username');
  }

  // Logout
  logout(): void {
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user_id');
    localStorage.removeItem('nexus_user_role');
    localStorage.removeItem('nexus_username');
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Verificar si es admin
  isAdmin(): boolean {
    return this.getUserRole() === 'ADMIN';
  }

  // Verificar si es empresa
  isEmpresa(): boolean {
    return this.getUserRole() === 'EMPRESA';
  }

  // Verificar si es usuario normal
  isUsuario(): boolean {
    return this.getUserRole() === 'USUARIO';
  }
}