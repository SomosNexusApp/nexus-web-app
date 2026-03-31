import { Component, OnInit, signal, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { SearchService, SearchParams } from '../../../core/services/search.service';
import { AuthStore } from '../../../core/auth/auth-store';
import { ProductoCardComponent } from '../../../shared/components/marketplace/product-card/producto-card.component';
import { OfertaCardComponent } from '../../../shared/components/marketplace/oferta-card/oferta-card.component';
import { VehiculoCardComponent } from '../../../shared/components/vehiculo-card/vehiculo-card.component';
import { MarketplaceItem } from '../../../models/marketplace-item.model';

@Component({
  selector: 'app-cerca-de-ti',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ProductoCardComponent, 
    OfertaCardComponent, 
    VehiculoCardComponent
  ],
  templateUrl: './cerca-de-ti.component.html',
  styleUrls: ['./cerca-de-ti.component.css']
})
export class CercaDeTiComponent implements OnInit, OnDestroy {
  private searchService = inject(SearchService);
  private authStore = inject(AuthStore);
  private cdr = inject(ChangeDetectorRef);

  resultados = signal<MarketplaceItem[]>([]);
  loading = signal(true);
  error = signal(false);
  locationDenied = signal(false);
  
  radius = signal(50); // km por defecto
  userLocation = signal<{lat: number, lng: number} | null>(null);
  userProvince = signal<string | null>(null);

  skeletons = Array(12).fill(0);
  private provinciaCache = new Map<string, string | null>();

  ngOnInit() {
    this.obtenerUbicacion();
  }

  ngOnDestroy() {
    // Limpieza si es necesaria
  }

  obtenerUbicacion() {
    this.loading.set(true);
    this.locationDenied.set(false);
    
    if (!navigator.geolocation) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        this.userLocation.set(coords);
        this.searchService.getProvinciaDesdeCoordenadas(coords.lat, coords.lng).subscribe({
          next: (prov) => {
            this.userProvince.set(prov);
            this.realizarBusqueda(coords);
          },
          error: () => {
            this.userProvince.set(null);
            this.realizarBusqueda(coords);
          }
        });
      },
      (err) => {
        console.error('Error obteniendo ubicación:', err);
        if (err.code === err.PERMISSION_DENIED) {
          this.locationDenied.set(true);
        } else {
          this.error.set(true);
        }
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      { timeout: 10000 }
    );
  }

  realizarBusqueda(coords: {lat: number, lng: number}) {
    this.loading.set(true);
    const params: SearchParams = {
      tipo: 'TODOS',
      lat: coords.lat,
      lng: coords.lng,
      radius: 200,
      page: 0,
      size: 120
    };

    const usuarioId = this.authStore.user()?.id;

    this.searchService.buscar(params, usuarioId).subscribe({
      next: (res) => {
        this.resolverYFiltrarProvincia(res.items || []).subscribe((filtrados) => {
          this.resultados.set(filtrados);
          this.loading.set(false);
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  cambiarRadio(nuevoRadio: number) {
    this.radius.set(nuevoRadio);
    if (this.userLocation()) {
      this.realizarBusqueda(this.userLocation()!);
    }
  }

  private filtrarPorProvinciaYUbicacion(items: MarketplaceItem[]): MarketplaceItem[] {
    const provincia = (this.userProvince() || '').toLowerCase();
    if (!provincia) {
      return items.filter((it: any) => !!it.latitude && !!it.longitude);
    }
    return items.filter((it: any) => {
      if (!it.latitude || !it.longitude) return false;
      if (it.searchType === 'OFERTA' && it.esOnline === true) return false;
      const ubic = String(it.ubicacion || '').toLowerCase();
      if (!ubic) return false;
      return ubic.includes(provincia);
    });
  }

  private resolverYFiltrarProvincia(items: MarketplaceItem[]) {
    const provincia = (this.userProvince() || '').toLowerCase();
    if (!provincia) {
      return of(items.filter((it: any) => !!it.latitude && !!it.longitude));
    }
    const candidates = items.filter((it: any) => !!it.latitude && !!it.longitude && !(it.searchType === 'OFERTA' && it.esOnline === true));
    if (candidates.length === 0) return of([]);

    const resolvers = candidates.map((it: any) => {
      const ubic = String(it.ubicacion || '').toLowerCase();
      if (ubic.includes(provincia)) return of({ it, provincia: provincia });
      const key = `${it.latitude},${it.longitude}`;
      if (this.provinciaCache.has(key)) {
        return of({ it, provincia: (this.provinciaCache.get(key) || '').toLowerCase() });
      }
      return this.searchService.getProvinciaDesdeCoordenadas(it.latitude, it.longitude).pipe(
        map((prov) => {
          this.provinciaCache.set(key, prov || null);
          return { it, provincia: (prov || '').toLowerCase() };
        }),
      );
    });

    return forkJoin(resolvers).pipe(
      map((rows) => rows.filter((r) => r.provincia.includes(provincia)).map((r) => r.it)),
    );
  }
}
