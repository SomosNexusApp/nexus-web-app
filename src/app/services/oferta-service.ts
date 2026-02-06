import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Oferta, FiltroOferta } from '../models/oferta';

@Injectable({
  providedIn: 'root'
})
export class OfertaService {
  private apiUrl = `${environment.apiUrl}/oferta`;

  constructor(private http: HttpClient) {}

  // Listar con filtros dinámicos
  filtrar(filtro: FiltroOferta): Observable<{ ofertas: Oferta[], totalPaginas: number, totalElementos: number }> {
    let params = new HttpParams();
    
    if (filtro.categoria) params = params.set('categoria', filtro.categoria);
    if (filtro.tienda) params = params.set('tienda', filtro.tienda);
    if (filtro.precioMinimo !== undefined) params = params.set('precioMin', filtro.precioMinimo.toString());
    if (filtro.precioMaximo !== undefined) params = params.set('precioMax', filtro.precioMaximo.toString());
    if (filtro.busqueda) params = params.set('busqueda', filtro.busqueda);
    if (filtro.soloActivas !== undefined) params = params.set('soloActivas', filtro.soloActivas.toString());
    if (filtro.ordenarPor) params = params.set('ordenarPor', filtro.ordenarPor);
    if (filtro.direccion) params = params.set('direccion', filtro.direccion);
    if (filtro.pagina !== undefined) params = params.set('pagina', filtro.pagina.toString());
    if (filtro.tamañoPagina) params = params.set('tamañoPagina', filtro.tamañoPagina.toString());
    
    return this.http.get<any>(`${this.apiUrl}/filtrar`, { params });
  }

  getAll(): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(this.apiUrl);
  }

  getById(id: number): Observable<Oferta> {
    return this.http.get<Oferta>(`${this.apiUrl}/${id}`);
  }

  getDestacadas(): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${this.apiUrl}/destacadas`);
  }

  getTrending(): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${this.apiUrl}/trending`);
  }

  getTopSpark(): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${this.apiUrl}/top-spark`);
  }

  getExpiranProx(): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${this.apiUrl}/expiran-pronto`);
  }

  votar(id: number, usuarioId: number, esSpark: boolean): Observable<any> {
    const params = new HttpParams()
      .set('usuarioId', usuarioId.toString())
      .set('esSpark', esSpark.toString());
    
    return this.http.post(`${this.apiUrl}/${id}/votar`, {}, { params });
  }

  compartir(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/compartir`, {});
  }

  crear(actorId: number, oferta: FormData): Observable<Oferta> {
    return this.http.post<Oferta>(`${this.apiUrl}/${actorId}`, oferta);
  }

  actualizar(id: number, oferta: FormData): Observable<Oferta> {
    return this.http.put<Oferta>(`${this.apiUrl}/${id}`, oferta);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}