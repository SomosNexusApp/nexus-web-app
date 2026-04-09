import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

// Servicios
import { GuestPopupService } from './core/services/guest-popup.service';
import { AuthStore } from './core/auth/auth-store';
import { WebSocketService } from './core/services/websocket.service';
import { NotificationService, NotificacionInAppDto } from './core/services/notification.service';
import { UiService } from './core/services/ui.service';

// Popups Globales
import { RegisterPopupComponent } from './shared/components/register-popup/register-popup.component';
import { OnboardingStepperComponent } from './shared/components/onboarding-stepper/onboarding-stepper.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { HeaderComponent } from './components/header/header.component';
import { SupportChatWidgetComponent } from './shared/components/support-chat-widget/support-chat-widget.component';
import { MobileHeader } from './mobile/mobile-header/mobile-header';
import { MobileBottomNav } from './mobile/mobile-bottom-nav/mobile-bottom-nav';
import { CategoriaPanelComponent } from './shared/components/categoria-panel/categoria-panel.component';
import { MobilePublishModalComponent } from './mobile/mobile-publish-modal/mobile-publish-modal';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RegisterPopupComponent,
    OnboardingStepperComponent,
    ToastContainerComponent,
    HeaderComponent,
    SupportChatWidgetComponent,
    MobileBottomNav,
    MobileHeader,
    CategoriaPanelComponent,
    MobilePublishModalComponent,
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  // Inyectamos el servicio de invitados para acceder a sus signals desde el HTML
  guestPopup = inject(GuestPopupService);
  private router = inject(Router);

  private authStore = inject(AuthStore);
  private wsService = inject(WebSocketService);
  private notifService = inject(NotificationService);
  public uiService = inject(UiService);

  // Signals para controlar la visibilidad según la ruta
  isAdminRoute = signal(window.location.pathname.startsWith('/admin'));
  isMessagesRoute = signal(window.location.pathname.startsWith('/mensajes'));
  isMobileUI = signal(window.innerWidth <= 768);

  // Signals para los popups post-registro
  showTwoFactorPopup = signal(false);
  showAccountTypePopup = signal(false);

  /** Modal prioritario: venta pagada — pasos de envío */
  saleBanner = signal<NotificacionInAppDto | null>(null);

  constructor() {
    // Escuchar el tamaño de la ventana para alternar entre componentes mobile/desktop
    window.addEventListener('resize', () => {
      this.isMobileUI.set(window.innerWidth <= 768);
    });
    // Conectar o desconectar WebSocket dinámicamente según estado auth
    effect(() => {
      if (this.authStore.isLoggedIn()) {
        this.wsService.connect();
        this.notifService.init();
        queueMicrotask(() => {
          this.notifService.getDestacadasPendientes().subscribe((list) => {
            const sale = list.find(
              (n) => n.tipo === 'COMPRA_PAGADA_VENDEDOR' || n.destacada === true,
            );
            if (sale) this.saleBanner.set(sale);
          });
        });
      } else {
        this.wsService.disconnect();
        this.notifService.reset();
        this.saleBanner.set(null);
      }
    });
  }

  closeSaleBanner(): void {
    const n = this.saleBanner();
    if (n?.id != null) {
      this.notifService.markAsRead(n.id).subscribe(() => this.saleBanner.set(null));
    } else {
      this.saleBanner.set(null);
    }
  }

  goMisVentas(): void {
    this.router.navigate(['/perfil'], { queryParams: { tab: 'ventas' } });
    this.closeSaleBanner();
  }

  ngOnInit() {
    // Escuchar cambios de ruta para el tracking de visitas y ocultar header en admin
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects;
        const isAdmin = url.startsWith('/admin');

        this.isAdminRoute.set(isAdmin);
        const isMessages = url.startsWith('/mensajes');
        this.isMessagesRoute.set(isMessages);

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

    const user = this.authStore.user();
    if (user && !user.tipoCuenta) {
      this.guestPopup.showAccountTypePopup();
    }
  }

  onAccountTypeCompletado() {
    this.guestPopup.closeAccountTypePopup();

    const user = this.authStore.user();
    // Si es un usuario de Google y tiene foto, le dejamos elegir
    if (user && user.googleAvatarUrl) {
      this.guestPopup.showAvatarChoicePopup();
    } else {
      // Si no es Google, simplemente terminamos el flujo
      this.router.navigate(['/']);
    }
  }
}
