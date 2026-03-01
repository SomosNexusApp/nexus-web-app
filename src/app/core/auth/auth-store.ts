import { Injectable, signal, computed } from '@angular/core';
import { Usuario } from '../../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  // Estado privado
  private readonly _user = signal<Usuario | null>(null);

  // Selectores de solo lectura (Signals)
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());

  // Evaluamos tanto el array de roles (si viniera en el DTO) como la propiedad rol de Actor
  readonly isAdmin = computed(
    () =>
      (this._user()?.rol === 'ADMIN' || (this._user() as any)?.roles?.includes('ROLE_ADMIN')) ??
      false,
  );

  readonly isEmpresa = computed(
    () => this._user()?.rol === 'EMPRESA' || this._user()?.tipoCuenta === 'EMPRESA',
  );

  readonly username = computed(() => this._user()?.user ?? '');

  // Acciones
  setUser(u: Usuario | null): void {
    this._user.set(u);
  }

  clear(): void {
    this._user.set(null);
  }
}
