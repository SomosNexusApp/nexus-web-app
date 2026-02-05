import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ProductoService } from './producto-service';
import { OfertaService } from './oferta-service';
import { NexusItem } from '../models/nexus-item';
import { Producto } from '../models/producto';
import { Oferta } from '../models/oferta';
import { environment } from '../../environments/enviroment';
export type FeedFilter = 'all' | 'deals' | 'secondhand' | 'trending' | 'recent';

@Injectable({
  providedIn: 'root'
})
export class FeedService {

  constructor(
    private productoService: ProductoService,
    private ofertaService: OfertaService
  ) {}

  /**
   * Obtiene el feed unificado de productos y ofertas
   * Maneja errores gracefully y siempre retorna datos
   */
  getUnifiedFeed(): Observable<NexusItem[]> {
    return forkJoin({
      productos: this.productoService.getDisponibles().pipe(
        catchError(error => {
          console.error('Error cargando productos:', error);
          return of([] as Producto[]);
        })
      ),
      ofertas: this.ofertaService.getAll().pipe(
        catchError(error => {
          console.error('Error cargando ofertas:', error);
          return of([] as Oferta[]);
        })
      )
    }).pipe(
      map(response => {
        const feed: NexusItem[] = [
          ...(response.productos || []),
          ...(response.ofertas || [])
        ];
        // Mezclar aleatoriamente
        return this.shuffleArray(feed);
      })
    );
  }

  /**
   * Obtiene solo productos disponibles
   */
  getProductosFeed(): Observable<Producto[]> {
    return this.productoService.getDisponibles().pipe(
      catchError(error => {
        console.error('Error cargando productos:', error);
        return of([] as Producto[]);
      })
    );
  }

  /**
   * Obtiene solo ofertas
   */
  getOfertasFeed(): Observable<Oferta[]> {
    return this.ofertaService.getAll().pipe(
      catchError(error => {
        console.error('Error cargando ofertas:', error);
        return of([] as Oferta[]);
      })
    );
  }

  /**
   * Obtiene ofertas flash (que expiran pronto)
   */
  getFlashDeals(): Observable<Oferta[]> {
    return this.ofertaService.getProximasExpirar().pipe(
      catchError(error => {
        console.error('Error cargando ofertas flash:', error);
        return of([] as Oferta[]);
      })
    );
  }

  /**
   * Obtiene los mejores descuentos
   */
  getBestDeals(): Observable<Oferta[]> {
    return this.ofertaService.getMejoresDescuentos().pipe(
      catchError(error => {
        console.error('Error cargando mejores descuentos:', error);
        return of([] as Oferta[]);
      })
    );
  }

  /**
   * Filtra items del feed según el tipo
   */
  filterFeed(items: NexusItem[], filter: FeedFilter): NexusItem[] {
    switch (filter) {
      case 'all':
        return items;
      
      case 'deals':
        return items.filter(item => this.isOferta(item));
      
      case 'secondhand':
        return items.filter(item => !this.isOferta(item));
      
      case 'trending':
        // Ordenar por algún criterio de tendencia (ej: precio más bajo, descuento mayor)
        return this.sortByTrending(items);
      
      case 'recent':
        // Ordenar por fecha de publicación (más recientes primero)
        return this.sortByRecent(items);
      
      default:
        return items;
    }
  }

  /**
   * Type guard para distinguir ofertas
   */
  private isOferta(item: NexusItem): boolean {
    return (item as Oferta).precioOferta !== undefined;
  }

  /**
   * Ordena por "trending" (ofertas con mejor descuento primero)
   */
  private sortByTrending(items: NexusItem[]): NexusItem[] {
    return [...items].sort((a, b) => {
      const discountA = this.getDiscountPercentage(a);
      const discountB = this.getDiscountPercentage(b);
      return discountB - discountA;
    });
  }

  /**
   * Ordena por fecha (más recientes primero)
   */
  private sortByRecent(items: NexusItem[]): NexusItem[] {
    return [...items].sort((a, b) => {
      const dateA = this.getPublicationDate(a);
      const dateB = this.getPublicationDate(b);
      return dateB.getTime() - dateA.getTime();
    });
  }

  /**
   * Calcula el porcentaje de descuento
   */
  private getDiscountPercentage(item: NexusItem): number {
    if (this.isOferta(item)) {
      const oferta = item as Oferta;
      if (oferta.precioOriginal > 0) {
        return ((oferta.precioOriginal - oferta.precioOferta) / oferta.precioOriginal) * 100;
      }
    }
    return 0;
  }

  /**
   * Obtiene la fecha de publicación
   */
  private getPublicationDate(item: NexusItem): Date {
    const fechaStr = (item as any).fechaPublicacion || (item as any).fechaRegistro;
    return fechaStr ? new Date(fechaStr) : new Date(0);
  }

  /**
   * Mezcla aleatoriamente un array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}