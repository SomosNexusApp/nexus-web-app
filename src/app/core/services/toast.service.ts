import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  mensaje: string;
  tipo: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  // Signal que contiene el array de toasts activos
  toasts = signal<Toast[]>([]);
  private counter = 0;

  success(msg: string) {
    this.add(msg, 'success');
  }
  error(msg: string) {
    this.add(msg, 'error');
  }
  warning(msg: string) {
    this.add(msg, 'warning');
  }
  info(msg: string) {
    this.add(msg, 'info');
  }

  private add(mensaje: string, tipo: Toast['tipo']) {
    const id = this.counter++;
    this.toasts.update((t) => [...t, { id, mensaje, tipo }]);

    // Auto-eliminar después de 5 segundos
    setTimeout(() => this.remove(id), 5000);
  }

  remove(id: number) {
    this.toasts.update((t) => t.filter((toast) => toast.id !== id));
  }
}
