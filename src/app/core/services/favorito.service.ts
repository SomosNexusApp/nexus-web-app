import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/enviroment';
import { AuthStore } from '../auth/auth-store';

@Injectable({
  providedIn: 'root',
})
export class FavoritoService {
  private http = inject(HttpClient);
  private authStore = inject(AuthStore);

  // Fuente de verdad reactiva para IDs (ej: "producto_123", "vehiculo_456")
  private favoritosIdsSubject = new BehaviorSubject<string[]>([]);
  private favoritosObservable$: Observable<string[]> | null = null;
  
  // Signal derivado para componentes modernos (se sincroniza con el subject)
  public favoritosIds = signal<string[]>([]);

  constructor() {
    // Sincronizamos el signal con el subject para tener lo mejor de ambos mundos
    this.favoritosIdsSubject.subscribe(ids => this.favoritosIds.set(ids));
  }

  getFavoritosIds(): Observable<string[]> {
    const user = this.authStore.user();
    if (!user) return of([]);

    // Si ya tenemos datos, retornamos el subject directamente para que sea reactivo
    if (this.favoritosIdsSubject.value.length > 0) {
      return this.favoritosIdsSubject.asObservable();
    }

    if (this.favoritosObservable$) return this.favoritosObservable$;

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
          this.favoritosIdsSubject.next(ids);
          this.favoritosObservable$ = null;
        }),
        // Una vez cargado, cambiamos al observable del subject para el futuro
        switchMap(() => this.favoritosIdsSubject.asObservable()),
        shareReplay(1)
      );

    return this.favoritosObservable$;
  }

  isFavorito(id: number | undefined, type: string = 'producto'): boolean {
    if (!id) return false;
    return this.favoritosIdsSubject.value.includes(`${type.toLowerCase()}_${id}`);
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
        const current = this.favoritosIdsSubject.value;
        if (!current.includes(`${typeLower}_${id}`)) {
          this.favoritosIdsSubject.next([...current, `${typeLower}_${id}`]);
        }
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
        const current = this.favoritosIdsSubject.value;
        this.favoritosIdsSubject.next(current.filter(compositeId => compositeId !== `${typeLower}_${id}`));
      })
    );
  }
}
