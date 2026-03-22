import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ConfirmType = 'DANGER' | 'INFO' | 'WARNING' | 'SUCCESS';

@Component({
  selector: 'app-confirmacion-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="modal-overlay" (click)="cerrar()">
        <div class="modal-box animate-scale-in" (click)="$event.stopPropagation()">
          <div class="modal-icon" [ngClass]="tipo().toLowerCase()">
            <i class="fas" [ngClass]="getIcon()"></i>
          </div>
          <h2 class="modal-title">{{ titulo() }}</h2>
          <p class="modal-sub">{{ mensaje() }}</p>
          
          <div class="modal-actions">
            @if (tipo() !== 'INFO' && tipo() !== 'SUCCESS') {
              <button class="btn-modal-secondary" (click)="cerrar()">Cancelar</button>
            }
            <button class="btn-modal-action" [ngClass]="tipo().toLowerCase()" (click)="confirmar()">
              {{ tipo() === 'INFO' || tipo() === 'SUCCESS' ? 'Entendido' : 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center; padding: 2rem;
    }
    .modal-box {
      max-width: 420px; width: 100%; background: #111827;
      border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 32px;
      padding: 3rem 2.5rem; text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .modal-icon {
      width: 80px; height: 80px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 2rem; margin: 0 auto 1.5rem;
    }
    .modal-icon.danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    .modal-icon.warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
    .modal-icon.info { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    .modal-icon.success { background: rgba(16, 185, 129, 0.1); color: #10b981; }

    .modal-title { font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem; color: #fff; font-family: 'Outfit', sans-serif; }
    .modal-sub { color: #94a3b8; line-height: 1.6; margin-bottom: 2.5rem; font-size: 1rem; }
    .modal-actions { display: flex; gap: 1rem; }

    .btn-modal-secondary, .btn-modal-action {
      flex: 1; height: 56px; border-radius: 18px; font-weight: 700;
      cursor: pointer; transition: all 0.2s; font-family: inherit; border: none; font-size: 0.95rem;
    }
    .btn-modal-secondary { background: rgba(255, 255, 255, 0.05); color: #fff; border: 1px solid rgba(255, 255, 255, 0.1); }
    .btn-modal-secondary:hover { background: rgba(255, 255, 255, 0.1); }

    .btn-modal-action.danger { background: #ef4444; color: #fff; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3); }
    .btn-modal-action.warning { background: #f59e0b; color: #fff; }
    .btn-modal-action.info { background: #3b82f6; color: #fff; }
    .btn-modal-action.success { background: #10b981; color: #fff; }
    .btn-modal-action:hover { transform: translateY(-2px); filter: brightness(1.1); }

    .animate-scale-in { animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class ConfirmacionModalComponent {
  isOpen = signal(false);
  titulo = signal('¿Estás seguro?');
  mensaje = signal('Esta acción no se puede deshacer.');
  tipo = signal<ConfirmType>('DANGER');
  
  private onConfirm?: () => void;
  @Output() confirmed = new EventEmitter<void>();

  abrir(titulo: string, mensaje: string, tipo: ConfirmType = 'DANGER', callback?: () => void) {
    this.titulo.set(titulo);
    this.mensaje.set(mensaje);
    this.tipo.set(tipo);
    this.onConfirm = callback;
    this.isOpen.set(true);
  }

  getIcon() {
    switch (this.tipo()) {
      case 'DANGER': return 'fa-exclamation-triangle';
      case 'WARNING': return 'fa-exclamation-circle';
      case 'INFO': return 'fa-info-circle';
      case 'SUCCESS': return 'fa-check-circle';
      default: return 'fa-question-circle';
    }
  }

  cerrar() { this.isOpen.set(false); }

  confirmar() {
    this.confirmed.emit();
    if (this.onConfirm) this.onConfirm();
    this.cerrar();
  }
}
