import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { WebSocketService, Notificacion } from './websocket.service';
import { ToastService, Toast } from './toast.service';
import { AuthStore } from '../auth/auth-store';
import { environment } from '../../../environments/environment';

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

  toggleDestacada(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/toggle-destacada`, {});
  }

  getAll(page = 0, filter?: string): Observable<{ content: NotificacionInAppDto[]; totalElements?: number }> {
    const user = this.auth.user();
    let url = `${this.apiUrl}/${user?.id}?page=${page}&size=20`;
    if (filter) url += `&filter=${filter}`;
    return this.http.get<{ content: NotificacionInAppDto[]; totalElements?: number }>(url);
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

  getNotifIcon(tipo: string): string {
    switch (tipo) {
      case 'NUEVA_COMPRA':
      case 'COMPRA_PAGADA_VENDEDOR':
      case 'COMPRA_PAGADA_COMPRADOR':
      case 'COMPRA_CONFIRMADA':
        return 'fas fa-shopping-bag';
      case 'ALERTA':
      case 'ERROR':
      case 'DEVOLUCION':
        return 'fas fa-exclamation-triangle';
      case 'ADVERTENCIA':
      case 'CADUCIDAD_ANUNCIO':
      case 'ENVIO_PLAZO':
      case 'GUIA_ENVIO_VENDEDOR':
        return 'fas fa-clock';
      case 'FAVORITO_PRODUCTO':
      case 'FAVORITO_OFERTA':
        return 'fas fa-heart';
      case 'MENSAJE':
        return 'fas fa-comment-alt';
      default:
        return 'fas fa-bell';
    }
  }

  getNotifColor(tipo: string): string {
    switch (tipo) {
      case 'NUEVA_COMPRA':
      case 'COMPRA_PAGADA_VENDEDOR':
      case 'COMPRA_PAGADA_COMPRADOR':
      case 'COMPRA_CONFIRMADA':
        return '#10b981'; // Success Green
      case 'ALERTA':
      case 'ERROR':
      case 'DEVOLUCION':
        return '#ef4444'; // Error Red
      case 'ADVERTENCIA':
      case 'CADUCIDAD_ANUNCIO':
      case 'ENVIO_PLAZO':
      case 'GUIA_ENVIO_VENDEDOR':
        return '#f59e0b'; // Warning Amber
      case 'FAVORITO_PRODUCTO':
      case 'FAVORITO_OFERTA':
        return '#ff4d94'; // Pink
      case 'MENSAJE':
        return '#6366f1'; // Nexus Blue
      default:
        return '#94a3b8'; // Muted
    }
  }

  getNotifTypeLabel(tipo: string): string {
    switch (tipo) {
      case 'NUEVA_COMPRA': return 'Venta';
      case 'COMPRA_PAGADA_VENDEDOR': return 'Pago Recibido';
      case 'COMPRA_PAGADA_COMPRADOR': return 'Pago Confirmado';
      case 'COMPRA_CONFIRMADA': return 'Transacción';
      case 'ALERTA': return 'Alerta';
      case 'ERROR': return 'Error';
      case 'DEVOLUCION': return 'Devolución';
      case 'ADVERTENCIA': return 'Aviso';
      case 'CADUCIDAD_ANUNCIO': return 'Caducidad';
      case 'ENVIO_PLAZO': return 'Envío';
      case 'GUIA_ENVIO_VENDEDOR': return 'Guía de Envío';
      case 'FAVORITO_PRODUCTO':
      case 'FAVORITO_OFERTA': return 'Favorito';
      case 'MENSAJE': return 'Mensaje';
      default: return 'Notificación';
    }
  }
}
