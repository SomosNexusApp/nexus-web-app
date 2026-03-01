import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, timer, Subscription, of } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { GuestPopupService } from '../../../core/services/guest-popup.service'; // Ajusta la ruta si es necesario
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/enviroment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private guestPopup = inject(GuestPopupService);
  private http = inject(HttpClient); // Necesario temporalmente si no tienes verify2FA en el service

  // Manejo de Estados con Signals
  step = signal<number>(1); // 1 = Login normal, 2 = 2FA
  isLoading = signal<boolean>(false);
  isPasswordVisible = signal<boolean>(false);
  isOAuthMode = signal<boolean>(false);

  // Mensajes de UI
  errorMessage = signal<string | null>(null);
  resetSuccessMessage = signal<boolean>(false);
  countdown = signal<number>(0);
  private countdownSub?: Subscription;

  // Datos temporales para 2FA
  private tempUserId = signal<number | null>(null);
  returnUrl: string = '/';

  // Formularios
  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  twoFactorForm: FormGroup = this.fb.group({
    codigo: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  ngOnInit() {
    // Leer parámetros de la URL
    this.route.queryParams.subscribe((params) => {
      if (params['resetOk'] === 'true') {
        this.resetSuccessMessage.set(true);
      }
      this.returnUrl = params['returnUrl'] || '/';
    });
  }

  ngOnDestroy() {
    if (this.countdownSub) this.countdownSub.unsubscribe();
  }

  get f() {
    return this.loginForm.controls;
  }
  get f2() {
    return this.twoFactorForm.controls;
  }

  togglePasswordVisibility() {
    this.isPasswordVisible.update((v) => !v);
  }

  // --- FLUJO LOGIN ---
  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.resetSuccessMessage.set(false);

    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);

        // Si el backend pide 2FA (devuelve requiere2FA = true y usuarioId)
        if (res.requires2FA || res.requiere2FA) {
          this.tempUserId.set(res.usuarioId);
          this.step.set(2);
        } else {
          this.loginExitoso();
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.manejarError(err);
      },
    });
  }

  // --- FLUJO 2FA ---
  onTwoFactorSubmit() {
    if (this.twoFactorForm.invalid || !this.tempUserId()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const payload = {
      usuarioId: this.tempUserId(),
      codigo: this.twoFactorForm.value.codigo,
    };

    // Llamada directa (Idealmente deberías moverla a AuthService como verify2FA)
    const url = environment.apiUrl.replace('/api', '/auth') + '/2fa/verificar';

    this.http.post<any>(url, payload).subscribe({
      next: (res) => {
        // Guardamos el token final
        localStorage.setItem('nexus_jwt', res.token);
        this.authService.loadCurrentUser().subscribe(() => {
          this.isLoading.set(false);
          this.loginExitoso();
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Código incorrecto o expirado');
      },
    });
  }

  // --- OAUTH ---
  continuarConGoogle() {
    this.isOAuthMode.set(true);
    // authService.googleLogin(...)
  }

  continuarConFacebook() {
    this.isOAuthMode.set(true);
    // authService.facebookLogin(...)
  }

  // --- HELPERS ---
  private loginExitoso() {
    this.guestPopup.closePopup(); // Si viene del modal
    this.router.navigateByUrl(this.returnUrl);
  }

  private manejarError(err: any) {
    if (err.status === 401) {
      this.errorMessage.set('Email o contraseña incorrectos');
    } else if (err.status === 429) {
      this.iniciarCountdown();
    } else if (err.status === 403) {
      this.errorMessage.set(err.error?.error || 'Cuenta suspendida o eliminada');
    } else {
      this.errorMessage.set('Error interno. Inténtalo más tarde.');
    }
  }

  private iniciarCountdown() {
    this.countdown.set(60); // 60 segundos de bloqueo
    this.errorMessage.set(`Demasiados intentos. Espera ${this.countdown()} segundos.`);

    if (this.countdownSub) this.countdownSub.unsubscribe();

    this.countdownSub = timer(1000, 1000).subscribe(() => {
      this.countdown.update((c) => c - 1);
      this.errorMessage.set(`Demasiados intentos. Espera ${this.countdown()} segundos.`);
      if (this.countdown() <= 0) {
        this.errorMessage.set(null);
        this.countdownSub?.unsubscribe();
      }
    });
  }
}
