import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { GuestPopupService } from '../services/guest-popup.service';
import { AuthStore } from '../auth/auth-store';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthStore);
  const popup = inject(GuestPopupService);

  if (auth.isLoggedIn()) {
    return true;
  }

  // Interrumpe la navegación y muestra el modal
  popup.showPopup();
  return false;
};
