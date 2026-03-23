import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/enviroment';
import { AuthStore } from '../auth/auth-store';

@Injectable({
  providedIn: 'root',
})
export class FavoritoService {
  private http = inject(HttpClient);
  private authStore = inject(AuthStore);

  // Cache para IDs de favoritos
  private favoritosIdsSignal = signal<number[]>([]);
  private cargandoFavoritos = false;
  private favoritosObservable$: Observable<number[]> | null = null;

  getFavoritosIds(): Observable<number[]> {
    const user = this.authStore.user();
    if (!user) return of([]);

    // Si ya tenemos un observable en vuelo, lo devolvemos
    if (this.favoritosObservable$) return this.favoritosObservable$;

    // Si ya tenemos los IDs en el signal, los devolvemos como observable
    if (this.favoritosIdsSignal().length > 0) return of(this.favoritosIdsSignal());

    // Si no, hacemos la petición y la compartimos
    this.favoritosObservable$ = this.http
      .get<any[]>(`${environment.apiUrl}/api/favoritos/usuario/${user.id}`, { withCredentials: true })
      .pipe(
        map((favoritos) => favoritos.filter((f) => f.producto).map((f) => f.producto.id)),
        tap((ids) => {
          this.favoritosIdsSignal.set(ids);
          this.favoritosObservable$ = null; // Limpiamos el observable al terminar
        }),
        shareReplay(1),
      );

    return this.favoritosObservable$;
  }

  // Método para invalidar el cache (útil después de añadir/quitar)
  private clearCache(): void {
    this.favoritosIdsSignal.set([]);
    this.favoritosObservable$ = null;
  }

  // Sustituimos el toggle complejo por métodos directos
  addFavorito(productoId: number): Observable<any> {
    const user = this.authStore.user();
    if (!user) return of(null);
    return this.http.post(
      `${environment.apiUrl}/api/favoritos/producto/${user.id}/${productoId}`,
      {},
      { withCredentials: true },
    ).pipe(
      tap(() => {
        // Actualizamos localmente el signal para feedback instantáneo global
        this.favoritosIdsSignal.update(ids => [...ids, productoId]);
      })
    );
  }

  removeFavorito(productoId: number): Observable<any> {
    const user = this.authStore.user();
    if (!user) return of(null);
    return this.http.delete(
      `${environment.apiUrl}/api/favoritos/producto/${user.id}/${productoId}`,
      { withCredentials: true },
    ).pipe(
      tap(() => {
        // Actualizamos localmente el signal
        this.favoritosIdsSignal.update(ids => ids.filter(id => id !== productoId));
      })
    );
  }
}
