import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JwtService } from '../auth/jwt-service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private jwtService: JwtService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const isAdminRequest = req.url.includes('/api/admin/') || 
                         req.url.includes('/admin/') ||
                         (req.url.includes('/api/auth/') && !req.url.includes('/login') && !req.url.includes('/register'));
    const token = this.jwtService.getToken(isAdminRequest);

    if (token && !this.jwtService.isValid(isAdminRequest)) {
      // Si el token existe pero no es válido (ej: caducado), lo limpiamos
      this.jwtService.removeToken(isAdminRequest);
    } else if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(req);
  }
}
