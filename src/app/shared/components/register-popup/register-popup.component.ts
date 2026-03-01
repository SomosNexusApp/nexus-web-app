import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Servicios
import { GuestPopupService } from '../../../core/services/guest-popup.service';
import { GoogleAuthService } from '../../../core/auth/google-auth.service';

@Component({
  selector: 'app-register-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './register-popup.component.html',
  styleUrls: ['./register-popup.component.css'],
})
export class RegisterPopupComponent {
  // Inyectamos el servicio para acceder al signal 'isOpen' y 'motivo'
  public guestPopup = inject(GuestPopupService);

  private router = inject(Router);
  private googleAuth = inject(GoogleAuthService);

  /**
   * Cierra el popup y navega a la ruta indicada
   */
  navegarA(ruta: string): void {
    this.guestPopup.hidePopup();
    this.router.navigate([ruta]);
  }

  /**
   * Cierra el popup si el usuario hace clic en el área borrosa exterior
   */
  onBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('popup-overlay')) {
      this.guestPopup.hidePopup();
    }
  }

  /**
   * Acceso rápido con Google
   */
  async loginConGoogle() {
    try {
      await this.googleAuth.promptGoogleSignIn();
      // El servicio de Google ya cierra el popup tras el éxito
    } catch (err) {
      console.log('Login social cancelado');
    }
  }

  /**
   * Getter para el título dinámico según el contexto de la acción bloqueada
   */
  get tituloDinamico(): string {
    const motivo = this.guestPopup.motivo();
    return motivo || 'Únete a Nexus';
  }
}
