import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/enviroment';

export interface SoporteMsg {
  id: number;
  rol: string;
  contenido: string;
  creadoEn: string;
}

@Injectable({ providedIn: 'root' })
export class SupportChatService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/soporte/chat`;

  crearSesion(usuarioId?: number): Observable<{ sessionId: number; sessionToken: string; mensajes: SoporteMsg[] }> {
    const body: Record<string, number> = {};
    if (usuarioId != null) body['usuarioId'] = usuarioId;
    return this.http.post<{ sessionId: number; sessionToken: string; mensajes: SoporteMsg[] }>(
      `${this.base}/session`,
      body,
    );
  }

  enviar(sessionToken: string, text: string): Observable<{
    mensajes: SoporteMsg[];
    humanTakeover?: boolean;
    escalationEmail?: string;
  }> {
    return this.http.post<{
      mensajes: SoporteMsg[];
      humanTakeover?: boolean;
      escalationEmail?: string;
    }>(`${this.base}/message`, { sessionToken, text });
  }

  poll(sessionToken: string): Observable<SoporteMsg[]> {
    return this.http.get<SoporteMsg[]>(`${this.base}/session/${sessionToken}/messages`);
  }
}
