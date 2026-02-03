import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProductoService } from './producto-service';
import { OfertaService } from './oferta-service';
import { NexusItem } from '../models/nexus-item';

@Injectable({
  providedIn: 'root'
})
export class FeedService {

  constructor(
    private productoService: ProductoService,
    private ofertaService: OfertaService
  ) {}

  getUnifiedFeed(): Observable<NexusItem[]> {
    return forkJoin({
      productos: this.productoService.getDisponibles(), // Usamos solo disponibles
      ofertas: this.ofertaService.getAll()
    }).pipe(
      map(response => {
        const feed: NexusItem[] = [
          ...(response.productos || []),
          ...(response.ofertas || [])
        ];
        return feed.sort(() => Math.random() - 0.5);
      })
    );
  }
}