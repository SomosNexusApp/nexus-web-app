import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthStore } from '../../../core/auth/auth-store';

export type TipoCuenta = 'PERSONAL' | 'EMPRESA' | null;

@Component({
  selector: 'app-account-type-popup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './account-type-popup.component.html',
  styleUrls: ['./account-type-popup.component.css'],
})
export class AccountTypePopupComponent {
  @Output() completado = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private authStore = inject(AuthStore);

  // Estados
  selectedType = signal<TipoCuenta>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Formulario extra para empresas
  empresaForm: FormGroup = this.fb.group({
    cif: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{9}$/)]],
    nombreComercial: ['', Validators.required],
    web: [''],
  });

  get f() {
    return this.empresaForm.controls;
  }

  seleccionarTipo(tipo: TipoCuenta) {
    this.selectedType.set(tipo);
    this.errorMessage.set(null);
  }

  onSubmit() {
    if (!this.selectedType()) return;

    if (this.selectedType() === 'EMPRESA' && this.empresaForm.invalid) {
      this.empresaForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Construir el payload
    const payload: any = {
      tipoCuenta: this.selectedType(),
    };

    if (this.selectedType() === 'EMPRESA') {
      payload.cif = this.empresaForm.value.cif;
      payload.nombreComercial = this.empresaForm.value.nombreComercial;
      payload.web = this.empresaForm.value.web;
    }

    // PATCH /api/usuarios/me/tipo-cuenta
    this.http.patch(`${environment.apiUrl}/api/usuario/me/tipo-cuenta`, payload).subscribe({
      next: () => {
        this.isLoading.set(false);

        // Actualizar el Store local para reflejar el cambio instantáneamente
        const currentUser = this.authStore.user();
        if (currentUser) {
          this.authStore.setUser({
            ...currentUser,
            tipoCuenta: this.selectedType()!,
          });
        }

        this.finalizar();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.error?.error || 'Ocurrió un error al actualizar el tipo de cuenta.',
        );
      },
    });
  }

  private finalizar() {
    this.completado.emit(); // Para que AppComponent oculte el modal
    this.router.navigate(['/']); // Navegar a la página principal
  }
}
