import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

export function matchPasswordValidator(passwordKey: string) {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.parent) return null;
    const password = control.parent.get(passwordKey)?.value;
    return password === control.value ? null : { mismatch: true };
  };
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'], // Reutilizaremos estilos base
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  token = signal<string | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  resetForm: FormGroup = this.fb.group({
    password: [
      '',
      [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)],
    ],
    confirmar: ['', [Validators.required, matchPasswordValidator('password')]],
  });

  constructor() {
    this.resetForm.get('password')?.valueChanges.subscribe(() => {
      this.resetForm.get('confirmar')?.updateValueAndValidity();
    });
  }

  ngOnInit() {
    // Capturar token de la URL: /reset-password?token=XYZ
    this.route.queryParams.subscribe((params) => {
      if (params['token']) {
        this.token.set(params['token']);
      } else {
        this.errorMessage.set('El enlace de recuperación no es válido o está incompleto.');
      }
    });
  }

  get f() {
    return this.resetForm.controls;
  }

  onSubmit() {
    if (this.resetForm.invalid || !this.token()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const newPassword = this.resetForm.value.password;

    this.authService.resetPassword(this.token()!, newPassword).subscribe({
      next: () => {
        this.isLoading.set(false);
        // Redirigir al login enviando el parámetro de éxito
        this.router.navigate(['/login'], { queryParams: { resetOk: 'true' } });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.error?.error || 'El enlace ha caducado o no es válido. Vuelve a solicitar uno.',
        );
      },
    });
  }
}
