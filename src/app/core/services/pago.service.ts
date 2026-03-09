import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/enviroment';

@Injectable({
  providedIn: 'root',
})
export class PagoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/pago`;

  getMetodosGuardados(usuarioId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${usuarioId}/metodos`);
  }

  crearSetupIntent(usuarioId: number): Observable<{ clientSecret: string }> {
    return this.http.post<{ clientSecret: string }>(`${this.apiUrl}/${usuarioId}/setup-intent`, {});
  }

  eliminarMetodo(paymentMethodId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/metodo/${paymentMethodId}`);
  }
}
