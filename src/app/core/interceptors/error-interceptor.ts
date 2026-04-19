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
import { environment } from '../../../environments/environment';

// interceptor de errores HTTP: intercepta todas las respuestas y gestiona los errores mas comunes
// lo usamos para no repetir el mismo manejo de 401/403/500 en cada componente
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
            // token expirado o no autorizado. IMPORTANTE: solo actuamos si es de nuestra api,
            // no de servicios externos (Stripe, Google, etc.) que tambien podrian devolver 401
            if (req.url.startsWith(environment.apiUrl)) {
              this.authStore.clear(); // borramos el estado de sesion
              this.jwtService.removeToken(); // borramos el token del localStorage
              this.guestPopupService.showPopup(); // mostramos el popup de login sin redirigir
            }
            break;

          case 403:
            // el usuario esta logueado pero no tiene permisos para esto
            this.toastService.error('No tienes permiso para realizar esta acción.');
            break;

          case 429:
            // demasiadas peticiones: rate limiting del servidor
            this.toastService.warning('Demasiados intentos. Espera un momento.');
            break;

          case 500:
            // error en el servidor, le avisamos al usuario
            this.toastService.error('Error interno del servidor. Inténtalo más tarde.');
            break;

          case 0:
            // status 0 = no se pudo conectar con el servidor (servidor caido, sin internet, etc.)
            if (req.url.startsWith(environment.apiUrl)) {
              this.toastService.error('No se pudo conectar con el servidor.');
            }
            break;
        }

        // siempre propagamos el error para que el componente pueda manejarlo tambien si quiere
        return throwError(() => error);
      }),
    );
  }
}
