import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  // Login normal
  login(credentials: { user: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((res: any) => this.saveToken(res.token))
    );
  }

  // Login con Google
  loginGoogle(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/google`, { token }).pipe(
      tap((res: any) => this.saveToken(res.token))
    );
  }

  // Login con Facebook (NUEVO)
  loginFacebook(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/facebook`, { token }).pipe(
      tap((res: any) => this.saveToken(res.token))
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
    localStorage.setItem('token', token);
  }

  // Obtener token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Logout
  logout(): void {
    localStorage.removeItem('token');
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}