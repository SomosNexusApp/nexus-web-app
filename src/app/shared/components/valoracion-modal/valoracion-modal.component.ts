import { Component, Input, Output, EventEmitter, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/enviroment';
import { AuthStore } from '../../../core/auth/auth-store';
import { StarRatingComponent } from '../star-rating/star-rating.component';

@Component({
  selector: 'app-valoracion-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, StarRatingComponent],
  template: `
    @if (isOpen()) {
      <div class="modal-overlay" (click)="cerrar()">
        <div class="modal-content animate-slide-up" (click)="$event.stopPropagation()">
          <button class="close-btn" (click)="cerrar()">×</button>
          
          <div class="modal-header">
            <h2>Valora tu experiencia con @{{ vendedorUsername() }}</h2>
          </div>

          <div class="modal-body">
            @if (!completado()) {
              <div class="rating-section">
                <p>¿Qué te pareció la transacción?</p>
                <div class="stars-wrapper">
                  <app-star-rating 
                    [rating]="estrellas()" 
                    [interactive]="true" 
                    (ratingChange)="estrellas.set($event)">
                  </app-star-rating>
                </div>
              </div>

              <div class="comment-section">
                <label>Comentario (opcional)</label>
                <textarea 
                  [(ngModel)]="comentario" 
                  rows="3" 
                  maxlength="500"
                  placeholder="Escribe tu opinión sobre el vendedor y el producto (máx 500 chars)..."
                  class="desc-input">
                </textarea>
                <div class="char-count">{{ comentario().length }} / 500</div>
              </div>
              
              @if (error()) { <div class="error-msg">{{ error() }}</div> }
              
              <div class="actions">
                <button class="btn-secondary" (click)="cerrar()">Cancelar</button>
                <button class="btn-primary" 
                  [disabled]="estrellas() === 0 || enviando()" 
                  (click)="enviarValoracion()">
                  {{ enviando() ? 'Enviando...' : 'Publicar Valoración' }}
                </button>
              </div>
            } @else {
              <div class="success-view">
                <svg viewBox="0 0 24 24" class="success-icon"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>
                <h3>¡Valoración enviada!</h3>
                <p>Gracias por contribuir a la comunidad de Nexus.</p>
                <button class="btn-primary mt-4" (click)="cerrar()">Cerrar</button>
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
      width: 100%; max-width: 450px; padding: 24px;
      position: relative; box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      text-align: center;
    }
    .dark-theme .modal-content { background: #1f2937; color: #f3f4f6; }
    .close-btn {
      position: absolute; top: 16px; right: 16px;
      background: transparent; border: none; font-size: 24px;
      cursor: pointer; color: #6b7280;
    }
    
    .modal-header h2 { margin: 0 0 24px 0; font-size: 1.25rem; font-weight: 600; }
    
    .rating-section p { margin-bottom: 12px; color: #4b5563; }
    .dark-theme .rating-section p { color: #d1d5db; }
    
    .stars-wrapper { margin-bottom: 24px; transform: scale(1.5); padding: 10px; }
    
    .comment-section {text-align: left; margin-bottom: 20px; }
    .comment-section label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 8px;}
    
    .desc-input {
      width: 100%; padding: 12px; border: 1px solid #d1d5db;
      border-radius: 8px; resize: none; font-family: inherit;
    }
    .dark-theme .desc-input { background: #374151; border-color: #4b5563; color: white; }
    
    .char-count { font-size: 0.75rem; color: #6b7280; text-align: right; margin-top: 4px;}
    
    .error-msg { color: #ef4444; font-size: 0.875rem; margin-bottom: 16px; text-align: left;}
    
    .actions { display: flex; justify-content: flex-end; gap: 12px; }
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
    
    .success-view { padding: 20px 0; }
    .success-icon { width: 64px; height: 64px; color: #10b981; margin: 0 auto; }
    
    .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .mt-4 { margin-top: 16px; }
  `]
})
export class ValoracionModalComponent {
  private http = inject(HttpClient);
  private authStore = inject(AuthStore);

  isOpen = signal(false);
  vendedorUsername = signal<string>('');
  compraId = signal<number>(0);
  
  estrellas = signal<number>(0);
  comentario = signal<string>('');
  
  enviando = signal(false);
  error = signal<string>('');
  completado = signal(false);

  @Output() valoracionRegistrada = new EventEmitter<void>();

  abrir(vendedorUsername: string, compraId: number) {
    if (!this.authStore.isLoggedIn()) {
      alert('Debes iniciar sesión para valorar.');
      return;
    }
    this.vendedorUsername.set(vendedorUsername);
    this.compraId.set(compraId);
    this.estrellas.set(0);
    this.comentario.set('');
    this.error.set('');
    this.completado.set(false);
    this.isOpen.set(true);
  }

  cerrar() {
    this.isOpen.set(false);
    if (this.completado()) {
      this.valoracionRegistrada.emit();
    }
  }

  enviarValoracion() {
    if (this.estrellas() === 0) {
      this.error.set('Por favor, selecciona una puntuación.');
      return;
    }

    this.enviando.set(true);
    this.error.set('');

    const body = {
      compraId: this.compraId(),
      compradorId: this.authStore.user()?.id,
      estrellas: this.estrellas(),
      comentario: this.comentario()
    };

    // La ruta según el backend es POST /valoracion
    this.http.post(`${environment.apiUrl}/valoracion`, body).subscribe({
      next: () => {
        this.enviando.set(false);
        this.completado.set(true); 
      },
      error: (err: any) => {
        this.enviando.set(false);
        this.error.set(err.error?.error || 'Error al guardar la valoración.');
      }
    });
  }
}
