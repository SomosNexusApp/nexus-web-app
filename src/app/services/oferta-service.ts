import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/enviroment';
import { Oferta, FiltroOfertaDTO, OfertaCreateDTO } from '../models/oferta';

@Injectable({
  providedIn: 'root'
})
export class OfertaService {
  private apiUrl = `${environment.apiUrl}/oferta`;

  constructor(private http: HttpClient) {}

  // Listar todas
  getAll(): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(this.apiUrl);
  }

  // Ver detalle (incrementa vistas automáticamente)
  getById(id: number): Observable<Oferta> {
    return this.http.get<Oferta>(`${this.apiUrl}/${id}`);
  }

  // Búsqueda con filtros avanzados
  filtrar(filtros: FiltroOfertaDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/filtrar`, filtros);
  }

  // Destacadas
  getDestacadas(): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${this.apiUrl}/destacadas`);
  }

  // Trending
  getTrending(): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${this.apiUrl}/trending`);
  }

  // Top Spark
  getTopSpark(): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${this.apiUrl}/top-spark`);
  }

  // Expiran pronto
  getExpiranProx(): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${this.apiUrl}/expiran-pronto`);
  }

  // ⚡ Votar (Spark/Drip)
  votar(id: number, usuarioId: number, esSpark: boolean): Observable<any> {
    const params = new HttpParams()
      .set('usuarioId', usuarioId.toString())
      .set('esSpark', esSpark.toString());
    
    return this.http.post(`${this.apiUrl}/${id}/votar`, {}, { params });
  }

  // Compartir
  compartir(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/compartir`, {});
  }

  // Crear oferta
  crear(actorId: number, oferta: OfertaCreateDTO, imagenPrincipal: File, galeria?: File[]): Observable<Oferta> {
    const formData = new FormData();
    formData.append('oferta', new Blob([JSON.stringify(oferta)], { type: 'application/json' }));
    formData.append('imagenPrincipal', imagenPrincipal);
    
    if (galeria && galeria.length > 0) {
      galeria.forEach(img => formData.append('galeria', img));
    }
    
    return this.http.post<Oferta>(`${this.apiUrl}/${actorId}`, formData);
  }

  // Actualizar
  actualizar(id: number, oferta: Partial<OfertaCreateDTO>, imagenPrincipal?: File, galeria?: File[]): Observable<Oferta> {
    const formData = new FormData();
    formData.append('oferta', new Blob([JSON.stringify(oferta)], { type: 'application/json' }));
    
    if (imagenPrincipal) {
      formData.append('imagenPrincipal', imagenPrincipal);
    }
    
    if (galeria && galeria.length > 0) {
      galeria.forEach(img => formData.append('galeria', img));
    }
    
    return this.http.put<Oferta>(`${this.apiUrl}/${id}`, formData);
  }

  // Eliminar
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}