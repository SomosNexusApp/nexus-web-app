import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JwtService } from '../auth/jwt-service';
import { environment } from '../../../environments/environment';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private jwtService: JwtService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const isAdminRequest = req.url.includes('/api/admin/') || 
                         req.url.includes('/admin/') ||
                          (req.url.includes('/api/auth/') && !req.url.includes('/login') && !req.url.includes('/register'));
    const token = this.jwtService.getToken(isAdminRequest);
    
    // Un check más resiliente: si empieza por http y NO es nuestro servidor, es externo.
    // Si es una ruta relativa (/api/...), se considera interno.
    const isExternal = req.url.startsWith('http') && !req.url.startsWith(environment.apiUrl);
    const isInternal = !isExternal;

    if (token && !this.jwtService.isValid(isAdminRequest)) {
      // Si el token existe pero no es válido (ej: caducado), lo limpiamos
      this.jwtService.removeToken(isAdminRequest);
    } else if (token && isInternal) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(req);
  }
}
