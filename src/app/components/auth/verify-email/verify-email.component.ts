import {
  Component,
  inject,
  OnInit,
  signal,
  OnDestroy,
  ViewChildren,
  QueryList,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { timer, Subscription } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.css'],
})
export class VerifyEmailComponent implements OnInit, OnDestroy, AfterViewInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef>;

  // Estados
  emailToVerify = signal<string>('');
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Cooldown de reenvío
  resendCooldown = signal<number>(0);
  private cooldownSub?: Subscription;

  // Usamos un array genérico para manejar los 6 inputs fácilmente en el template
  codeArray = new Array(6).fill('');

  ngOnInit() {
    // Intentamos recuperar el email de los queryParams o del localStorage
    this.route.queryParams.subscribe((params) => {
      const email = params['email'] || localStorage.getItem('email_verificacion');
      if (email) {
        this.emailToVerify.set(email);
        this.startCooldown(60); // Empezar contador de 60s al cargar
      } else {
        this.errorMessage.set('No se encontró el email a verificar. Vuelve a iniciar sesión.');
      }
    });
  }

  ngAfterViewInit() {
    // Enfocar el primer input automáticamente
    if (this.codeInputs.first) {
      setTimeout(() => this.codeInputs.first.nativeElement.focus(), 100);
    }
  }

  ngOnDestroy() {
    if (this.cooldownSub) this.cooldownSub.unsubscribe();
  }

  // --- LÓGICA DE LOS INPUTS (Auto-avance) ---
  onInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Solo permitimos números o letras (ajusta según tu backend)
    input.value = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    this.codeArray[index] = input.value;

    if (input.value && index < 5) {
      // Avanzar al siguiente
      this.codeInputs.toArray()[index + 1].nativeElement.focus();
    }

    // Auto-submit si están todos llenos
    if (this.codeArray.every((val) => val.length === 1)) {
      this.onSubmit();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.codeArray[index] && index > 0) {
      // Retroceder al anterior si borramos y está vacío
      this.codeInputs.toArray()[index - 1].nativeElement.focus();
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasteData = event.clipboardData
      ?.getData('text')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();

    if (pasteData && pasteData.length >= 6) {
      for (let i = 0; i < 6; i++) {
        this.codeArray[i] = pasteData[i];
        if (this.codeInputs.toArray()[i]) {
          this.codeInputs.toArray()[i].nativeElement.value = pasteData[i];
        }
      }
      this.codeInputs.last.nativeElement.focus();
      this.onSubmit();
    }
  }

  // --- SUBMITS ---
  onSubmit() {
    const fullCode = this.codeArray.join('');
    if (fullCode.length < 6 || !this.emailToVerify()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.verifyEmail(this.emailToVerify(), fullCode).subscribe({
      next: () => {
        this.isLoading.set(false);
        localStorage.removeItem('email_verificacion');
        // Redirigir al inicio o mostrar un toast de éxito
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'El código es incorrecto o ha expirado.');
        // Limpiar inputs
        this.codeArray.fill('');
        this.codeInputs.forEach((input) => (input.nativeElement.value = ''));
        this.codeInputs.first.nativeElement.focus();
      },
    });
  }

  resendCode() {
    if (this.resendCooldown() > 0 || !this.emailToVerify()) return;

    this.isLoading.set(true);
    // Simula reenviar código. Sustituye por tu llamada a authService.resendVerificationEmail(this.emailToVerify())
    setTimeout(() => {
      this.isLoading.set(false);
      this.startCooldown(60);
      this.errorMessage.set(null); // Limpiar errores previos
      // Idealmente mostrar un toast de "Código reenviado"
    }, 1000);
  }

  private startCooldown(seconds: number) {
    this.resendCooldown.set(seconds);
    if (this.cooldownSub) this.cooldownSub.unsubscribe();

    this.cooldownSub = timer(1000, 1000).subscribe(() => {
      this.resendCooldown.update((c) => c - 1);
      if (this.resendCooldown() <= 0) {
        this.cooldownSub?.unsubscribe();
      }
    });
  }
}
