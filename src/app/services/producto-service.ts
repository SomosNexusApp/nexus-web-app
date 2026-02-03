import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Producto } from '../models/producto';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private endpoint = `${environment.apiUrl}/producto`;

  constructor(private http: HttpClient) {}

  // Tu ProductoController tiene @GetMapping("/disponibles")
  getDisponibles(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.endpoint}/disponibles`);
  }

  getAll(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.endpoint);
  }

  getById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.endpoint}/${id}`);
  }
  
  create(producto: Producto, usuarioId: number): Observable<Producto> {
    // Tu controller usa @PostMapping("/publicar/{usuarioId}")
    return this.http.post<Producto>(`${this.endpoint}/publicar/${usuarioId}`, producto);
  }
}