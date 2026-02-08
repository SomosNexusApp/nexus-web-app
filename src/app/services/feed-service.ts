import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, combineLatest, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { NexusItem } from '../models/nexus-item';
import { OfertaService } from './oferta-service';
import { ProductoService } from './producto-service';
import { Oferta } from '../models/oferta';

@Injectable({ providedIn: 'root' })
export class FeedService {
  private apiUrl = `${environment.apiUrl}/feed`; 

  constructor(
    private http: HttpClient,
    private ofertaService: OfertaService,
    private productoService: ProductoService
  ) {}

  getUnifiedFeed(): Observable<NexusItem[]> {
    return combineLatest([
      this.ofertaService.getAll(),
      this.productoService.getDisponibles()
    ]).pipe(
      map(([ofertas, productos]) => {
        const items: NexusItem[] = [...ofertas, ...productos];
        return items.sort((a, b) => {
          // Lógica de ordenación segura
          const dateA = 'fechaPublicacion' in a ? new Date(a.fechaPublicacion || 0) : new Date();
          const dateB = 'fechaPublicacion' in b ? new Date(b.fechaPublicacion || 0) : new Date();
          return dateB.getTime() - dateA.getTime();
        });
      })
    );
  }

  getFeedPrincipal(): Observable<NexusItem[]> {
    // CORREGIDO: Usar this.apiUrl, no 'this'
    return this.http.get<NexusItem[]>(`${this.apiUrl}/principal`);
  }

  getFeedTrending(): Observable<Oferta[]> {
    return this.ofertaService.getTrending();
  }

  getFeedDestacados(): Observable<Oferta[]> {
    return this.ofertaService.getDestacadas();
  }
}