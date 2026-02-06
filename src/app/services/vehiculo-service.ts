import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Vehiculo, FiltroVehiculo } from '../models/vehiculo';

@Injectable({
  providedIn: 'root'
})
export class VehiculoService {
  private apiUrl = `${environment.apiUrl}/vehiculo`;

  constructor(private http: HttpClient) {}

  // Búsqueda con filtros extensos
  filtrar(filtro: FiltroVehiculo): Observable<{ vehiculos: Vehiculo[], totalPaginas: number, totalElementos: number }> {
    let params = new HttpParams();
    
    if (filtro.tipoVehiculo) params = params.set('tipoVehiculo', filtro.tipoVehiculo);
    if (filtro.marca) params = params.set('marca', filtro.marca);
    if (filtro.modelo) params = params.set('modelo', filtro.modelo);
    if (filtro.anioMin !== undefined) params = params.set('anioMin', filtro.anioMin.toString());
    if (filtro.anioMax !== undefined) params = params.set('anioMax', filtro.anioMax.toString());
    if (filtro.kilometrosMax !== undefined) params = params.set('kilometrosMax', filtro.kilometrosMax.toString());
    if (filtro.precioMin !== undefined) params = params.set('precioMin', filtro.precioMin.toString());
    if (filtro.precioMax !== undefined) params = params.set('precioMax', filtro.precioMax.toString());
    if (filtro.combustible) params = params.set('combustible', filtro.combustible);
    if (filtro.cilindradaMin !== undefined) params = params.set('cilindradaMin', filtro.cilindradaMin.toString());
    if (filtro.cilindradaMax !== undefined) params = params.set('cilindradaMax', filtro.cilindradaMax.toString());
    if (filtro.potenciaMin !== undefined) params = params.set('potenciaMin', filtro.potenciaMin.toString());
    if (filtro.potenciaMax !== undefined) params = params.set('potenciaMax', filtro.potenciaMax.toString());
    if (filtro.cambio) params = params.set('cambio', filtro.cambio);
    if (filtro.numPuertasMin !== undefined) params = params.set('numPuertasMin', filtro.numPuertasMin.toString());
    if (filtro.color) params = params.set('color', filtro.color);
    if (filtro.soloSegundaMano !== undefined) params = params.set('soloSegundaMano', filtro.soloSegundaMano.toString());
    if (filtro.conITV !== undefined) params = params.set('conITV', filtro.conITV.toString());
    if (filtro.estadoMinimo) params = params.set('estadoMinimo', filtro.estadoMinimo);
    if (filtro.ordenarPor) params = params.set('ordenarPor', filtro.ordenarPor);
    if (filtro.direccion) params = params.set('direccion', filtro.direccion);
    if (filtro.pagina !== undefined) params = params.set('pagina', filtro.pagina.toString());
    if (filtro.tamañoPagina) params = params.set('tamañoPagina', filtro.tamañoPagina.toString());
    
    // Extras (array)
    if (filtro.extras && filtro.extras.length > 0) {
      filtro.extras.forEach(extra => {
        params = params.append('extras', extra);
      });
    }
    
    return this.http.get<any>(`${this.apiUrl}/filtrar`, { params });
  }

  getAll(): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(this.apiUrl);
  }

  getById(id: number): Observable<Vehiculo> {
    return this.http.get<Vehiculo>(`${this.apiUrl}/${id}`);
  }

  getMarcasDisponibles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/marcas`);
  }

  getModelosPorMarca(marca: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/modelos/${marca}`);
  }

  publicar(usuarioId: number, vehiculo: FormData): Observable<Vehiculo> {
    return this.http.post<Vehiculo>(`${this.apiUrl}/publicar/${usuarioId}`, vehiculo);
  }

  actualizar(id: number, vehiculo: FormData): Observable<Vehiculo> {
    return this.http.put<Vehiculo>(`${this.apiUrl}/${id}`, vehiculo);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}