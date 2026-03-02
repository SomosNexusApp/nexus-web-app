import { Injectable, inject, signal } from '@angular/core';
import { AuthStore } from '../auth/auth-store';

@Injectable({ providedIn: 'root' })
export class GuestPopupService {
  private authStore = inject(AuthStore);

  // Estados del Popup de Registro/Invitado
  readonly isOpen = signal<boolean>(false);
  readonly motivo = signal<string>('');
  readonly pageVisits = signal<number>(0);
  private lastShown: number = 0;

  // Estados del Popup de Términos OAuth
  readonly isOAuthTermsOpen = signal<boolean>(false);

  // --- POPUP INVITADOS (REGISTRO) ---

  showPopup(motivo?: string): void {
    // Si ya está logueado, no mostramos el popup de invitado
    if (this.authStore.isLoggedIn()) return;

    this.motivo.set(motivo || 'Únete a Nexus');
    this.isOpen.set(true);
    this.lastShown = Date.now();
  }

  // --- POPUP 2FA (AÑADIDO AHORA) ---
  readonly isTwoFactorOpen = signal<boolean>(false);
  readonly isAccountTypeOpen = signal<boolean>(false);

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

  /**
   * Cierra el popup de invitado.
   * Se incluyen ambos nombres para evitar errores de compilación en auth.service y login.component
   */
  hidePopup(): void {
    this.isOpen.set(false);
    this.motivo.set('');
  }

  closePopup(): void {
    this.hidePopup();
  }

  // --- LÓGICA DE PERSISTENCIA/VISITAS ---

  trackPageVisit(): void {
    this.pageVisits.update((v) => v + 1);

    if (this.debeSalirPeriodico()) {
      this.showPopup('Descubre todas las ventajas de Nexus');
    }
  }

  private debeSalirPeriodico(): boolean {
    const isGuest = !this.authStore.isLoggedIn();
    const enoughVisits = this.pageVisits() >= 4;
    const timePassed = Date.now() - this.lastShown > 5 * 60 * 1000; // 5 minutos

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
