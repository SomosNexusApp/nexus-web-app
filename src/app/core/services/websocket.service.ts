import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';
import { JwtService } from '../auth/jwt-service';
import { AuthStore } from '../auth/auth-store';

export interface ChatMensaje {
  id: number;
  remitente: { id: number; nombre: string; avatar?: string };
  receptor: { id: number; nombre: string; avatar?: string };
  producto: { id: number; titulo: string; imagenPrincipal?: string; coverImage?: string };
  texto?: string;
  mediaUrl?: string;
  mediaThumbnail?: string;
  audioDuracionSegundos?: number;
  tipo: string;
  fechaEnvio: string;
  leido: boolean;
  recibido?: boolean;
  precioPropuesto?: number;
  estadoPropuesta?: string;
  roomId?: string;
}

export interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  tipo: string;
  url?: string;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private client: Client | null = null;
  private jwt = inject(JwtService);
  private auth = inject(AuthStore);
  private http = inject(HttpClient);

  private mensajes$ = new Subject<ChatMensaje>();
  private notificaciones$ = new Subject<Notificacion>();
  private leidos$ = new Subject<{ roomId: string; usuarioId: number }>();
  private recibidos$ = new Subject<{ roomId: string; usuarioId: number }>();
  unreadConvCount = signal(0);

  readonly mensajes = this.mensajes$.asObservable();
  readonly notificaciones = this.notificaciones$.asObservable();
  readonly leidos = this.leidos$.asObservable();
  readonly recibidos = this.recibidos$.asObservable();

  // Track subscribed product topics to avoid duplicates
  private subscribedTopics = new Set<string>();

  connect(): void {
    const token = this.jwt.getToken();
    if (!token || this.client?.connected) return;

    this.client = new Client({
      webSocketFactory: () => new SockJS(`${environment.wsUrl}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        const userId = this.auth.user()?.id;
        if (!userId) return;

        // Cola privada de notificaciones (badge de mensajes nuevos, etc.)
        this.client!.subscribe(`/user/queue/notificaciones`, (msg) => {
          this.notificaciones$.next(JSON.parse(msg.body));
          // Refresh count when a new notification arrives
          this.refreshUnreadCount();
        });

        // Initial fetch
        this.refreshUnreadCount();
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message'], frame.body);
      },
    });

    this.client.activate();
  }

  /**
   * Suscribirse al topic de una sala específica para recibir mensajes en tiempo real.
   * Se llama desde ChatPanelComponent cuando se abre una conversación.
   */
  suscribirseAlChat(roomId: string): void {
    const topicKey = `/topic/chat/${roomId}`;
    if (!this.client?.connected || this.subscribedTopics.has(topicKey)) return;

    this.subscribedTopics.add(topicKey);
    this.client.subscribe(topicKey, (msg) => {
      this.mensajes$.next(JSON.parse(msg.body));
    });
  }

  refreshUnreadCount(): void {
    const user = this.auth.user();
    if (!user) return;
    this.http
      .get<{ noLeidos: number }>(`${environment.apiUrl}/chat/no-leidos/${user.id}/conversaciones`)
      .subscribe((res) => this.unreadConvCount.set(res.noLeidos));
  }

  disconnect(): void {
    this.client?.deactivate();
    this.client = null;
    this.subscribedTopics.clear();
  }

  /**
   * Enviar mensaje de texto via STOMP.
   * Destination: /app/chat.enviar (según ChatWebSocketController.java)
   */
  enviarMensajeChat(
    productoId: number | null,
    remitenteId: number,
    receptorId: number,
    texto: string,
    roomId: string,
  ): void {
    if (this.client?.connected) {
      this.client.publish({
        destination: '/app/chat.enviar',
        body: JSON.stringify({
          productoId,
          remitenteId,
          receptorId,
          texto,
          tipo: 'TEXTO',
          roomId,
        }),
      });
    }
  }

  /**
   * Enviar propuesta de precio via STOMP.
   */
  enviarPropuestaPrecio(
    productoId: number | null,
    remitenteId: number,
    receptorId: number,
    precio: number,
    roomId: string,
  ): void {
    if (this.client?.connected) {
      this.client.publish({
        destination: '/app/chat.enviar',
        body: JSON.stringify({
          productoId,
          remitenteId,
          receptorId,
          tipo: 'OFERTA_PRECIO',
          precioPropuesto: precio,
          roomId,
        }),
      });
    }
  }

  /**
   * Enviar GIF via STOMP.
   */
  enviarGif(
    productoId: number | null,
    remitenteId: number,
    receptorId: number,
    mediaUrl: string,
    roomId: string,
  ): void {
    if (this.client?.connected) {
      this.client.publish({
        destination: '/app/chat.enviar',
        body: JSON.stringify({
          productoId,
          remitenteId,
          receptorId,
          tipo: 'GIF',
          mediaUrl,
          roomId,
        }),
      });
    }
  }

  /**
   * Suscribirse al topic de lectura para saber cuándo el otro usuario lee mis mensajes.
   */
  suscribirseALeidos(roomId: string): void {
    const topicKey = `/topic/chat/${roomId}/leidos`;
    if (!this.client?.connected || this.subscribedTopics.has(topicKey)) return;

    this.subscribedTopics.add(topicKey);
    this.client.subscribe(topicKey, (msg) => {
      this.leidos$.next(JSON.parse(msg.body));
    });
  }

  /**
   * Suscribirse al topic de recibido para saber cuándo el otro usuario recibe mis mensajes.
   */
  suscribirseARecibidos(roomId: string): void {
    const topicKey = `/topic/chat/${roomId}/recibidos`;
    if (!this.client?.connected || this.subscribedTopics.has(topicKey)) return;

    this.subscribedTopics.add(topicKey);
    this.client.subscribe(topicKey, (msg) => {
      this.recibidos$.next(JSON.parse(msg.body));
    });
  }

  /**
   * Notificar al backend que he recibido los mensajes de una sala (los tengo cargados o me han llegado por WS).
   */
  marcarComoRecibido(roomId: string, usuarioId: number): void {
    if (this.client?.connected) {
      this.client.publish({
        destination: '/app/chat.recibido',
        body: JSON.stringify({ roomId, usuarioId }),
      });
    }
  }

  /**
   * Notificar al backend que he leído los mensajes de una sala.
   * Destination: /app/chat.leer (según ChatWebSocketController.java)
   */
  marcarComoLeido(roomId: string, usuarioId: number): void {
    if (this.client?.connected) {
      this.client.publish({
        destination: '/app/chat.leer',
        body: JSON.stringify({ roomId, usuarioId }),
      });
    }
  }

  notificarEscribiendo(productoId: number | null, remitenteId: number, roomId: string): void {
    if (this.client?.connected) {
      this.client.publish({
        destination: '/app/chat.escribiendo',
        body: JSON.stringify({
          productoId,
          roomId,
          remitenteId,
          escribiendo: true,
        }),
      });
    }
  }

  get isConnected(): boolean {
    return this.client?.connected ?? false;
  }
}
