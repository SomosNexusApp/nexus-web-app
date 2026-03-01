import { ApplicationConfig, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, HTTP_INTERCEPTORS, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { catchError, of } from 'rxjs';

import { routes } from './app.routes';

import { AuthService } from './core/auth/auth.service';
import { JwtService } from './core/auth/jwt-service';
import { JwtInterceptor } from './core/interceptors/jwt-interceptor';
import { ErrorInterceptor } from './core/interceptors/error-interceptor';

// Factory function para el inicializador
export function initializeUserData(authService: AuthService, jwtService: JwtService) {
  return () => {
    // Solo hacemos la petición a /me si ya existe un token localmente
    if (jwtService.isValid()) {
      return authService.loadCurrentUser().pipe(
        catchError(() => of(null)), // Si falla (ej. token expirado), continúa el arranque sin error
      );
    }
    return of(null);
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),

    // Interceptores
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },

    // ⚡ Inicializador de la App (Carga el usuario antes de renderizar)
    {
      provide: APP_INITIALIZER,
      useFactory: initializeUserData,
      deps: [AuthService, JwtService],
      multi: true,
    },
  ],
};
