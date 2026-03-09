import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/enviroment';
import { ChatMensaje } from './websocket.service';

export interface MensajeLegacy {
  id: number;
  texto: string;
  fechaCreacion: string;
  usuario: {
    id: number;
    nombre: string;
    username: string;
    avatarUrl?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getConversaciones(usuarioId: number): Observable<ChatMensaje[]> {
    return this.http.get<ChatMensaje[]>(`${this.apiUrl}/chat/conversaciones/${usuarioId}`);
  }

  getConversacion(
    productoId: number,
    usuario1Id: number,
    usuario2Id: number,
  ): Observable<ChatMensaje[]> {
    return this.http.get<ChatMensaje[]>(
      `${this.apiUrl}/chat/conversacion/${productoId}?usuario1Id=${usuario1Id}&usuario2Id=${usuario2Id}`,
    );
  }

  marcarLeidos(productoId: number, receptorId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/chat/leer/${productoId}?receptorId=${receptorId}`, {});
  }

  /**
   * Enviar un mensaje de texto por REST (fallback cuando WebSocket no está conectado).
   */
  enviarTexto(
    productoId: number,
    remitenteId: number,
    receptorId: number,
    texto: string,
  ): Observable<ChatMensaje> {
    return this.http.post<ChatMensaje>(`${this.apiUrl}/chat/texto`, {
      productoId,
      remitenteId,
      receptorId,
      texto,
    });
  }

  subirMedia(
    productoId: number,
    remitenteId: number,
    receptorId: number,
    tipo: string,
    archivo: File | Blob,
    duracion = 0,
  ): Observable<ChatMensaje> {
    const fd = new FormData();
    fd.append('productoId', productoId.toString());
    fd.append('remitenteId', remitenteId.toString());
    fd.append('receptorId', receptorId.toString());
    fd.append('tipo', tipo);
    fd.append('duracion', duracion.toString());
    fd.append('archivo', archivo, archivo instanceof File ? archivo.name : 'audio.webm');

    return this.http.post<ChatMensaje>(`${this.apiUrl}/chat/media`, fd);
  }

  responderPropuesta(mensajeId: number, aceptada: boolean): Observable<ChatMensaje> {
    return this.http.patch<ChatMensaje>(
      `${this.apiUrl}/chat/propuesta/${mensajeId}/responder?aceptada=${aceptada}`,
      {},
    );
  }

  // Compatibilidad legacy
  getMensajesLegacy(productoId: number): Observable<MensajeLegacy[]> {
    return this.http.get<MensajeLegacy[]>(`${this.apiUrl}/mensaje/producto/${productoId}`);
  }
}
