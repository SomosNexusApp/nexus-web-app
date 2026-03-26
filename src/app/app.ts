import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

// Servicios
import { GuestPopupService } from './core/services/guest-popup.service';
import { AuthStore } from './core/auth/auth-store';
import { WebSocketService } from './core/services/websocket.service';
import { NotificationService } from './core/services/notification.service';

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

  private authStore = inject(AuthStore);
  private wsService = inject(WebSocketService);
  private notifService = inject(NotificationService);

  // Signals para controlar la visibilidad según la ruta
  isAdminRoute = signal(window.location.pathname.startsWith('/admin'));

  // Signals para los popups post-registro
  showTwoFactorPopup = signal(false);
  showAccountTypePopup = signal(false);

  constructor() {
    // Conectar o desconectar WebSocket dinámicamente según estado auth
    effect(() => {
      if (this.authStore.isLoggedIn()) {
        this.wsService.connect();
        this.notifService.init();
      } else {
        this.wsService.disconnect();
      }
    });
  }

  ngOnInit() {
    // Escuchar cambios de ruta para el tracking de visitas y ocultar header en admin
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event: any) => {
      const url = event.urlAfterRedirects;
      const isAdmin = url.startsWith('/admin');
      
      this.isAdminRoute.set(isAdmin);
      
      if (isAdmin) {
        this.guestPopup.hidePopup();
      } else {
        this.guestPopup.trackPageVisit();
      }
    });
  }

  // --- Manejadores de eventos de los Popups ---

  // Borra tus señales antiguas (showTwoFactorPopup y showAccountTypePopup) de aquí arriba

  onTwoFactorCompletado() {
    this.guestPopup.closeTwoFactorPopup();

    // El "truco maestro": Si tras cerrar el 2FA, vemos que es un usuario nuevo (no tiene tipoCuenta),
    // le lanzamos el popup de seleccionar Empresa o Personal.
    const user = this.authStore.user();
    if (user && !user.tipoCuenta) {
      this.guestPopup.showAccountTypePopup();
    }
  }
}
