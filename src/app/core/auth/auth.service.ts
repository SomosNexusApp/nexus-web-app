import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, tap, switchMap, map } from 'rxjs';
import { environment } from '../../../environments/enviroment';

import { JwtService } from './jwt-service';
import { AuthStore } from './auth-store';
import { GuestPopupService } from '../services/guest-popup.service';

import { AuthResponse, RegisterRequest, LoginRequest } from '../../models/auth.model';
import { Usuario } from '../../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private jwt = inject(JwtService);
  private store = inject(AuthStore);
  private router = inject(Router);
  private guestPopup = inject(GuestPopupService);

  // NOTA: Base URL dinámica dependiente de si el endpoint es /auth o /api/auth
  private readonly AUTH_URL = environment.apiUrl.replace('/api', '/auth');
  private readonly API_AUTH_URL = `${environment.apiUrl}/auth`;

  /**
   * LOGIN
   */
  login(credenciales: LoginRequest & { captchaToken?: string }): Observable<AuthResponse> {
    const payload = {
      user: credenciales.email || credenciales.username,
      password: credenciales.password,
      captchaToken: credenciales.captchaToken || 'token-omitido-en-dev',
    };

    return this.http.post<AuthResponse>(`${this.AUTH_URL}/login`, payload).pipe(
      switchMap((response) => {
        if (response.requires2FA) {
          this.router.navigate(['/auth/2fa'], {
            queryParams: { userId: (response as any).usuarioId },
          });
          return of(response);
        }

        // Si el login es directo, guardamos token y obtenemos el usuario completo
        this.jwt.saveToken(response.token);
        return this.loadCurrentUser().pipe(
          map((usuario) => {
            // CORRECCIÓN: Ahora closePopup existe en GuestPopupService
            this.guestPopup.closePopup();
            return { ...response, usuario };
          }),
        );
      }),
    );
  }

  /**
   * LOAD CURRENT USER
   */
  loadCurrentUser(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.AUTH_URL}/me`).pipe(
      tap((usuario) => {
        this.store.setUser(usuario);
      }),
    );
  }

  /**
   * REGISTRO
   */
  register(data: RegisterRequest): Observable<any> {
    return this.http.post<any>(`${this.API_AUTH_URL}/register`, data).pipe(
      tap(() => {
        this.guestPopup.closePopup(); // CORRECCIÓN: Método sincronizado
      }),
    );
  }

  /**
   * LOGOUT
   */
  logout(): void {
    this.jwt.removeToken();
    this.store.clear();
    this.router.navigate(['/']);
  }

  /**
   * VALIDACIONES EN TIEMPO REAL
   */
  checkEmail(email: string): Observable<boolean> {
    return this.http
      .get<{ disponible: boolean }>(`${this.API_AUTH_URL}/check-email`, { params: { email } })
      .pipe(map((res) => res.disponible));
  }

  checkUsername(username: string): Observable<boolean> {
    return this.http
      .get<{ disponible: boolean }>(`${this.API_AUTH_URL}/check-username`, { params: { username } })
      .pipe(map((res) => res.disponible));
  }

  /**
   * OAUTH
   */
  googleLogin(credential: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.AUTH_URL}/google`, { token: credential })
      .pipe(switchMap((response) => this.procesarLoginExitoso(response)));
  }

  facebookLogin(accessToken: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.AUTH_URL}/facebook`, { token: accessToken })
      .pipe(switchMap((response) => this.procesarLoginExitoso(response)));
  }

  /**
   * RECUPERACIÓN DE CONTRASEÑA
   */
  requestPasswordReset(email: string, captchaToken: string = ''): Observable<void> {
    return this.http.post<void>(`${this.AUTH_URL}/forgot-password`, { email, captchaToken });
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.AUTH_URL}/reset-password`, {
      token,
      nuevaPassword: newPassword,
    });
  }

  verifyEmail(email: string, codigo: string): Observable<any> {
    return this.http.post<any>(`${this.AUTH_URL}/verificar`, { email, codigo });
  }

  /**
   * Helper interno para manejar el login de OAuth y cargar el store
   */
  private procesarLoginExitoso(response: AuthResponse): Observable<AuthResponse> {
    this.jwt.saveToken(response.token);
    return this.loadCurrentUser().pipe(
      map((usuario) => {
        this.guestPopup.closePopup(); // CORRECCIÓN: Método sincronizado
        return { ...response, usuario };
      }),
    );
  }
}
