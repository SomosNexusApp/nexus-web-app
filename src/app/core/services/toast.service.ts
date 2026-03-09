import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  tipo: 'success' | 'error' | 'warning' | 'info';
  mensaje: string;
  titulo?: string;
  url?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private counter = 0;

  success(msg: string, titulo?: string) {
    this.add({ tipo: 'success', mensaje: msg, titulo });
  }
  error(msg: string, titulo?: string) {
    this.add({ tipo: 'error', mensaje: msg, titulo });
  }
  warning(msg: string, titulo?: string) {
    this.add({ tipo: 'warning', mensaje: msg, titulo });
  }
  info(msg: string, titulo?: string) {
    this.add({ tipo: 'info', mensaje: msg, titulo });
  }

  showToast(toastData: Omit<Toast, 'id'>) {
    this.add(toastData);
  }

  private add(toast: Omit<Toast, 'id'>) {
    const id = this.counter++;
    this.toasts.update((t) => {
      const newStack = [{ ...toast, id }, ...t];
      return newStack.slice(0, 3); // Máximo 3 simultáneos
    });

    // Auto-eliminar en 4 segundos
    setTimeout(() => this.remove(id), 4000);
  }

  remove(id: number) {
    this.toasts.update((t) => t.filter((toast) => toast.id !== id));
  }
}
