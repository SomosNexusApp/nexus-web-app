import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Oferta } from '../models/oferta';

@Injectable({
  providedIn: 'root'
})
export class OfertaService {
  private endpoint = `${environment.apiUrl}/oferta`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(this.endpoint);
  }

  getById(id: number): Observable<Oferta> {
    return this.http.get<Oferta>(`${this.endpoint}/${id}`);
  }
}