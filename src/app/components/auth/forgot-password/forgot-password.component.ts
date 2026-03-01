import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'], // Reutilizaremos estilos base
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  // Estados
  isSubmitted = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  forgotForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get f() {
    return this.forgotForm.controls;
  }

  onSubmit() {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const email = this.forgotForm.value.email;

    this.authService.requestPasswordReset(email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isSubmitted.set(true); // Mostramos el mensaje de éxito
      },
      error: () => {
        // ANTI-ENUMERATION: Aunque el email no exista o haya error, simulamos éxito en la UI
        this.isLoading.set(false);
        this.isSubmitted.set(true);
      },
    });
  }
}
