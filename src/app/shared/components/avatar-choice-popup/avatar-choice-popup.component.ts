import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthStore } from '../../../core/auth/auth-store';
import { GuestPopupService } from '../../../core/services/guest-popup.service';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
  selector: 'app-avatar-choice-popup',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  templateUrl: './avatar-choice-popup.component.html',
  styleUrls: ['./avatar-choice-popup.component.css'],
})
export class AvatarChoicePopupComponent {
  @Output() completado = new EventEmitter<void>();

  private http = inject(HttpClient);
  private router = inject(Router);
  private authStore = inject(AuthStore);
  private guestPopup = inject(GuestPopupService);

  user = this.authStore.user;
  isLoading = signal<boolean>(false);
  selectedOption = signal<'GOOGLE' | 'INITIALS' | null>(null);

  selectOption(option: 'GOOGLE' | 'INITIALS') {
    this.selectedOption.set(option);
  }

  confirmar() {
    if (!this.selectedOption()) return;

    this.isLoading.set(true);
    const choice = this.selectedOption();

    this.http.patch(`${environment.apiUrl}/api/usuario/me/avatar-choice`, { choice }).subscribe({
      next: () => {
        this.isLoading.set(false);
        
        // Actualizar el Store local
        const currentUser = this.authStore.user();
        if (currentUser) {
          this.authStore.setUser({
            ...currentUser,
            avatar: choice === 'GOOGLE' ? currentUser.googleAvatarUrl : undefined
          });
        }

        this.finalizar();
      },
      error: () => {
        this.isLoading.set(false);
        // En caso de error, cerramos igualmente para no bloquear al usuario
        this.finalizar();
      }
    });
  }

  private finalizar() {
    this.completado.emit();
    this.router.navigate(['/']);
  }
}
