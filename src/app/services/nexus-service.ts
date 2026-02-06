import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/enviroment';
import { Producto } from '../models/producto';
import { Oferta } from '../guard/oferta';

/**
 * Servicio unificado para acceder a productos y ofertas
 * Útil para vistas de detalle genéricas
 */
@Injectable({
  providedIn: 'root'
})
export class NexusService {
  private productoEndpoint = `${environment.apiUrl}/producto`;
  private ofertaEndpoint = `${environment.apiUrl}/oferta`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene un producto por ID
   */
  getProductoById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.productoEndpoint}/${id}`);
  }

  /**
   * Obtiene una oferta por ID
   */
  getOfertaById(id: number): Observable<Oferta> {
    return this.http.get<Oferta>(`${this.ofertaEndpoint}/${id}`);
  }

  /**
   * Busca en productos y ofertas simultáneamente
   */
  searchAll(query: string): Observable<{ productos: Producto[], ofertas: Oferta[] }> {
    return this.http.get<{ productos: Producto[], ofertas: Oferta[] }>(
      `${environment.apiUrl}/buscar?q=${encodeURIComponent(query)}`
    );
  }
}