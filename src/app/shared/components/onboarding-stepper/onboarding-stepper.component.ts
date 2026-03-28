import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth-store';
import { GuestPopupService } from '../../../core/services/guest-popup.service';
import { environment } from '../../../../environments/enviroment';

@Component({
  selector: 'app-onboarding-stepper',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './onboarding-stepper.component.html',
  styleUrls: ['./onboarding-stepper.component.css']
})
export class OnboardingStepperComponent {
  public popupService = inject(GuestPopupService);
  private authStore = inject(AuthStore);
  private http = inject(HttpClient);
  private router = inject(Router);

  currentStep = 0;
  isLoading = signal(false);
  showTotpConfig = false;
  totpData: any = null;
  isTotpVerified = false;

  user = this.authStore.user;

  localState = {
    termsAccepted: false,
    newsletter: false,
    securityMethod: 'NONE', // 'NONE', 'EMAIL', 'TOTP'
    accountType: 'PERSONAL', // 'PERSONAL', 'EMPRESA'
    avatarChoice: 'GOOGLE', // 'GOOGLE', 'INITIALS'
    totpCode: '',
    cif: '',
    nombreComercial: '',
    descripcion: '',
    web: ''
  };

  get isGoogleAvatarReal(): boolean {
    const url = this.user()?.googleAvatarUrl;
    if (!url) return false;
    // Si es nuestro fallback de ui-avatars, no es real
    if (url.includes('ui-avatars.com')) return false;
    // Si la URL es de Google pero no tiene el ID de foto real (heurística basada en el screenshot del user)
    // Normalmente las fotos reales tienen un token largo tras /a/. 
    // Si detectamos que es un default (ej: Brown circle with 'E'), lo tratamos como no real.
    // Un indicador común es cuando la URL es muy corta o tiene ciertos parámetros.
    if (url.includes('googleusercontent.com') && url.includes('/a/')) {
       // Heurística de token corto vs largo.
       // Los placeholders suelen tener tokens de ~10-15 caracteres tras el /a/.
       // Las fotos reales suelen tener tokens de 40+.
       const parts = url.split('/a/');
       if (parts.length > 1) {
         const token = parts[1].split('=')[0];
         if (token.length < 30) return false; 
       }
    }
    return true;
  }

  get userInitials(): string {
    const u = this.user();
    if (!u) return 'N';
    const name = u.nombre || u.user || 'N';
    return name.charAt(0).toUpperCase();
  }

  get isLastStep(): boolean {
    return this.isGoogleAvatarReal ? this.currentStep === 3 : this.currentStep === 2;
  }

  canContinue(): boolean {
    if (this.currentStep === 0) return this.localState.termsAccepted;
    if (this.currentStep === 1 && this.localState.securityMethod === 'TOTP') return this.isTotpVerified;
    if (this.currentStep === 2 && this.localState.accountType === 'EMPRESA') {
      return !!this.localState.cif && !!this.localState.nombreComercial;
    }
    return true;
  }

  nextStep() {
    if (this.isLastStep) {
      this.finish();
      return;
    }

    this.isLoading.set(true);

    // Guardar progreso según el paso actual
    if (this.currentStep === 0) {
      this.saveTerms();
    } else if (this.currentStep === 1) {
      this.saveSecurity();
    } else if (this.currentStep === 2) {
      this.saveAccountType();
    } else {
      this.currentStep++;
      this.isLoading.set(false);
    }
  }

  prevStep() {
    if (this.currentStep > 0) this.currentStep--;
  }

  private saveTerms() {
    const payload = {
      terminosAceptados: this.localState.termsAccepted,
      newsletterSuscrito: this.localState.newsletter,
      versionTerminosAceptados: '1.0'
    };

    this.http.patch(`${environment.apiUrl}/usuario/me/terminos`, payload).subscribe({
      next: () => {
        this.currentStep++;
        this.isLoading.set(false);
      },
      error: () => this.handleError()
    });
  }

  private saveSecurity() {
    if (this.localState.securityMethod === 'NONE' || (this.localState.securityMethod === 'TOTP' && this.isTotpVerified)) {
      this.currentStep++;
      this.isLoading.set(false);
      return;
    }

    // Activar 2FA por Email
    if (this.localState.securityMethod === 'EMAIL') {
      this.http.post(`${environment.apiUrl}/auth/2fa/activar?metodo=EMAIL`, {}).subscribe({
        next: () => {
          this.currentStep++;
          this.isLoading.set(false);
        },
        error: () => this.handleError()
      });
    }
  }

  private saveAccountType() {
    const payload = { 
      tipoCuenta: this.localState.accountType,
      cif: this.localState.cif,
      nombreComercial: this.localState.nombreComercial,
      descripcion: this.localState.descripcion,
      web: this.localState.web
    };
    this.http.patch(`${environment.apiUrl}/usuario/me/tipo-cuenta`, payload).subscribe({
      next: () => {
        // Refrescamos el store 
        this.http.get<any>(`${environment.apiUrl}/auth/me`).subscribe(u => {
          this.authStore.setUser(u);
          if (this.isGoogleAvatarReal) {
            this.currentStep++;
          } else {
            // Si no es real, forzamos iniciales y terminamos
            this.localState.avatarChoice = 'INITIALS';
            this.finish();
          }
          this.isLoading.set(false);
        });
      },
      error: () => this.handleError()
    });
  }

  selectTotp() {
    this.localState.securityMethod = 'TOTP';
    this.isLoading.set(true);
    this.http.get(`${environment.apiUrl}/auth/2fa/totp-setup`).subscribe({
      next: (res: any) => {
        this.totpData = res;
        this.showTotpConfig = true;
        this.isLoading.set(false);
      },
      error: () => {
        this.handleError();
        this.localState.securityMethod = 'NONE';
      }
    });
  }

  verifyTotp() {
    this.isLoading.set(true);
    const payload = { codigo: this.localState.totpCode };
    this.http.post(`${environment.apiUrl}/auth/2fa/confirmar?metodo=TOTP`, payload).subscribe({
      next: () => {
        this.isTotpVerified = true;
        this.showTotpConfig = false;
        this.isLoading.set(false);
      },
      error: () => {
        alert('Código inválido. Revisa tu App e inténtalo de nuevo.');
        this.isLoading.set(false);
      }
    });
  }

  private finish() {
    this.isLoading.set(true);
    
    // Si el usuario es de Google/Social, siempre guardamos su preferencia de avatar al finalizar
    if (this.user()?.googleId || this.user()?.facebookId) {
      const payload = { choice: this.localState.avatarChoice };
      this.http.patch(`${environment.apiUrl}/usuario/me/avatar-choice`, payload).subscribe({
        next: () => this.completeOnboarding(),
        error: () => this.completeOnboarding() // Continuamos igual si falla para no bloquear
      });
    } else {
      this.completeOnboarding();
    }
  }

  private completeOnboarding() {
    this.popupService.closeOnboarding();
    this.isLoading.set(false);
    this.router.navigate(['/']);
    // Forzamos un refresco visual si es necesario
    window.location.reload(); 
  }

  private handleError() {
    this.isLoading.set(false);
    alert('Ocurrió un error al guardar tus preferencias. Por favor, inténtalo de nuevo.');
  }
}
