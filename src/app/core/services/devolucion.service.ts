import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Devolucion {
  id: number;
  estado: string;
  motivo: string;
  descripcion: string;
  fechaSolicitud: string;
  fechaResolucion?: string;
  notaVendedor?: string;
  transportistaDevolucion?: string;
  trackingDevolucion?: string;
  evidencias: { id: number; urlImagen: string }[];
  compra: any; // O el tipo completo de Compra
}

@Injectable({ providedIn: 'root' })
export class DevolucionService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/devolucion`;

  getComoComprador(usuarioId: number): Observable<Devolucion[]> {
    return this.http.get<Devolucion[]>(`${this.url}/comprador/${usuarioId}`);
  }

  getComoVendedor(usuarioId: number): Observable<Devolucion[]> {
    return this.http.get<Devolucion[]>(`${this.url}/vendedor/${usuarioId}`);
  }

  getById(id: number): Observable<Devolucion> {
    return this.http.get<Devolucion>(`${this.url}/${id}`); // El backend parece no tener el endpoint /devolucion/:id pero podemos probar si lo tiene, o si se saca de otra parte.
    // Ojo: DevolucionController no tiene un GET /{id}. Lo tendré que añadir al backend luego si no está.
  }

  solicitar(data: FormData): Observable<Devolucion> {
    return this.http.post<Devolucion>(`${this.url}/solicitar`, data);
  }

  responder(id: number, aceptada: boolean, nota: string): Observable<Devolucion> {
    return this.http.post<Devolucion>(`${this.url}/${id}/responder`, { aceptada, nota });
  }

  marcarEnviada(id: number, transportista: string, tracking: string): Observable<Devolucion> {
    return this.http.post<Devolucion>(`${this.url}/${id}/enviada`, { transportista, tracking });
  }

  completar(id: number): Observable<any> {
    return this.http.post<any>(`${this.url}/${id}/completar`, {});
  }
}
