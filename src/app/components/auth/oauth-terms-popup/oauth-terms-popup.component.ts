import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

import { AuthStore } from '../../../core/auth/auth-store';
import { GuestPopupService } from '../../../core/services/guest-popup.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-oauth-terms-popup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './oauth-terms-popup.component.html',
  styleUrls: ['./oauth-terms-popup.component.css'],
})
export class OauthTermsPopupComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private authStore = inject(AuthStore);
  private popupService = inject(GuestPopupService);

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  termsForm: FormGroup = this.fb.group({
    terminosAceptados: [false, Validators.requiredTrue],
    newsletterSuscrito: [false],
  });

  onSubmit() {
    if (this.termsForm.invalid) {
      this.termsForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const payload = {
      terminosAceptados: this.termsForm.value.terminosAceptados,
      newsletterSuscrito: this.termsForm.value.newsletterSuscrito,
      versionTerminosAceptados: '1.0',
    };

    // Petición PATCH para actualizar el usuario actual
    this.http.patch(`${environment.apiUrl}/api/usuario/me/terminos`, payload).subscribe({
      next: () => {
        this.isLoading.set(false);

        const currentUser = this.authStore.user();
        if (currentUser) {
          this.authStore.setUser({
            ...currentUser,
            terminosAceptados: true,
            newsletterSuscrito: payload.newsletterSuscrito,
          });
        }

        // 1. Cierra el popup de términos
        this.popupService.closeOAuthTermsPopup();

        // 2. Abre el popup de 2FA
        this.popupService.showTwoFactorPopup();

        // 3. Opcional: Navegar al dashboard si es necesario.
        // Si ya estás en "/", esta línea no hará nada visualmente, pero es correcta.
        this.router.navigate(['/']);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set(
          'Ocurrió un error al guardar tus preferencias. Por favor, inténtalo de nuevo.',
        );
      },
    });
  }
}
