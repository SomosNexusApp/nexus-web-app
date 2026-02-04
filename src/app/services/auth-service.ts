import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../environments/enviroment';
import { Usuario, Empresa, Admin } from '../models/actor';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  usuario?: Usuario;
  empresa?: Empresa;
  admin?: Admin;
  tipo: 'usuario' | 'empresa' | 'admin';
}

export interface GoogleLoginRequest {
  credential: string; // JWT de Google
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private endpoint = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<Usuario | Empresa | Admin | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Cargar usuario desde localStorage al iniciar
    this.loadUserFromStorage();
  }

  /**
   * Login tradicional con email y password
   */
  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.endpoint}/login`, credentials).pipe(
      tap(response => this.handleLoginSuccess(response))
    );
  }

  /**
   * Login con Google (OAuth)
   */
  loginWithGoogle(googleToken: GoogleLoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.endpoint}/google`, googleToken).pipe(
      tap(response => this.handleLoginSuccess(response))
    );
  }

  /**
   * Logout
   */
  logout(): void {
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
    localStorage.removeItem('nexus_user_type');
    this.currentUserSubject.next(null);
  }

  /**
   * Obtiene el token actual
   */
  getToken(): string | null {
    return localStorage.getItem('nexus_token');
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): Usuario | Empresa | Admin | null {
    return this.currentUserSubject.value;
  }

  /**
   * Obtiene el tipo de usuario actual
   */
  getUserType(): 'usuario' | 'empresa' | 'admin' | null {
    return localStorage.getItem('nexus_user_type') as any;
  }

  /**
   * Verifica si el usuario actual es de tipo Usuario
   */
  isUsuario(): boolean {
    return this.getUserType() === 'usuario';
  }

  /**
   * Verifica si el usuario actual es de tipo Empresa
   */
  isEmpresa(): boolean {
    return this.getUserType() === 'empresa';
  }

  /**
   * Verifica si el usuario actual es Admin
   */
  isAdmin(): boolean {
    return this.getUserType() === 'admin';
  }

  /**
   * Refresca los datos del usuario actual
   */
  refreshCurrentUser(): Observable<Usuario | Empresa | Admin> {
    const userType = this.getUserType();
    const currentUser = this.getCurrentUser();
    
    if (!currentUser) {
      throw new Error('No hay usuario autenticado');
    }

    let endpoint = '';
    switch (userType) {
      case 'usuario':
        endpoint = `${environment.apiUrl}/usuario/${currentUser.id}`;
        break;
      case 'empresa':
        endpoint = `${environment.apiUrl}/empresa/${currentUser.id}`;
        break;
      case 'admin':
        endpoint = `${environment.apiUrl}/admin/${currentUser.id}`;
        break;
      default:
        throw new Error('Tipo de usuario desconocido');
    }

    return this.http.get<Usuario | Empresa | Admin>(endpoint).pipe(
      tap(user => {
        localStorage.setItem('nexus_user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  /**
   * Maneja el éxito del login
   */
  private handleLoginSuccess(response: LoginResponse): void {
    // Guardar token
    localStorage.setItem('nexus_token', response.token);
    
    // Guardar tipo de usuario
    localStorage.setItem('nexus_user_type', response.tipo);
    
    // Guardar datos del usuario
    const user = response.usuario || response.empresa || response.admin;
    if (user) {
      localStorage.setItem('nexus_user', JSON.stringify(user));
      this.currentUserSubject.next(user);
    }
  }

  /**
   * Carga el usuario desde localStorage
   */
  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem('nexus_user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        this.logout();
      }
    }
  }
}