import { Injectable, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { GuestPopupService } from '../services/guest-popup.service';
import { environment } from '../../../environments/enviroment';

// Declaramos la variable global del SDK de Facebook
declare var FB: any;

@Injectable({ providedIn: 'root' })
export class FacebookAuthService {
  private appId = environment.facebookAppId;

  private authService = inject(AuthService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private guestPopup = inject(GuestPopupService);

  constructor() {
    this.initFacebookSdk();
  }

  /**
   * Configura el SDK de Facebook si ya está cargado en el index.html.
   */
  private initFacebookSdk(): void {
    if ((window as any).fbAsyncInit) return; // Evita inicializar dos veces

    (window as any).fbAsyncInit = () => {
      FB.init({
        appId: this.appId,
        cookie: true, // Habilita las cookies para que el servidor pueda acceder a la sesión
        xfbml: true, // Analiza los plugins sociales en la página
        version: 'v19.0', // Usa la API Graph más reciente
      });
    };
  }

  /**
   * Abre el popup nativo de Facebook para pedir permisos.
   */
  login(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof FB === 'undefined') {
        reject('Facebook SDK no está cargado.');
        return;
      }

      // Pedimos únicamente el perfil público y el email
      FB.login(
        (response: any) => {
          this.ngZone.run(() => {
            if (response.authResponse) {
              // Mandamos el token a nuestro backend de Spring Boot
              this.authService.facebookLogin(response.authResponse.accessToken).subscribe({
                next: (res) => {
                  if (res.esNuevoUsuario) {
                    this.guestPopup.showOAuthTermsPopup();
                  } else {
                    this.router.navigate(['/']);
                  }
                  resolve();
                },
                error: (err) => {
                  console.error('Error autenticando Facebook con el backend', err);
                  reject(err);
                },
              });
            } else {
              reject('El usuario canceló el login de Facebook o no autorizó los permisos.');
            }
          });
        },
        { scope: 'email,public_profile' },
      );
    });
  }
}
