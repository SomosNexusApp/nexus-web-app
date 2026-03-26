import { Injectable, signal, computed } from '@angular/core';
import { Usuario } from '../../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  // Estado privado
  private readonly _user = signal<Usuario | null>(null);
  private readonly _adminUser = signal<Usuario | null>(null);

  // Selectores de solo lectura (Signals)
  readonly user = this._user.asReadonly();
  readonly adminUser = this._adminUser.asReadonly();

  readonly isLoggedIn = computed(() => !!this._user());
  readonly isAdminLoggedIn = computed(() => !!this._adminUser());

  // Evaluamos tanto el array de roles (si viniera en el DTO) como la propiedad rol de Actor
  readonly isAdmin = computed(() => {
    const u = this._user();
    const a = this._adminUser();
    
    // Si hay un admin logueado en la sesión aislada, es admin
    if (a) return true;
    
    // Si es un usuario normal con el rol adecuado en su sesión, también es admin
    if (!u) return false;
    const r = u.rol || '';
    return r === 'ADMIN' || r === 'ROLE_ADMIN' || (u as any).roles?.includes('ROLE_ADMIN');
  });

  readonly isEmpresa = computed(() => {
    const u = this._user();
    if (!u) return false;
    const r = u.rol || '';
    return r === 'EMPRESA' || r === 'ROLE_EMPRESA' || u.tipoCuenta === 'EMPRESA';
  });

  readonly username = computed(() => this._user()?.user ?? '');

  // Acciones
  setUser(u: Usuario | null): void {
    this._user.set(u);
  }

  setAdminUser(u: Usuario | null): void {
    this._adminUser.set(u);
  }

  clear(): void {
    this._user.set(null);
  }

  clearAdmin(): void {
    this._adminUser.set(null);
  }

  clearAll(): void {
    this.clear();
    this.clearAdmin();
  }
}
