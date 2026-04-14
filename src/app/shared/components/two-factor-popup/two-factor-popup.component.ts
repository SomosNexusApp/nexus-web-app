import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export type TwoFactorMethod = 'NONE' | 'EMAIL' | 'TOTP';

@Component({
  selector: 'app-two-factor-popup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './two-factor-popup.component.html',
  styleUrls: ['./two-factor-popup.component.css'],
})
export class TwoFactorPopupComponent {
  @Output() completado = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  // Estados de la UI
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  selectedMethod = signal<TwoFactorMethod>('NONE');

  // Datos TOTP
  qrCodeUrl = signal<string | null>(null);
  totpSecret = signal<string | null>(null);

  // Formulario para el código de verificación (sirve para ambos métodos)
  verifyForm: FormGroup = this.fb.group({
    codigo: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  // --- SELECCIÓN DE MÉTODO ---
  seleccionarMetodo(metodo: TwoFactorMethod) {
    this.errorMessage.set(null);
    this.selectedMethod.set(metodo);

    if (metodo === 'TOTP') {
      this.iniciarConfiguracionTotp();
    } else if (metodo === 'EMAIL') {
      this.iniciarConfiguracionEmail();
    }
  }

  // --- FLUJO TOTP (Google Authenticator) ---
  private iniciarConfiguracionTotp() {
    this.isLoading.set(true);
    // GET /api/auth/2fa/totp-setup
    this.http
      .get<{ qrCode: string; secret: string }>(`${environment.apiUrl}/auth/2fa/totp-setup`)
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.qrCodeUrl.set(res.qrCode);
          this.totpSecret.set(res.secret);
        },
        error: () => {
          this.isLoading.set(false);
          this.errorMessage.set('Error al generar el código QR. Inténtalo de nuevo.');
          this.selectedMethod.set('NONE');
        },
      });
  }

  // --- FLUJO EMAIL ---
  private iniciarConfiguracionEmail() {
    this.isLoading.set(true);
    // POST /api/auth/2fa/activar?metodo=EMAIL (Solicita el envío del código)
    this.http.post(`${environment.apiUrl}/auth/2fa/activar?metodo=EMAIL`, {}).subscribe({
      next: () => {
        this.isLoading.set(false);
        // Ahora esperamos a que el usuario introduzca el código recibido
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Error al enviar el código a tu correo.');
        this.selectedMethod.set('NONE');
      },
    });
  }

  // --- VERIFICACIÓN FINAL ---
  onVerifySubmit() {
    if (this.verifyForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    const codigo = this.verifyForm.value.codigo;
    const url = `${environment.apiUrl}/auth/2fa/confirmar?metodo=${this.selectedMethod()}`;

    // POST para confirmar el código (Ajusta la URL si tu backend usa otra ruta para confirmar la activación)
    this.http.post(url, { codigo }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.finalizar(); // Activación exitosa
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('El código es incorrecto o ha expirado.');
      },
    });
  }

  // --- NAVEGACIÓN Y CIERRE ---
  volverAtras() {
    this.selectedMethod.set('NONE');
    this.verifyForm.reset();
    this.qrCodeUrl.set(null);
    this.totpSecret.set(null);
    this.errorMessage.set(null);
  }

  saltarPorAhora() {
    this.finalizar();
  }

  private finalizar() {
    this.completado.emit(); // Emite el evento para que el padre lo cierre y avance
  }
}
