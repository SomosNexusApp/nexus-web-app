import { Injectable, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { GuestPopupService } from '../services/guest-popup.service';
import { environment } from '../../../environments/enviroment';

declare var google: any;

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private clientId = environment.googleClientId;
  private authService = inject(AuthService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private guestPopup = inject(GuestPopupService);

  private initialized = false;

  initGoogleSignIn(): void {
    if (this.initialized) return;
    const tryInit = () => {
      if (typeof google === 'undefined' || !google?.accounts?.id) {
        setTimeout(tryInit, 300);
        return;
      }
      google.accounts.id.initialize({
        client_id: this.clientId,
        callback: this.handleCredentialResponse.bind(this),
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      this.initialized = true;
    };
    tryInit();
  }

  /**
   * Muestra el selector de cuenta de Google (One Tap o popup clásico).
   * Devuelve una promesa que se resuelve cuando el usuario completa el flujo.
   */
  promptGoogleSignIn(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Si estamos en el panel de admin, no queremos popups de GSI estorbando
      if (this.router.url.includes('/admin')) {
        console.log('[GSI] One Tap suprimido en rutas administrativas.');
        return;
      }

      if (typeof google === 'undefined' || !google?.accounts?.id) {
        reject('Google SDK no disponible. Recarga la página.');
        return;
      }

      // Re-inicializar por si el componente no llamó a initGoogleSignIn
      if (!this.initialized) {
        google.accounts.id.initialize({
          client_id: this.clientId,
          callback: (response: any) => {
            this.handleCredentialResponseAndResolve(response, resolve, reject);
          },
          auto_select: false,
          use_fedcm_for_prompt: true,
        });
      }

      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          // One Tap bloqueado → abrir selector de cuenta clásico
          google.accounts.id.renderButton(
            document.createElement('div'), // elemento temporal
            { theme: 'outline', size: 'large' },
          );
          reject('One Tap no disponible');
        }
      });
    });
  }

  renderGoogleButton(elementId: string): void {
    const checkAndRender = () => {
      if (typeof google === 'undefined' || !google?.accounts?.id) {
        setTimeout(checkAndRender, 300);
        return;
      }
      if (!this.initialized) this.initGoogleSignIn();

      const btnContainer = document.getElementById(elementId);
      if (btnContainer) {
        // Obtenemos el ancho real del contenedor para que Google lo herede
        const containerWidth = btnContainer.offsetWidth || 320;
        const finalWidth = Math.min(Math.max(containerWidth, 200), 400);

        google.accounts.id.renderButton(btnContainer, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'center',
          width: finalWidth.toString(),
        });
      }
    };
    checkAndRender();
  }

  private handleCredentialResponse(response: any): void {
    this.ngZone.run(() => {
      this.authService.googleLogin(response.credential).subscribe({
        next: (res) => {
          if (res.esNuevoUsuario) {
            this.guestPopup.showOAuthTermsPopup();
          } else {
            this.guestPopup.closePopup();
            this.router.navigate(['/']);
          }
        },
        error: (err) => console.error('Error Google login backend:', err),
      });
    });
  }

  private handleCredentialResponseAndResolve(
    response: any,
    resolve: () => void,
    reject: (reason?: any) => void,
  ): void {
    this.ngZone.run(() => {
      this.authService.googleLogin(response.credential).subscribe({
        next: (res) => {
          if (res.esNuevoUsuario) {
            this.guestPopup.showOAuthTermsPopup();
          } else {
            this.guestPopup.closePopup();
            this.router.navigate(['/']);
          }
          resolve();
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }
}
