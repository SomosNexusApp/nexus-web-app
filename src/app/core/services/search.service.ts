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
  precioMin?: number | string;
  precioMax?: number | string;
  condicion?: string;
  ubicacion?: string;
  conEnvio?: boolean;
  orden?: string;
  page?: number;
  size?: number;
  // Vehículos
  marca?: string;
  modelo?: string;
  anioMin?: number | string;
  anioMax?: number | string;
  kmMax?: number | string;
  combustible?: string;
  cambio?: string;
  tipoVehiculo?: string;
  potenciaMin?: number | string;
  cilindradaMin?: number | string;
  color?: string;
  numeroPuertas?: number | string;
  plazas?: number | string;
  garantia?: boolean;
  itv?: boolean;
}

/** Lo que devuelve buscar() al componente */
export interface SearchResult {
  items: SearchResultItem[];
  total: number;
}

export type SearchResultItem =
  | (Producto & { searchType: 'PRODUCTO' })
  | (Oferta & { searchType: 'OFERTA' })
  | (Vehiculo & { searchType: 'VEHICULO' });

@Injectable({ providedIn: 'root' })
export class SearchService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private marcasCache: string[] = [];
  private modelosCache: { [marca: string]: string[] } = {};

  // ─── MÉTODO PÚBLICO PRINCIPAL ───────────────────────────────────────────────

  buscar(params: SearchParams): Observable<SearchResult> {
    const tipo = params.tipo || 'TODOS';

    if (tipo === 'PRODUCTO') return this.buscarProductos(params);
    if (tipo === 'OFERTA') return this.buscarOfertas(params);
    if (tipo === 'VEHICULO') return this.buscarVehiculos(params);

    // TODOS → paralelo con forkJoin
    return forkJoin({
      productos: this.buscarProductos(params),
      ofertas: this.buscarOfertas(params),
      vehiculos: this.buscarVehiculos(params),
    }).pipe(
      map(({ productos, ofertas, vehiculos }) => ({
        items: this.ordenarResultados(
          [...productos.items, ...ofertas.items, ...vehiculos.items],
          params.orden,
        ),
        total: productos.total + ofertas.total + vehiculos.total,
      })),
    );
  }

  // ─── BÚSQUEDAS POR TIPO ─────────────────────────────────────────────────────

  /**
   * GET /producto/filtrar
   * Params backend: categoria, precioMin, precioMax, busqueda, ubicacion,
   *                 conEnvio, orden, garantia, itv, pagina, tamano
   * Respuesta:      { contenido, totalElementos, totalPaginas, paginaActual }
   */
  private buscarProductos(params: SearchParams): Observable<SearchResult> {
    let p = new HttpParams()
      .set('pagina', String(params.page ?? 0))
      .set('tamano', String(params.size ?? 20));

    if (params.q) p = p.set('busqueda', params.q);
    if (params.categoria) p = p.set('categoria', String(params.categoria));
    if (this.hasValue(params.precioMin)) p = p.set('precioMin', String(params.precioMin));
    if (this.hasValue(params.precioMax)) p = p.set('precioMax', String(params.precioMax));
    if (params.ubicacion) p = p.set('ubicacion', params.ubicacion);
    if (params.conEnvio) p = p.set('conEnvio', 'true');
    if (params.orden) p = p.set('orden', params.orden);

    return this.http.get<any>(`${this.apiUrl}/producto/filtrar`, { params: p }).pipe(
      map((res) => {
        const lista: any[] = res?.contenido ?? (Array.isArray(res) ? res : []);
        return {
          items: lista.map((item: any) => ({ ...item, searchType: 'PRODUCTO' as const })),
          total: res?.totalElementos ?? lista.length,
        };
      }),
      catchError(() => of({ items: [], total: 0 })),
    );
  }

  /**
   * GET /oferta/filtrar
   * Params backend: categoria, tienda, precioMin, precioMax, busqueda,
   *                 soloActivas, ordenarPor, direccion, pagina, tamañoPagina
   * Respuesta:      { ofertas, paginaActual, totalPaginas, totalElementos }
   */
  private buscarOfertas(params: SearchParams): Observable<SearchResult> {
    const { ordenarPor, direccion } = this.mapOrdenToOferta(params.orden);

    let p = new HttpParams()
      .set('pagina', String(params.page ?? 0))
      .set('tamañoPagina', String(params.size ?? 20))
      .set('soloActivas', 'true')
      .set('ordenarPor', ordenarPor)
      .set('direccion', direccion);

    if (params.q) p = p.set('busqueda', params.q);
    if (params.categoria) p = p.set('categoria', String(params.categoria));
    if (this.hasValue(params.precioMin)) p = p.set('precioMin', String(params.precioMin));
    if (this.hasValue(params.precioMax)) p = p.set('precioMax', String(params.precioMax));

    return this.http.get<any>(`${this.apiUrl}/oferta/filtrar`, { params: p }).pipe(
      map((res) => {
        // ⚠️ El backend devuelve la lista bajo la clave "ofertas", no "contenido"
        const lista: any[] = res?.ofertas ?? res?.contenido ?? (Array.isArray(res) ? res : []);
        return {
          items: lista.map((item: any) => ({ ...item, searchType: 'OFERTA' as const })),
          total: res?.totalElementos ?? lista.length,
        };
      }),
      catchError(() => of({ items: [], total: 0 })),
    );
  }

  /**
   * GET /vehiculo/filtrar
   * Params backend: tipo, marca, modelo, precioMin, precioMax, anioMin, anioMax,
   *                 kmMax, combustible, cambio, busqueda, potenciaMin, cilindradaMin,
   *                 color, numeroPuertas, plazas, garantia, itv, pagina, tamano
   * Respuesta:      { contenido, paginaActual, totalPaginas, totalElementos }
   */
  private buscarVehiculos(params: SearchParams): Observable<SearchResult> {
    let p = new HttpParams()
      .set('pagina', String(params.page ?? 0))
      .set('tamano', String(params.size ?? 20));

    if (params.q) p = p.set('busqueda', params.q);
    if (params.tipoVehiculo) p = p.set('tipo', params.tipoVehiculo);
    if (params.marca) p = p.set('marca', params.marca);
    if (params.modelo) p = p.set('modelo', params.modelo);
    if (params.combustible) p = p.set('combustible', params.combustible);
    if (params.cambio) p = p.set('cambio', params.cambio);
    if (params.color) p = p.set('color', params.color);
    if (this.hasValue(params.precioMin)) p = p.set('precioMin', String(params.precioMin));
    if (this.hasValue(params.precioMax)) p = p.set('precioMax', String(params.precioMax));
    if (this.hasValue(params.anioMin)) p = p.set('anioMin', String(params.anioMin));
    if (this.hasValue(params.anioMax)) p = p.set('anioMax', String(params.anioMax));
    if (this.hasValue(params.kmMax)) p = p.set('kmMax', String(params.kmMax));
    if (this.hasValue(params.potenciaMin)) p = p.set('potenciaMin', String(params.potenciaMin));
    if (this.hasValue(params.cilindradaMin))
      p = p.set('cilindradaMin', String(params.cilindradaMin));
    if (this.hasValue(params.numeroPuertas))
      p = p.set('numeroPuertas', String(params.numeroPuertas));
    if (this.hasValue(params.plazas)) p = p.set('plazas', String(params.plazas));
    if (params.garantia === true) p = p.set('garantia', 'true');
    if (params.itv === true) p = p.set('itv', 'true');

    return this.http.get<any>(`${this.apiUrl}/vehiculo/filtrar`, { params: p }).pipe(
      map((res) => {
        const lista: any[] = res?.contenido ?? (Array.isArray(res) ? res : []);
        return {
          items: lista.map((item: any) => ({ ...item, searchType: 'VEHICULO' as const })),
          total: res?.totalElementos ?? lista.length,
        };
      }),
      catchError(() => of({ items: [], total: 0 })),
    );
  }

  // ─── HELPERS ────────────────────────────────────────────────────────────────

  /** Valor no vacío y no nulo */
  private hasValue(v: any): boolean {
    return v !== null && v !== undefined && v !== '' && v !== 0;
  }

  /** Mapea el orden del frontend a los parámetros que acepta OfertaController */
  private mapOrdenToOferta(orden?: string): { ordenarPor: string; direccion: string } {
    switch (orden) {
      case 'precio_asc':
        return { ordenarPor: 'precioOferta', direccion: 'asc' };
      case 'precio_desc':
        return { ordenarPor: 'precioOferta', direccion: 'desc' };
      case 'reciente':
        return { ordenarPor: 'fechaPublicacion', direccion: 'desc' };
      case 'spark':
        return { ordenarPor: 'sparkScore', direccion: 'desc' };
      default:
        return { ordenarPor: 'fechaPublicacion', direccion: 'desc' };
    }
  }

  private ordenarResultados(items: SearchResultItem[], orden?: string): SearchResultItem[] {
    switch (orden) {
      case 'precio_asc':
        return [...items].sort((a, b) => this.getPrecio(a) - this.getPrecio(b));
      case 'precio_desc':
        return [...items].sort((a, b) => this.getPrecio(b) - this.getPrecio(a));
      case 'reciente':
        return [...items].sort(
          (a, b) =>
            new Date((b as any).fechaPublicacion || 0).getTime() -
            new Date((a as any).fechaPublicacion || 0).getTime(),
        );
      default:
        return items;
    }
  }

  private getPrecio(item: SearchResultItem): number {
    if (item.searchType === 'OFERTA') {
      return (item as any).precioOferta ?? (item as any).precioOriginal ?? 0;
    }
    return (item as any).precio ?? 0;
  }

  // ─── APIs EXTERNAS ───────────────────────────────────────────────────────────

  buscarUbicacionExterna(query: string): Observable<string[]> {
    if (!query || query.length < 3) return of([]);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=es&format=json&addressdetails=1&limit=5`;
    return this.http.get<any[]>(url).pipe(
      map((resultados) => {
        const lista = resultados.map((res) => {
          const addr = res.address;
          const localidad =
            addr.city || addr.town || addr.village || addr.municipality || 'Desconocido';
          const provincia = addr.county || addr.province || addr.state || '';
          return `${localidad}, ${provincia}`.trim().replace(/,\s*$/, '');
        });
        return Array.from(new Set(lista)) as string[];
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
    const key = marca.toLowerCase();
    if (this.modelosCache[key]) return of(this.modelosCache[key]);
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(key)}?format=json`;
    return this.http.get<any>(url).pipe(
      map((res) => {
        const modelos = res.Results.map((item: any) => this.capitalize(item.Model_Name)).sort();
        this.modelosCache[key] = Array.from(new Set(modelos)) as string[];
        return this.modelosCache[key];
      }),
      catchError(() => of([])),
    );
  }

  private capitalize(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
}
