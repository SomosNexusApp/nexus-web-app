import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="toast-wrapper">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="toast.tipo">
          <div
            class="toast-content"
            [routerLink]="toast.url ? toast.url : null"
            (click)="toast.url ? toastService.remove(toast.id) : null"
            [style.cursor]="toast.url ? 'pointer' : 'default'"
          >
            <i
              class="fas"
              [ngClass]="{
                'fa-check-circle': toast.tipo === 'success',
                'fa-exclamation-circle': toast.tipo === 'error',
                'fa-exclamation-triangle': toast.tipo === 'warning',
                'fa-info-circle': toast.tipo === 'info',
              }"
            ></i>
            <div class="text-group">
              <strong *ngIf="toast.titulo">{{ toast.titulo }}</strong>
              <span>{{ toast.mensaje }}</span>
            </div>
          </div>
          <button class="close-btn" (click)="toastService.remove(toast.id)">&times;</button>
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
        gap: 12px;
        max-width: 350px;
      }
      .toast {
        padding: 12px 16px;
        border-radius: 8px;
        color: white;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: 'Inter', sans-serif;
      }
      .toast-content {
        display: flex;
        gap: 12px;
        flex-grow: 1;
      }
      .text-group {
        display: flex;
        flex-direction: column;
      }
      .text-group strong {
        font-size: 0.95rem;
        margin-bottom: 2px;
      }
      .text-group span {
        font-size: 0.85rem;
        opacity: 0.95;
      }
      .close-btn {
        background: none;
        border: none;
        color: white;
        font-size: 1.25rem;
        cursor: pointer;
        opacity: 0.7;
        line-height: 1;
        padding: 0;
        transition: opacity 0.2s;
      }
      .close-btn:hover {
        opacity: 1;
      }
      i.fas {
        margin-top: 3px;
        font-size: 1.1rem;
      }
      .success {
        background: #10b981;
      }
      .error {
        background: #ef4444;
      }
      .warning {
        background: #f59e0b;
        color: #fff;
      }
      .info {
        background: #3b82f6;
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
