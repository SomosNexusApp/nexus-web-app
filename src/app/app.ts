import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

// Servicios
import { GuestPopupService } from './core/services/guest-popup.service';

// Popups Globales
import { RegisterPopupComponent } from './shared/components/register-popup/register-popup.component';
import { OauthTermsPopupComponent } from './components/auth/oauth-terms-popup/oauth-terms-popup.component';
import { TwoFactorPopupComponent } from './shared/components/two-factor-popup/two-factor-popup.component';
import { AccountTypePopupComponent } from './shared/components/account-type-popup/account-type-popup.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { HeaderComponent } from './components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    AccountTypePopupComponent,
    RegisterPopupComponent,
    OauthTermsPopupComponent,
    TwoFactorPopupComponent,
    ToastContainerComponent,
    HeaderComponent,
  ],
  templateUrl: './app.html',
})
export class AppComponent implements OnInit {
  // Inyectamos el servicio de invitados para acceder a sus signals desde el HTML
  guestPopup = inject(GuestPopupService);
  private router = inject(Router);

  // Signals para los popups post-registro
  showTwoFactorPopup = signal(false);
  showAccountTypePopup = signal(false);

  ngOnInit() {
    // Escuchar cambios de ruta para el tracking de visitas (Popup periódico de invitado)
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.guestPopup.trackPageVisit();
    });
  }

  // --- Manejadores de eventos de los Popups ---

  onTwoFactorCompletado() {
    this.showTwoFactorPopup.set(false);
    this.showAccountTypePopup.set(true); // Se abre el popup de Tipo de Cuenta automáticamente
  }
}
