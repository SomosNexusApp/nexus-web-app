import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/enviroment';
import { Favorito } from '../models/favorito';

@Injectable({
  providedIn: 'root'
})
export class FavoritoService {
  private apiUrl = `${environment.apiUrl}/favorito`;

  constructor(private http: HttpClient) {}

  // Obtener favoritos del usuario
  getByUsuario(usuarioId: number): Observable<Favorito[]> {
    return this.http.get<Favorito[]>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  // Guardar oferta como favorita
  guardarOferta(usuarioId: number, ofertaId: number): Observable<Favorito> {
    const params = new HttpParams()
      .set('usuarioId', usuarioId.toString())
      .set('ofertaId', ofertaId.toString());
    
    return this.http.post<Favorito>(`${this.apiUrl}/oferta`, {}, { params });
  }

  // Guardar producto como favorito
  guardarProducto(usuarioId: number, productoId: number): Observable<Favorito> {
    const params = new HttpParams()
      .set('usuarioId', usuarioId.toString())
      .set('productoId', productoId.toString());
    
    return this.http.post<Favorito>(`${this.apiUrl}/producto`, {}, { params });
  }

  // Eliminar favorito
  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}