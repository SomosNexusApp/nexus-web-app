import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/enviroment';
import { Notificacion } from '../models/notificacion';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private apiUrl = `${environment.apiUrl}/notificacion`;

  constructor(private http: HttpClient) {}

  // Todas las notificaciones
  getByUsuario(usuarioId: number): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  // Solo no leídas
  getNoLeidas(usuarioId: number): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${this.apiUrl}/usuario/${usuarioId}/no-leidas`);
  }

  // Contador de no leídas
  contarNoLeidas(usuarioId: number): Observable<{ noLeidas: number }> {
    return this.http.get<{ noLeidas: number }>(`${this.apiUrl}/usuario/${usuarioId}/contador`);
  }

  // Marcar como leída
  marcarLeida(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/leer`, {});
  }

  // Marcar todas como leídas
  marcarTodasLeidas(usuarioId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuario/${usuarioId}/leer-todas`, {});
  }
}