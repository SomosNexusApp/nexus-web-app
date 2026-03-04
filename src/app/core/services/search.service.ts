import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { Producto } from '../../models/producto.model';
import { Oferta } from '../../models/oferta.model';
import { Vehiculo } from '../../models/vehiculo.model';
import { environment } from '../../../environments/enviroment';

export interface SearchParams {
  q?: string;
  tipo?: 'TODOS' | 'PRODUCTO' | 'OFERTA' | 'VEHICULO';
  categoria?: number | string;
  precioMin?: number;
  precioMax?: number;
  condicion?: string;
  ubicacion?: string;
  conEnvio?: boolean;
  orden?: string;
  page?: number;
  size?: number;
  // Específicos de Vehículos
  marca?: string;
  modelo?: string;
  anioMin?: number;
  anioMax?: number;
  kmMax?: number;
  combustible?: string;
  cambio?: string;
  tipoVehiculo?: string;
  potenciaMin?: number;
  cilindradaMin?: number;
  color?: string;
  numeroPuertas?: number;
  plazas?: number;
  garantia?: boolean;
  itv?: boolean;
}

export type SearchResultItem =
  | (Producto & { searchType: 'PRODUCTO' })
  | (Oferta & { searchType: 'OFERTA' })
  | (Vehiculo & { searchType: 'VEHICULO' });

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private marcasCache: string[] = [];
  private modelosCache: { [marca: string]: string[] } = {};

  buscar(params: SearchParams): Observable<SearchResultItem[]> {
    const httpParams = this.buildHttpParams(params);
    const tipo = params.tipo || 'TODOS';

    // Llamadas corregidas a los endpoints Singulares + /filtrar
    // Y lectura del campo "contenido" del Pageable de Spring Boot
    const reqProductos = this.http
      .get<any>(`${this.apiUrl}/producto/filtrar`, { params: httpParams })
      .pipe(
        map((res) => {
          const lista = res.contenido || res || [];
          return lista.map((p: any) => ({ ...p, searchType: 'PRODUCTO' as const }));
        }),
        catchError(() => of([] as SearchResultItem[])),
      );

    const reqOfertas = this.http
      .get<any>(`${this.apiUrl}/oferta/filtrar`, { params: httpParams })
      .pipe(
        map((res) => {
          const lista = res.contenido || res || [];
          return lista.map((o: any) => ({ ...o, searchType: 'OFERTA' as const }));
        }),
        catchError(() => of([] as SearchResultItem[])),
      );

    const reqVehiculos = this.http
      .get<any>(`${this.apiUrl}/vehiculo/filtrar`, { params: httpParams })
      .pipe(
        map((res) => {
          const lista = res.contenido || res || [];
          return lista.map((v: any) => ({ ...v, searchType: 'VEHICULO' as const }));
        }),
        catchError(() => of([] as SearchResultItem[])),
      );

    if (tipo === 'PRODUCTO') return reqProductos;
    if (tipo === 'OFERTA') return reqOfertas;
    if (tipo === 'VEHICULO') return reqVehiculos;

    return forkJoin({
      productos: reqProductos,
      ofertas: reqOfertas,
      vehiculos: reqVehiculos,
    }).pipe(
      map(({ productos, ofertas, vehiculos }) => {
        const mezclados: SearchResultItem[] = [...productos, ...ofertas, ...vehiculos];
        return this.ordenarResultados(mezclados, params.orden);
      }),
    );
  }

  private buildHttpParams(params: SearchParams): HttpParams {
    let httpParams = new HttpParams();

    // Mapeo básico común
    const baseParams: any = {
      busqueda: params.q || '',
      pagina: params.page || 0,
      tamano: params.size || 20,
      precioMin: params.precioMin || '',
      precioMax: params.precioMax || '',
      ubicacion: params.ubicacion || '',
      categoria: params.categoria || '',
      orden: params.orden || 'relevancia',
    };

    // Filtros que SOLO deben ir si el tipo es VEHICULO
    if (params.tipo === 'VEHICULO') {
      baseParams.marca = params.marca || '';
      baseParams.combustible = params.combustible || '';
      baseParams.garantia = params.garantia || false;
      baseParams.itv = params.itv || false;
    } else {
      // Filtros que SOLO deben ir si NO es VEHICULO
      baseParams.conEnvio = params.conEnvio || false;
    }

    Object.entries(baseParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return httpParams;
  }

  private ordenarResultados(items: SearchResultItem[], orden?: string): SearchResultItem[] {
    switch (orden) {
      case 'precio_asc':
        return items.sort((a, b) => this.getPrecio(a) - this.getPrecio(b));
      case 'precio_desc':
        return items.sort((a, b) => this.getPrecio(b) - this.getPrecio(a));
      case 'reciente':
        return items.sort(
          (a, b) =>
            new Date(b.fechaPublicacion || 0).getTime() -
            new Date(a.fechaPublicacion || 0).getTime(),
        );
      case 'relevancia':
      default:
        return items;
    }
  }

  private getPrecio(item: SearchResultItem): number {
    if (item.searchType === 'OFERTA') return item.precioOferta || item.precioOriginal || 0;
    return item.precio || 0;
  }

  // --- Integraciones APIs Externas ---
  buscarUbicacionExterna(query: string): Observable<string[]> {
    if (!query || query.length < 3) return of([]);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=es&format=json&addressdetails=1&limit=5`;
    return this.http.get<any[]>(url).pipe(
      map((resultados: any[]) => {
        const lista = resultados.map((res) => {
          const address = res.address;
          const localidad =
            address.city ||
            address.town ||
            address.village ||
            address.municipality ||
            'Desconocido';
          const provincia = address.county || address.province || address.state || '';
          return `${localidad}, ${provincia}`.trim().replace(/,\s*$/, '');
        });
        return Array.from(new Set(lista));
      }),
      catchError(() => of([])),
    );
  }

  getMarcasVehiculos(): Observable<string[]> {
    if (this.marcasCache.length > 0) return of(this.marcasCache);
    const url = 'https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json';
    return this.http.get<any>(url).pipe(
      map((res) => {
        const marcas = res.Results.map((item: any) => this.capitalize(item.MakeName)).sort();
        this.marcasCache = Array.from(new Set(marcas)) as string[];
        return this.marcasCache;
      }),
      catchError(() =>
        of(['Audi', 'BMW', 'Ford', 'Mercedes-Benz', 'Renault', 'Seat', 'Toyota', 'Volkswagen']),
      ),
    );
  }

  getModelosPorMarca(marca: string): Observable<string[]> {
    if (!marca) return of([]);
    const marcaFormat = marca.toLowerCase();
    if (this.modelosCache[marcaFormat]) return of(this.modelosCache[marcaFormat]);
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(marcaFormat)}?format=json`;
    return this.http.get<any>(url).pipe(
      map((res) => {
        const modelos = res.Results.map((item: any) => this.capitalize(item.Model_Name)).sort();
        this.modelosCache[marcaFormat] = Array.from(new Set(modelos)) as string[];
        return this.modelosCache[marcaFormat];
      }),
      catchError(() => of([])),
    );
  }

  private capitalize(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
}
