import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../auth/auth-store';

// servicio central para todos los popups/modales de la aplicacion
// gestiona: popup de registro para invitados, onboarding, 2FA, tipo de cuenta y eleccion de avatar
// usamos signals de Angular 17+ para que los componentes reaccionen automaticamente al estado
@Injectable({ providedIn: 'root' })
export class GuestPopupService {
  private authStore = inject(AuthStore);
  private router    = inject(Router);

  // --- estados del popup de registro para invitados ---
  readonly isOpen = signal<boolean>(false);
  readonly motivo = signal<string>(''); // mensaje que se muestra en el popup
  readonly pageVisits = signal<number>(0); // contador de visitas para el popup periodico
  private lastShown: number = 0; // timestamp de la ultima vez que se mostro el popup

  // estados del popup de terminos OAuth (cuando el usuario se registra con Google)
  readonly isOAuthTermsOpen = signal<boolean>(false);

  // --- popup de invitados (registro) ---

  showPopup(motivo?: string): void {
    // si estamos en la ruta admin bloqueamos el popup para no molestar al administrador
    if (this.router.url.includes('/admin') || window.location.pathname.includes('/admin')) {
      console.log('[GuestPopup] Bloqueado popup en ruta admin.');
      return;
    }

    // si ya está logueado no tiene sentido mostrar el popup de registro
    if (this.authStore.isLoggedIn()) return;

    this.motivo.set(motivo || 'Únete a Nexus');
    this.isOpen.set(true);
    this.lastShown = Date.now(); // guardamos cuando se muestra para no repetirlo muy pronto
  }

  // --- estados de los demas popups del onboarding ---
  // los tenemos como signals separados para que cada popup sea independiente
  readonly isTwoFactorOpen = signal<boolean>(false);
  readonly isAccountTypeOpen = signal<boolean>(false);
  readonly isAvatarChoiceOpen = signal<boolean>(false);
  readonly isOnboardingOpen = signal<boolean>(false); // el stepper de bienvenida para usuarios nuevos

  showTwoFactorPopup(): void {
    this.isTwoFactorOpen.set(true);
  }

  hideTwoFactorPopup(): void {
    this.isTwoFactorOpen.set(false);
  }

  closeTwoFactorPopup(): void {
    this.hideTwoFactorPopup();
  }

  showAccountTypePopup(): void {
    this.isAccountTypeOpen.set(true);
  }

  closeAccountTypePopup(): void {
    this.isAccountTypeOpen.set(false);
  }

  showAvatarChoicePopup(): void {
    this.isAvatarChoiceOpen.set(true);
  }

  closeAvatarChoicePopup(): void {
    this.isAvatarChoiceOpen.set(false);
  }

  showOnboarding(): void {
    this.isOnboardingOpen.set(true);
  }

  closeOnboarding(): void {
    this.isOnboardingOpen.set(false);
  }

  /**
   * cierra el popup de invitado.
   * tenemos dos nombres (hidePopup y closePopup) para que funcione tanto
   * desde auth.service como desde login.component sin romper nada
   */
  hidePopup(): void {
    this.isOpen.set(false);
    this.motivo.set('');
  }

  closePopup(): void {
    this.hidePopup(); // alias de hidePopup
  }

  // --- logica para mostrar el popup periodicamente a usuarios no registrados ---

  trackPageVisit(): void {
    // no mostramos popups comerciales en la zona admin
    if (this.router.url.includes('/admin') || window.location.pathname.includes('/admin')) return;

    this.pageVisits.update((v) => v + 1);

    // si cumple las condiciones, mostramos el popup automaticamente
    if (this.debeSalirPeriodico()) {
      this.showPopup('Descubre todas las ventajas de Nexus');
    }
  }

  private debeSalirPeriodico(): boolean {
    const isGuest = !this.authStore.isLoggedIn();
    const enoughVisits = this.pageVisits() >= 4; // minimo 4 visitas antes de molestar
    const timePassed = Date.now() - this.lastShown > 5 * 60 * 1000; // y que hayan pasado 5 min

    return isGuest && enoughVisits && timePassed;
  }

  // --- POPUP TÉRMINOS OAUTH ---

  showOAuthTermsPopup(): void {
    this.isOAuthTermsOpen.set(true);
  }

  /**
   * Alias adicionales por si tus componentes llaman a hide o close
   */
  closeOAuthTermsPopup(): void {
    this.isOAuthTermsOpen.set(false);
  }

  hideOAuthTermsPopup(): void {
    this.closeOAuthTermsPopup();
  }
}
