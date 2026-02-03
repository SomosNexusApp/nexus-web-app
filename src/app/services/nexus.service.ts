import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { Producto, Oferta, NexusItem } from '../models/nexus.types';

@Injectable({
  providedIn: 'root'
})
export class NexusService {
  // Asumo que tu Spring Boot corre en el puerto 8080 por defecto
  private apiUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) { }

  // --- PRODUCTOS (Segunda Mano) ---
  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/producto/disponibles`);
  }

  getProductoById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/producto/${id}`);
  }

  // --- OFERTAS (Chollos) ---
  getOfertas(): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${this.apiUrl}/oferta`);
  }

  getOfertaById(id: number): Observable<Oferta> {
    return this.http.get<Oferta>(`${this.apiUrl}/oferta/${id}`);
  }

  // --- EL CEREBRO DEL FEED (Mezcla ambos mundos) ---
  // Esta función llama a las dos APIs a la vez y junta los resultados
  getFeedUnificado(): Observable<NexusItem[]> {
    return forkJoin({
      productos: this.getProductos(),
      ofertas: this.getOfertas()
    }).pipe(
      map(response => {
        const listaProductos = response.productos || [];
        const listaOfertas = response.ofertas || [];
        
        // Unimos ambos arrays
        const feed: NexusItem[] = [...listaProductos, ...listaOfertas];

        // Opcional: Aquí podríamos mezclarlos aleatoriamente o por fecha
        // Por ahora los devolvemos juntos para que el componente filtre
        return feed.sort(() => Math.random() - 0.5); // Shuffle simple para demo visual
      })
    );
  }
}