import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { JwtService } from '../auth/jwt-service';
import { AuthStore } from '../auth/auth-store';
import { GuestPopupService } from '../services/guest-popup.service';
import { ToastService } from '../services/toast.service';
import { environment } from '../../../environments/enviroment';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private jwtService: JwtService,
    private authStore: AuthStore,
    private guestPopupService: GuestPopupService,
    private toastService: ToastService,
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        switch (error.status) {
          case 401:
            // No autorizado o token expirado. IMPORTANTE: Solo para nuestra API
            if (req.url.startsWith(environment.apiUrl)) {
              this.authStore.clear();
              this.jwtService.removeToken();
              this.guestPopupService.showPopup(); // Mostrar modal de login sin redirigir
            }
            break;

          case 403:
            this.toastService.error('No tienes permiso para realizar esta acción.');
            break;

          case 429:
            this.toastService.warning('Demasiados intentos. Espera un momento.');
            break;

          case 500:
            this.toastService.error('Error interno del servidor. Inténtalo más tarde.');
            break;

          case 0:
            if (req.url.startsWith(environment.apiUrl)) {
              this.toastService.error('No se pudo conectar con el servidor.');
            }
            break;
        }

        return throwError(() => error);
      }),
    );
  }
}
