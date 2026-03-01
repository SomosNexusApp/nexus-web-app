import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-wrapper">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="toast.tipo" (click)="toastService.remove(toast.id)">
          <i
            class="fas"
            [ngClass]="{
              'fa-check-circle': toast.tipo === 'success',
              'fa-exclamation-circle': toast.tipo === 'error',
              'fa-exclamation-triangle': toast.tipo === 'warning',
              'fa-info-circle': toast.tipo === 'info',
            }"
          ></i>
          <span>{{ toast.mensaje }}</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toast-wrapper {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 11000;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .toast {
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 250px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        cursor: pointer;
        animation: slideIn 0.3s ease;
        font-family: 'Outfit', sans-serif;
      }
      .success {
        background: #32d74b;
      }
      .error {
        background: #ff453a;
      }
      .warning {
        background: #ff9f0a;
      }
      .info {
        background: #0a84ff;
      }
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `,
  ],
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
