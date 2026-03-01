import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

import { AuthStore } from '../../../core/auth/auth-store';
import { GuestPopupService } from '../../../core/services/guest-popup.service';
import { environment } from '../../../../environments/enviroment';

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
      versionTerminosAceptados: '1.0', // O la versión actual de tus términos
    };

    // Petición PATCH para actualizar el usuario actual
    this.http.patch(`${environment.apiUrl}/usuarios/me`, payload).subscribe({
      next: () => {
        this.isLoading.set(false);

        // Actualizamos el store local para que la app sepa que ya aceptó los términos
        const currentUser = this.authStore.user();
        if (currentUser) {
          this.authStore.setUser({
            ...currentUser,
            terminosAceptados: true,
            newsletterSuscrito: payload.newsletterSuscrito,
          });
        }

        // Cerramos el popup (suponiendo que tienes un método en tu servicio)
        this.popupService.closeOAuthTermsPopup();

        // Redirigimos al home o al dashboard
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
