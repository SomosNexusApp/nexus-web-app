import { Injectable, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { GuestPopupService } from '../services/guest-popup.service';
import { environment } from '../../../environments/enviroment';

declare var FB: any;

@Injectable({ providedIn: 'root' })
export class FacebookAuthService {
  private authService = inject(AuthService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private guestPopup = inject(GuestPopupService);

  constructor() {
    this.initFacebook();
  }

  private initFacebook() {
    (window as any).fbAsyncInit = () => {
      FB.init({
        appId: environment.facebookAppId,
        cookie: true,
        xfbml: true,
        version: 'v18.0',
      });
    };
  }

  /**
   * Espera a que el SDK esté disponible y lanza el popup de Facebook.
   */
  login(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.waitForFB()
        .then(() => {
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
                      reject(err);
                    },
                  });
                } else {
                  reject('El usuario canceló el login de Facebook.');
                }
              });
            },
            { scope: 'email,public_profile' },
          );
        })
        .catch(reject);
    });
  }

  /** Espera hasta 5 segundos a que FB SDK esté disponible */
  private waitForFB(maxMs = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = () => {
        if (typeof FB !== 'undefined') {
          resolve();
        } else if (Date.now() - start > maxMs) {
          reject('Facebook SDK no se cargó a tiempo. Comprueba tu conexión.');
        } else {
          setTimeout(check, 200);
        }
      };
      check();
    });
  }
}
