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

  // Cache para IDs de favoritos (ahora guardamos strings: "producto_123", "vehiculo_456")
  private favoritosIdsSignal = signal<string[]>([]);
  private cargandoFavoritos = false;
  private favoritosObservable$: Observable<string[]> | null = null;

  getFavoritosIds(): Observable<string[]> {
    const user = this.authStore.user();
    if (!user) return of([]);

    if (this.favoritosObservable$) return this.favoritosObservable$;
    if (this.favoritosIdsSignal().length > 0) return of(this.favoritosIdsSignal());

    this.favoritosObservable$ = this.http
      .get<any[]>(`${environment.apiUrl}/api/favoritos/usuario/${user.id}`, { withCredentials: true })
      .pipe(
        map((favoritos) => {
          const ids: string[] = [];
          favoritos.forEach(f => {
            if (f.producto) ids.push(`producto_${f.producto.id}`);
            else if (f.vehiculo) ids.push(`vehiculo_${f.vehiculo.id}`);
            else if (f.oferta) ids.push(`oferta_${f.oferta.id}`);
          });
          return ids;
        }),
        tap((ids) => {
          this.favoritosIdsSignal.set(ids);
          this.favoritosObservable$ = null;
        }),
        shareReplay(1),
      );

    return this.favoritosObservable$;
  }

  isFavorito(id: number | undefined, type: string = 'producto'): boolean {
    if (!id) return false;
    return this.favoritosIdsSignal().includes(`${type.toLowerCase()}_${id}`);
  }

  addFavorito(id: number, type: 'producto' | 'oferta' | 'vehiculo' = 'producto'): Observable<any> {
    const user = this.authStore.user();
    if (!user) return of(null);
    const typeLower = type.toLowerCase();
    
    return this.http.post(
      `${environment.apiUrl}/api/favoritos/${typeLower}/${user.id}/${id}`,
      {},
      { withCredentials: true },
    ).pipe(
      tap(() => {
        this.favoritosIdsSignal.update(ids => [...ids, `${typeLower}_${id}`]);
      })
    );
  }

  removeFavorito(id: number, type: 'producto' | 'oferta' | 'vehiculo' = 'producto'): Observable<any> {
    const user = this.authStore.user();
    if (!user) return of(null);
    const typeLower = type.toLowerCase();

    return this.http.delete(
      `${environment.apiUrl}/api/favoritos/${typeLower}/${user.id}/${id}`,
      { withCredentials: true },
    ).pipe(
      tap(() => {
        this.favoritosIdsSignal.update(ids => ids.filter(compositeId => compositeId !== `${typeLower}_${id}`));
      })
    );
  }
}
