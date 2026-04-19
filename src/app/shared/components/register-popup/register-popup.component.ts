import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GuestPopupService } from '../../../core/services/guest-popup.service';
import { GoogleAuthService } from '../../../core/auth/google-auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './register-popup.component.html',
  styleUrls: ['./register-popup.component.css'],
})
export class RegisterPopupComponent implements OnInit, OnDestroy {
  public guestPopup = inject(GuestPopupService);
  private router = inject(Router);
  private googleAuth = inject(GoogleAuthService);
  private toast = inject(ToastService);

  isLoadingOAuth = signal(false);
  isMobile = signal(window.innerWidth <= 768);

  private resizeListener = () => {
    this.isMobile.set(window.innerWidth <= 768);
  };

  ngOnInit() {
    // Renderizamos el botón oficial de Google dándole un respiro al DOM
    setTimeout(() => {
      this.googleAuth.renderGoogleButton('google-popup-btn-container');
    }, 150);

    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeListener);
  }

  navegarA(ruta: string): void {
    this.guestPopup.hidePopup();
    this.router.navigate([ruta]);
  }

  onBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('popup-overlay')) {
      this.guestPopup.hidePopup();
    }
  }

  get tituloDinamico(): string {
    return this.guestPopup.motivo() || 'Únete a Nexus';
  }
}
