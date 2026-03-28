import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { WebSocketService, Notificacion } from './websocket.service';
import { ToastService, Toast } from './toast.service';
import { AuthStore } from '../auth/auth-store';
import { environment } from '../../../environments/enviroment';

export interface NotificacionInAppDto {
  id: number;
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  tipo: string;
  url?: string;
  destacada?: boolean;
  metadata?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly unread = signal(0);
  private ws = inject(WebSocketService);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private auth = inject(AuthStore);

  readonly unreadCount = this.unread.asReadonly();

  private apiUrl = `${environment.apiUrl}/api/notificaciones`;
  private inited = false;

  init(): void {
    if (this.inited) return;
    const user = this.auth.user();
    if (!user) return;

    this.inited = true;
    this.refreshUnreadCount();

    this.ws.notificaciones.subscribe((raw) => {
      const notif = raw as Notificacion & Partial<NotificacionInAppDto>;
      if (notif.id != null && notif.titulo) {
        this.unread.update((n) => n + 1);
        this.showToast(notif as Notificacion);
      }
    });
  }

  reset(): void {
    this.inited = false;
    this.unread.set(0);
  }

  refreshUnreadCount(): void {
    const user = this.auth.user();
    if (!user) return;
    this.http
      .get<{ noLeidas: number }>(`${this.apiUrl}/no-leidas/${user.id}`)
      .subscribe((r) => this.unread.set(r.noLeidas));
  }

  getDestacadasPendientes(): Observable<NotificacionInAppDto[]> {
    const user = this.auth.user();
    return this.http.get<NotificacionInAppDto[]>(
      `${this.apiUrl}/destacadas-pendientes/${user?.id}`,
    );
  }

  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/leer`, {}).pipe(
      tap(() => {
        this.unread.update((n) => Math.max(0, n - 1));
        this.refreshUnreadCount();
      }),
    );
  }

  markAllAsRead(): Observable<void> {
    const user = this.auth.user();
    return this.http.put<void>(`${this.apiUrl}/leer-todas/${user?.id}`, {}).pipe(
      tap(() => {
        this.unread.set(0);
        this.refreshUnreadCount();
      }),
    );
  }

  getAll(page = 0): Observable<{ content: NotificacionInAppDto[]; totalElements?: number }> {
    const user = this.auth.user();
    return this.http.get<{ content: NotificacionInAppDto[]; totalElements?: number }>(
      `${this.apiUrl}/${user?.id}?page=${page}&size=20`,
    );
  }

  private showToast(notif: Notificacion): void {
    let toastType: Toast['tipo'] = 'info';
    const t = notif.tipo;
    if (t === 'ALERTA' || t === 'ERROR' || t === 'DEVOLUCION') {
      toastType = 'error';
    } else if (
      t === 'NUEVA_COMPRA' ||
      t === 'COMPRA_PAGADA_VENDEDOR' ||
      t === 'COMPRA_PAGADA_COMPRADOR' ||
      t === 'COMPRA_CONFIRMADA'
    ) {
      toastType = 'success';
    } else if (
      t === 'ADVERTENCIA' ||
      t === 'CADUCIDAD_ANUNCIO' ||
      t === 'ENVIO_PLAZO' ||
      t === 'GUIA_ENVIO_VENDEDOR'
    ) {
      toastType = 'warning';
    } else if (t === 'FAVORITO_PRODUCTO' || t === 'FAVORITO_OFERTA') {
      toastType = 'success';
    }

    this.toast.showToast({
      tipo: toastType,
      mensaje: notif.mensaje,
      titulo: notif.titulo,
      url: notif.url,
    });
  }
}
