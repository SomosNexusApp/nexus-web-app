import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth-service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    // Verificar si el usuario está autenticado
    if (this.authService.isAuthenticated()) {
      return true;
    }

    // Si no está autenticado, redirigir a login
    // Guardar la URL que intentaba acceder para redirigir después del login
    return this.router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }
}

/**
 * Guard para rutas que solo pueden acceder usuarios (no empresas ni admins)
 */
@Injectable({
  providedIn: 'root'
})
export class UsuarioGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    if (this.authService.isAuthenticated() && this.authService.isUsuario()) {
      return true;
    }
    return this.router.createUrlTree(['/']);
  }
}

/**
 * Guard para rutas que solo pueden acceder empresas
 */
@Injectable({
  providedIn: 'root'
})
export class EmpresaGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    if (this.authService.isAuthenticated() && this.authService.isEmpresa()) {
      return true;
    }
    return this.router.createUrlTree(['/']);
  }
}

/**
 * Guard para rutas de admin
 */
@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    if (this.authService.isAuthenticated() && this.authService.isAdmin()) {
      return true;
    }
    return this.router.createUrlTree(['/']);
  }
}