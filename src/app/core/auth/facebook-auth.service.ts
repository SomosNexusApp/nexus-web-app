import { Injectable, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { GuestPopupService } from '../services/guest-popup.service';
import { environment } from '../../../environments/environment';

declare var FB: any;

@Injectable({ providedIn: 'root' })
export class FacebookAuthService {
  private authService = inject(AuthService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private guestPopup = inject(GuestPopupService);

  private fbInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initFacebook();
  }

  /**
   * Carga el SDK de Facebook si no existe e inicializa el servicio.
   */
  private initFacebook(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve) => {
      // 1. Definir fbAsyncInit que llamará el SDK al cargar
      (window as any).fbAsyncInit = () => {
        FB.init({
          appId: environment.facebookAppId,
          cookie: true,
          xfbml: true,
          version: 'v18.0',
          autoLogAppEvents: true,
        });
        this.fbInitialized = true;
        console.log('Facebook SDK Inicializado correctamente');
        resolve();
      };

      // 2. Cargar el script si aún no está en el DOM
      if (!document.getElementById('facebook-jssdk')) {
        const fjs = document.getElementsByTagName('script')[0];
        const js = document.createElement('script') as HTMLScriptElement;
        js.id = 'facebook-jssdk';
        js.src = 'https://connect.facebook.net/es_ES/sdk.js';
        js.async = true;
        js.defer = true;
        js.onerror = () => {
          console.error('Error cargando el script de Facebook SDK. Posible adblocker.');
          resolve(); // Resolvemos igual para no bloquear, pero login() fallará
        };
        fjs.parentNode?.insertBefore(js, fjs);
      } else if (typeof FB !== 'undefined') {
        // Si el script ya estaba pero FB ya existe (segunda carga de la app sin recarga de página)
        this.fbInitialized = true;
        resolve();
      }
    });

    return this.initPromise;
  }

  /**
   * Lanza el popup de Facebook.
   */
  async login(): Promise<void> {
    await this.initFacebook();

    return new Promise((resolve, reject) => {
      if (typeof FB === 'undefined') {
        return reject('Facebook SDK no está disponible. Comprueba tu conexión o adblocker.');
      }

      FB.login(
        (response: any) => {
          this.ngZone.run(() => {
            if (response?.authResponse?.accessToken) {
              this.authService.facebookLogin(response.authResponse.accessToken).subscribe({
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
                  console.error('Error Facebook login backend:', err);
                  reject('Error al sincronizar con el servidor de Nexus.');
                },
              });
            } else {
              reject('El usuario canceló el login de Facebook.');
            }
          });
        },
        { scope: 'email,public_profile' },
      );
    });
  }
}
