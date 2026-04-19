import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { GuestPopupService } from '../services/guest-popup.service';
import { AuthStore } from '../auth/auth-store';

// guard de autenticacion: protege las rutas que requieren estar logueado
// si no está logueado, en lugar de redirigir a /login muestra el popup de registro
// para que el usuario pueda hacer login sin salir de la pagina que estaba viendo
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthStore);
  const popup = inject(GuestPopupService);

  if (auth.isLoggedIn()) {
    return true; // tiene sesion activa, puede pasar
  }

  // no está logueado: interrumpimos la navegacion y mostramos el modal de login/registro
  popup.showPopup();
  return false;
};
