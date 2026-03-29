import { Component, OnInit, signal, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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

  skeletons = Array(12).fill(0);

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
        this.realizarBusqueda(coords);
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
      tipo: 'OFERTA',
      lat: coords.lat,
      lng: coords.lng,
      radius: this.radius(),
      page: 0,
      size: 40
    };

    const usuarioId = this.authStore.user()?.id;

    this.searchService.buscar(params, usuarioId).subscribe({
      next: (res) => {
        this.resultados.set(res.items);
        this.loading.set(false);
        this.cdr.detectChanges();
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
}
