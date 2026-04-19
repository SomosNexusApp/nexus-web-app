import { Injectable, signal, computed } from '@angular/core';
import { Usuario } from '../../models/usuario.model';

// store de autenticacion: guarda el estado de la sesion del usuario
// usamos signals de Angular para que la UI reaccione automaticamente cuando cambia el usuario
// hay dos sesiones separadas: una de usuario normal (_user) y otra de admin (_adminUser)
// esto permite que el admin pueda estar logueado en paralelo con una cuenta usuario
@Injectable({ providedIn: 'root' })
export class AuthStore {
  // estado privado con signals: solo se puede modificar desde este servicio
  private readonly _user = signal<Usuario | null>(null);
  private readonly _adminUser = signal<Usuario | null>(null);

  // signals de solo lectura para que los componentes puedan leer pero no modificar
  readonly user = this._user.asReadonly();
  readonly adminUser = this._adminUser.asReadonly();

  // computed: se recalculan automaticamente cuando cambia _user o _adminUser
  readonly isLoggedIn = computed(() => !!this._user());
  readonly isAdminLoggedIn = computed(() => !!this._adminUser());

  // checkea si el usuario tiene rol admin, usando varios formatos posibles
  // (el backend puede devolver el rol de distintas formas segun el endpoint)
  readonly isAdmin = computed(() => {
    const u = this._user();
    const a = this._adminUser();
    
    // si hay un admin logueado en la sesion aislada, siempre es admin
    if (a) return true;
    
    // si es un usuario normal, comprobamos su campo 'rol'
    if (!u) return false;
    const r = u.rol || '';
    return r === 'ADMIN' || r === 'ROLE_ADMIN' || (u as any).roles?.includes('ROLE_ADMIN');
  });

  // comprobacion especifica para cuentas de tipo empresa
  readonly isEmpresa = computed(() => {
    const u = this._user();
    if (!u) return false;
    const r = u.rol || '';
    return r === 'EMPRESA' || r === 'ROLE_EMPRESA' || u.tipoCuenta === 'EMPRESA';
  });

  readonly username = computed(() => this._user()?.user ?? '');

  // --- acciones para modificar el estado ---
  setUser(u: Usuario | null): void {
    this._user.set(u);
  }

  setAdminUser(u: Usuario | null): void {
    this._adminUser.set(u);
  }

  // limpia solo la sesion de usuario normal (para logout de usuario)
  clear(): void {
    this._user.set(null);
  }

  // limpia solo la sesion de admin (para logout de admin)
  clearAdmin(): void {
    this._adminUser.set(null);
  }

  // limpia ambas sesiones (para logout total)
  clearAll(): void {
    this.clear();
    this.clearAdmin();
  }
}
