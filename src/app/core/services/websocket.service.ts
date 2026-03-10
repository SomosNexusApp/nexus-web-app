import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/enviroment';
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

  private mensajes$ = new Subject<ChatMensaje>();
  private notificaciones$ = new Subject<Notificacion>();

  readonly mensajes = this.mensajes$.asObservable();
  readonly notificaciones = this.notificaciones$.asObservable();

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
        });
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
   * Indicador "está escribiendo..."
   * Destination: /app/chat.escribiendo (según ChatWebSocketController.java)
   */
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
