import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/enviroment';
import { AuthStore } from '../../../core/auth/auth-store';

@Component({
  selector: 'app-reporte-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen()) {
      <div class="modal-overlay" (click)="cerrar()">
        <div class="modal-content animate-slide-up" (click)="$event.stopPropagation()">
          <button class="close-btn" (click)="cerrar()">×</button>
          
          <div class="modal-header">
            <h2>Reportar {{ tipo() | titlecase }}</h2>
            <div class="step-indicator">Paso {{ step() }} de 3</div>
          </div>

          <div class="modal-body">
            @if (step() === 1) {
              <div class="step-content">
                <p>Estás a punto de reportar este contenido. Nuestro equipo de moderación revisará la solicitud.</p>
                <div class="info-box">
                  <strong>ID Referencia:</strong> {{ objetoId() }}
                </div>
                <button class="btn-primary" (click)="step.set(2)">Siguiente</button>
              </div>
            }

            @if (step() === 2) {
              <div class="step-content">
                <h3>¿Cuál es el motivo del reporte?</h3>
                <div class="motivos-list">
                  @for (motivo of motivos; track motivo.value) {
                    <label class="radio-label">
                      <input type="radio" name="motivo" [(ngModel)]="motivoSeleccionado" [value]="motivo.value">
                      <span class="radio-text">{{ motivo.label }}</span>
                    </label>
                  }
                </div>
                <div class="actions">
                  <button class="btn-secondary" (click)="step.set(1)">Atrás</button>
                  <button class="btn-primary" [disabled]="!motivoSeleccionado()" (click)="step.set(3)">Siguiente</button>
                </div>
              </div>
            }

            @if (step() === 3) {
              <div class="step-content">
                <h3>Describe el problema</h3>
                <p class="hint">Por favor, proporciona detalles para ayudarnos a investigar (min. 20 caracteres).</p>
                <textarea 
                  [(ngModel)]="descripcion" 
                  rows="4" 
                  placeholder="Escribe aquí los detalles del problema..."
                  class="desc-input">
                </textarea>
                <div class="char-count" [class.error]="descripcion().length > 0 && descripcion().length < 20">
                  {{ descripcion().length }} / 20 mín.
                </div>
                
                @if (error()) { <div class="error-msg">{{ error() }}</div> }
                
                <div class="actions">
                  <button class="btn-secondary" (click)="step.set(2)">Atrás</button>
                  <button class="btn-primary" 
                    [disabled]="descripcion().length < 20 || enviando()" 
                    (click)="enviarReporte()">
                    {{ enviando() ? 'Enviando...' : 'Enviar Reporte' }}
                  </button>
                </div>
              </div>
            }

            @if (step() === 4) {
              <div class="step-content success-view">
                <svg viewBox="0 0 24 24" class="success-icon"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>
                <h3>¡Reporte enviado!</h3>
                <p>Tu reporte ha sido enviado. Lo revisaremos en 24-48h.</p>
                <button class="btn-primary" (click)="cerrar()">Cerrar</button>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 20px;
    }
    .modal-content {
      background: white; border-radius: 12px;
      width: 100%; max-width: 480px; padding: 24px;
      position: relative; box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    .dark-theme .modal-content {
      background: #1f2937; color: #f3f4f6;
    }
    .close-btn {
      position: absolute; top: 16px; right: 16px;
      background: transparent; border: none; font-size: 24px;
      cursor: pointer; color: #6b7280;
    }
    .modal-header h2 { margin: 0 0 4px 0; font-size: 1.25rem; }
    .step-indicator { font-size: 0.875rem; color: #6b7280; margin-bottom: 20px; }
    
    .step-content { display: flex; flex-direction: column; gap: 16px; }
    .info-box { background: #f3f4f6; padding: 12px; border-radius: 8px; font-family: monospace; }
    .dark-theme .info-box { background: #374151; }
    
    .motivos-list { display: flex; flex-direction: column; gap: 12px; }
    .radio-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    
    .desc-input {
      width: 100%; padding: 12px; border: 1px solid #d1d5db;
      border-radius: 8px; resize: none; font-family: inherit;
    }
    .dark-theme .desc-input { background: #374151; border-color: #4b5563; color: white; }
    .hint { font-size: 0.875rem; color: #6b7280; margin: 0; }
    .char-count { font-size: 0.75rem; color: #6b7280; text-align: right; }
    .char-count.error { color: #ef4444; }
    .error-msg { color: #ef4444; font-size: 0.875rem; margin-top: 8px; }
    
    .actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
    .btn-primary {
      background: #2563eb; color: white; border: none; padding: 10px 20px;
      border-radius: 6px; font-weight: 500; cursor: pointer; transition: 0.2s;
    }
    .btn-primary:hover:not(:disabled) { background: #1d4ed8; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .btn-secondary {
      background: #f3f4f6; color: #374151; border: none; padding: 10px 20px;
      border-radius: 6px; font-weight: 500; cursor: pointer; transition: 0.2s;
    }
    .dark-theme .btn-secondary { background: #374151; color: #e5e7eb; }
    .btn-secondary:hover { background: #e5e7eb; }
    .dark-theme .btn-secondary:hover { background: #4b5563; }
    
    .success-view { text-align: center; padding: 20px 0; }
    .success-icon { width: 64px; height: 64px; color: #10b981; margin: 0 auto; }
    
    .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class ReporteModalComponent {
  private http = inject(HttpClient);
  private authStore = inject(AuthStore);

  // En la app real se usa guestPopupService si no está logueado, pero el llamador comprobará.
  
  isOpen = signal(false);
  tipo = signal<string>('PRODUCTO'); // PRODUCTO, OFERTA, USUARIO, MENSAJE
  objetoId = signal<number>(0);
  
  step = signal(1);
  motivoSeleccionado = signal<string>('');
  descripcion = signal<string>('');
  enviando = signal(false);
  error = signal<string>('');

  @Output() modalClosed = new EventEmitter<void>();

  motivos = [
    { value: 'SPAM', label: 'Spam comercial o publicidad' },
    { value: 'FRAUDE_ESTAFA', label: 'Fraude o posible estafa' },
    { value: 'INFORMACION_FALSA', label: 'Información falsa o engañosa' },
    { value: 'ACOSO', label: 'Acoso o comportamiento abusivo' },
    { value: 'CONTENIDO_INAPROPIADO', label: 'Contenido inapropiado u ofensivo' },
    { value: 'OTRO', label: 'Otro motivo' }
  ];

  abrir(tipo: string, id: number) {
    // Si no está logueado, el llamador debería manejarlo, pero podemos añadir un safe-check.
    if (!this.authStore.isLoggedIn()) {
      // Ideal: inject(GuestPopupService).showPopup();
      // Asumiremos que el parent verificará el login antes de invocar `abrir()`
      alert('Debes iniciar sesión para reportar.');
      return;
    }
    
    this.tipo.set(tipo);
    this.objetoId.set(id);
    this.step.set(1);
    this.motivoSeleccionado.set('');
    this.descripcion.set('');
    this.error.set('');
    this.isOpen.set(true);
  }

  cerrar() {
    this.isOpen.set(false);
    this.modalClosed.emit();
  }

  enviarReporte() {
    if (this.descripcion().length < 20 || !this.motivoSeleccionado()) {
      this.error.set('Por favor, completa todos los campos requeridos.');
      return;
    }

    this.enviando.set(true);
    this.error.set('');

    const body = {
      reportadorId: this.authStore.user()?.id,
      tipo: this.tipo().toUpperCase(),
      motivo: this.motivoSeleccionado(),
      descripcion: this.descripcion(),
      objetoId: this.objetoId()
    };

    this.http.post(`${environment.apiUrl}/reporte`, body).subscribe({
      next: () => {
        this.enviando.set(false);
        this.step.set(4); // Pantalla de éxito
      },
      error: (err: any) => {
        this.enviando.set(false);
        this.error.set(err.error?.error || 'Ocurrió un error al enviar el reporte.');
      }
    });
  }
}
