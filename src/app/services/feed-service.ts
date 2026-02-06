import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, combineLatest, map } from 'rxjs';
import { OfertaService } from './oferta-service';
import { ProductoService } from './producto-service';
import { Oferta } from '../guard/oferta';
import { Producto } from '../models/producto';

export interface FeedItem {
  tipo: 'oferta' | 'producto';
  data: Oferta | Producto;
  fecha: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FeedService {
  constructor(
    private ofertaService: OfertaService,
    private productoService: ProductoService
  ) {}

  // Feed unificado (Ofertas + Productos)
  getFeedPrincipal(): Observable<FeedItem[]> {
    return combineLatest([
      this.ofertaService.getAll(),
      this.productoService.getDisponibles()
    ]).pipe(
      map(([ofertas, productos]) => {
        const feedItems: FeedItem[] = [];
        
        // Convertir ofertas a FeedItem
        ofertas.forEach(oferta => {
          feedItems.push({
            tipo: 'oferta',
            data: oferta,
            fecha: new Date(oferta.fechaPublicacion || Date.now())
          });
        });
        
        // Convertir productos a FeedItem
        productos.forEach(producto => {
          feedItems.push({
            tipo: 'producto',
            data: producto,
            fecha: new Date() // Los productos no tienen fecha de publicación en tu modelo actual
          });
        });
        
        // Ordenar por fecha descendente
        return feedItems.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
      })
    );
  }

  // Feed personalizado (por categoría)
  getFeedPorCategoria(categoria: string): Observable<FeedItem[]> {
    return this.getFeedPrincipal().pipe(
      map(items => items.filter(item => {
        if (item.tipo === 'oferta') {
          return (item.data as Oferta).categoria === categoria;
        }
        return false; // Productos no tienen categoría en tu modelo
      }))
    );
  }

  // Feed destacados (Spark alto + Productos populares)
  getFeedDestacados(): Observable<FeedItem[]> {
    return combineLatest([
      this.ofertaService.getDestacadas(),
      this.productoService.getAll() // Podrías crear un método getDestacados() también
    ]).pipe(
      map(([ofertas, productos]) => {
        const feedItems: FeedItem[] = [];
        
        ofertas.forEach(oferta => {
          feedItems.push({
            tipo: 'oferta',
            data: oferta,
            fecha: new Date(oferta.fechaPublicacion || Date.now())
          });
        });
        
        // Filtrar productos más recientes o con mejor precio
        const productosRecientes = productos.slice(0, 10);
        productosRecientes.forEach(producto => {
          feedItems.push({
            tipo: 'producto',
            data: producto,
            fecha: new Date()
          });
        });
        
        return feedItems;
      })
    );
  }
}