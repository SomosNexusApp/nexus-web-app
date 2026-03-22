import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/enviroment';
import { Observable } from 'rxjs';
import { AuthStore } from '../auth/auth-store';

@Injectable({
  providedIn: 'root'
})
export class BloqueoService {
  private http = inject(HttpClient);
  private authStore = inject(AuthStore);

  bloquearUsuario(bloqueadoId: number, motivo: string = ''): Observable<any> {
    const bloqueadorId = this.authStore.user()?.id;
    if (!bloqueadorId) throw new Error('No estás logueado');

    const params = new HttpParams()
      .set('bloqueadorId', bloqueadorId.toString())
      .set('bloqueadoId', bloqueadoId.toString())
      .set('motivo', motivo);

    return this.http.post(`${environment.apiUrl}/bloqueo`, {}, { params });
  }

  desbloquear(bloqueadoId: number): Observable<any> {
    const bloqueadorId = this.authStore.user()?.id;
    if (!bloqueadorId) throw new Error('No estás logueado');

    const params = new HttpParams()
      .set('bloqueadorId', bloqueadorId.toString())
      .set('bloqueadoId', bloqueadoId.toString());

    return this.http.delete(`${environment.apiUrl}/bloqueo`, { params });
  }

  estaBloqueado(bloqueadoId: number): Observable<{ bloqueado: boolean }> {
    const bloqueadorId = this.authStore.user()?.id;
    if (!bloqueadorId) throw new Error('No estás logueado');

    const params = new HttpParams()
      .set('bloqueadorId', bloqueadorId.toString())
      .set('bloqueadoId', bloqueadoId.toString());

    return this.http.get<{ bloqueado: boolean }>(`${environment.apiUrl}/bloqueo/comprobar`, { params });
  }

  getIdsBloqueados(): Observable<number[]> {
    const usuarioId = this.authStore.user()?.id;
    if (!usuarioId) throw new Error('No estás logueado');
    return this.http.get<number[]>(`${environment.apiUrl}/bloqueo/${usuarioId}`);
  }
}
