import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SoporteMsg {
  id: number;
  rol: string;
  contenido: string;
  tipoContenido?: string;
  referenciaId?: number;
  creadoEn: string;
}

export interface SoporteSesionRes {
  sessionId: number;
  sessionToken: string;
  status: string;
  mensajes: SoporteMsg[];
}

@Injectable({ providedIn: 'root' })
export class SupportChatService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/soporte/chat`;

  crearSesion(usuarioId?: number): Observable<SoporteSesionRes> {
    const body: Record<string, number> = {};
    if (usuarioId != null) body['usuarioId'] = usuarioId;
    return this.http.post<SoporteSesionRes>(`${this.base}/session`, body);
  }

  enviar(sessionToken: string, text: string): Observable<{
    mensajes: SoporteMsg[];
    status: string;
    humanTakeover?: boolean;
    escalationEmail?: string;
  }> {
    return this.http.post<{
      mensajes: SoporteMsg[];
      status: string;
      humanTakeover?: boolean;
      escalationEmail?: string;
    }>(`${this.base}/message`, { sessionToken, text });
  }

  poll(sessionToken: string): Observable<SoporteMsg[]> {
    return this.http.get<SoporteMsg[]>(`${this.base}/session/${sessionToken}/messages`);
  }

  enviarEncuesta(sessionToken: string, valoracion: number, comentario?: string): Observable<void> {
    return this.http.post<void>(`${this.base}/session/survey`, { sessionToken, valoracion, comentario });
  }
}
