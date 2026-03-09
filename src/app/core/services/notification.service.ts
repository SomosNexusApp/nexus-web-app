import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { WebSocketService, Notificacion } from './websocket.service';
import { ToastService, Toast } from './toast.service';
import { AuthStore } from '../auth/auth-store';
import { environment } from '../../../environments/enviroment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly unread = signal(0);
  private ws = inject(WebSocketService);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private auth = inject(AuthStore);

  readonly unreadCount = this.unread.asReadonly();

  private apiUrl = `${environment.apiUrl}/notificaciones`;
  private inited = false;

  init(): void {
    if (this.inited) return;
    const user = this.auth.user();
    if (!user) return;

    this.inited = true;
    // Cargar count inicial desde el backend
    this.http
      .get<{ noLeidas: number }>(`${this.apiUrl}/no-leidas/${user.id}`)
      .subscribe((r) => this.unread.set(r.noLeidas));

    // Escuchar nuevas notificaciones en tiempo real
    this.ws.notificaciones.subscribe((notif) => {
      this.unread.update((n) => n + 1);
      this.showToast(notif); // toast visual
    });
  }

  markAsRead(id: number): Observable<void> {
    // El backend usa PUT
    return this.http
      .put<void>(`${this.apiUrl}/${id}/leer`, {})
      .pipe(tap(() => this.unread.update((n) => Math.max(0, n - 1))));
  }

  markAllAsRead(): Observable<void> {
    const user = this.auth.user();
    // El backend usa PUT y requiere el actorId
    return this.http
      .put<void>(`${this.apiUrl}/leer-todas/${user?.id}`, {})
      .pipe(tap(() => this.unread.set(0)));
  }

  getAll(page = 0): Observable<any> {
    // Puede tiparse mejor si se exporta NotificacionPage
    const user = this.auth.user();
    return this.http.get<any>(`${this.apiUrl}/${user?.id}?page=${page}&size=20`);
  }

  private showToast(notif: Notificacion): void {
    // Si la notificacion tiene un tipo particular, lo mapeamos a toast
    let toastType: Toast['tipo'] = 'info';

    if (notif.tipo === 'ALERTA' || notif.tipo === 'ERROR') {
      toastType = 'error';
    } else if (notif.tipo === 'COMPRA_NUEVA') {
      toastType = 'success';
    } else if (notif.tipo === 'ADVERTENCIA') {
      toastType = 'warning';
    }

    this.toast.showToast({
      tipo: toastType,
      mensaje: notif.mensaje,
      titulo: notif.titulo,
      url: notif.url, // el componente toast maneja esto para navegar
    });
  }
}
