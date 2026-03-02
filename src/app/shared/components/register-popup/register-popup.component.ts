import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GuestPopupService } from '../../../core/services/guest-popup.service';
import { GoogleAuthService } from '../../../core/auth/google-auth.service';
import { FacebookAuthService } from '../../../core/auth/facebook-auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './register-popup.component.html',
  styleUrls: ['./register-popup.component.css'],
})
export class RegisterPopupComponent {
  public guestPopup = inject(GuestPopupService);
  private router = inject(Router);
  private googleAuth = inject(GoogleAuthService);
  private facebookAuth = inject(FacebookAuthService);
  private toast = inject(ToastService);

  isLoadingOAuth = signal(false);

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

  async loginConGoogle() {
    this.isLoadingOAuth.set(true);
    try {
      this.googleAuth.initGoogleSignIn();
      await this.googleAuth.promptGoogleSignIn();
    } catch (err: any) {
      if (typeof err === 'string' && err.includes('SDK')) {
        this.toast.error(err);
      }
    } finally {
      this.isLoadingOAuth.set(false);
    }
  }

  async loginConFacebook() {
    this.isLoadingOAuth.set(true);
    try {
      await this.facebookAuth.login();
    } catch (err: any) {
      if (typeof err === 'string' && !err.includes('canceló')) {
        this.toast.error(err);
      }
    } finally {
      this.isLoadingOAuth.set(false);
    }
  }

  get tituloDinamico(): string {
    return this.guestPopup.motivo() || 'Únete a Nexus';
  }
}
