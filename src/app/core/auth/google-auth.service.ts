import { Injectable, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
// Asumimos que tienes un servicio para controlar tus modales globales
import { GuestPopupService } from '../services/guest-popup.service';
import { environment } from '../../../environments/enviroment';

// Declaramos la variable global de Google GSI
declare var google: any;

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private clientId = environment.googleClientId;

  private authService = inject(AuthService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private guestPopup = inject(GuestPopupService);

  /**
   * Inicializa el SDK de Google.
   * Debe llamarse en el ngOnInit del componente donde vayas a mostrar el botón.
   */
  initGoogleSignIn(): void {
    if (typeof google === 'undefined' || !google.accounts) {
      console.warn('El script de Google GSI no se ha cargado en el index.html.');
      return;
    }

    google.accounts.id.initialize({
      client_id: this.clientId,
      // Usamos .bind(this) para no perder el contexto de la clase
      callback: this.handleCredentialResponse.bind(this),
      auto_select: false, // Evita auto-loguear sin que el usuario haga click
      cancel_on_tap_outside: true,
    });
  }

  /**
   * Muestra el prompt "One Tap" o el modal clásico de Google.
   */
  promptGoogleSignIn(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined') {
        reject('Google GSI SDK no disponible.');
        return;
      }

      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          reject('El usuario cerró o saltó el popup de Google.');
        }
      });
      // El resolve exitoso se maneja en el callback de initialize()
    });
  }

  /**
   * Callback que ejecuta Google cuando el usuario se loguea correctamente en su ventana.
   */
  private handleCredentialResponse(response: any): void {
    // NgZone asegura que Angular detecte los cambios de UI que hagamos tras esta promesa externa
    this.ngZone.run(() => {
      this.authService.googleLogin(response.credential).subscribe({
        next: (res) => {
          // Si es la primera vez que se loguea, el RGPD exige que acepte las políticas activamente
          if (res.esNuevoUsuario) {
            this.guestPopup.showOAuthTermsPopup();
          } else {
            this.router.navigate(['/']); // Usuario existente, va al home
          }
        },
        error: (err) => {
          console.error('Error validando el token de Google en el backend', err);
        },
      });
    });
  }
}
