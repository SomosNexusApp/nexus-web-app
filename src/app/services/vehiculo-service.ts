// src/app/services/vehiculo-service.ts (ACTUALIZADO)
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FiltroVehiculo {
  tipoVehiculo?: string;
  marca?: string;
  modelo?: string;
  anioMin?: number;
  anioMax?: number;
  kilometrosMax?: number;
  precioMin?: number;
  precioMax?: number;
  combustible?: string;
  cambio?: string;
  pagina?: number;
  tamañoPagina?: number;
}

@Injectable({
  providedIn: 'root'
})
export class VehiculoService {
  private apiUrl = `${environment.apiUrl}/vehiculo`;

  constructor(private http: HttpClient) {}

  filtrar(filtro: FiltroVehiculo): Observable<any> {
    let params = new HttpParams();
    
    Object.keys(filtro).forEach(key => {
      const value = (filtro as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });
    
    return this.http.get<any>(`${this.apiUrl}/filtrar`, { params });
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getMarcasDisponibles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/marcas`);
  }

  getModelosPorMarca(marca: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/modelos/${marca}`);
  }
}