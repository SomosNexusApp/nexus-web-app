import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/enviroment';
import { AuthStore } from '../auth/auth-store';

@Injectable({
  providedIn: 'root'
})
export class FavoritoService {
  private http = inject(HttpClient);
  private authStore = inject(AuthStore);

  getFavoritosIds(): Observable<number[]> {
    const user = this.authStore.user();
    if (!user) return of([]);
    return this.http.get<any[]>(`${environment.apiUrl}/api/favoritos/usuario/${user.id}`, { withCredentials: true }).pipe(
      map(favoritos => favoritos.filter(f => f.producto).map(f => f.producto.id))
    );
  }

  toggleFavorito(productoId: number): Observable<any> {
    const user = this.authStore.user();
    if (!user) return of(null);
    return this.http.get<any[]>(`${environment.apiUrl}/api/favoritos/usuario/${user.id}`, { withCredentials: true }).pipe(
      switchMap(favoritos => {
        const fav = favoritos.find(f => f.producto && f.producto.id === productoId);
        if (fav) {
          // Ya existe, eliminarlo
          return this.http.delete(`${environment.apiUrl}/api/favoritos/${fav.id}`, { withCredentials: true });
        } else {
          return this.http.post(`${environment.apiUrl}/api/favoritos/producto/${user.id}/${productoId}`, {}, { withCredentials: true }).pipe(
            catchError((err) => {
              if (err.status === 400 && err.error?.error?.includes('Ya está en favoritos')) {
                return of({ success: true, message: 'Ya estaba guardado' });
              }
              throw err;
            })
          );
        }
      })
    );
  }
}
