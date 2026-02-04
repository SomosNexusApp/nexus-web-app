import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth-service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtener el token del servicio de autenticación
    const token = this.authService.getToken();

    // Si existe token, añadirlo al header Authorization
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Continuar con la petición y manejar errores
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si el error es 401 (Unauthorized), cerrar sesión
        if (error.status === 401) {
          this.authService.logout();
          // Opcionalmente redirigir a login
          // this.router.navigate(['/login']);
        }

        // Propagar el error
        return throwError(() => error);
      })
    );
  }
}