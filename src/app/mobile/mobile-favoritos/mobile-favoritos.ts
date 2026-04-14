import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthStore } from '../../core/auth/auth-store';
import { environment } from '../../../environments/environment';
import { ProductoCardComponent } from '../../shared/components/marketplace/product-card/producto-card.component';
import { VehiculoCardComponent } from '../../shared/components/vehiculo-card/vehiculo-card.component';
import { FavoritoService } from '../../core/services/favorito.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-mobile-favoritos',
  standalone: true,
  imports: [CommonModule, ProductoCardComponent, VehiculoCardComponent, RouterModule],
  templateUrl: './mobile-favoritos.html',
  styleUrls: ['./mobile-favoritos.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MobileFavoritosComponent implements OnInit {
  private http = inject(HttpClient);
  public authStore = inject(AuthStore);
  private favoritoService = inject(FavoritoService);

  favProductos = signal<any[]>([]);
  favOfertas = signal<any[]>([]);
  favVehiculos = signal<any[]>([]);
  activeTab = signal<'productos' | 'ofertas' | 'vehiculos'>('productos');
  loading = signal(false);

  ngOnInit(): void {
    this.cargarFavoritos();
  }

  cargarFavoritos() {
    const user = this.authStore.user();
    if (!user) return;

    this.loading.set(true);
    this.http.get<any[]>(`${environment.apiUrl}/api/favoritos/usuario/${user.id}`).subscribe({
      next: (data) => {
        // Mapear los resultados para incluir el searchType requerido por las cards
        this.favProductos.set((data || []).filter(f => f.producto).map(f => ({ ...f.producto, searchType: 'PRODUCTO' })));
        this.favOfertas.set((data || []).filter(f => f.oferta).map(f => ({ ...f.oferta, searchType: 'OFERTA' })));
        this.favVehiculos.set((data || []).filter(f => f.vehiculo).map(f => ({ ...f.vehiculo, searchType: 'VEHICULO' })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setTab(tab: 'productos' | 'ofertas' | 'vehiculos') {
    this.activeTab.set(tab);
  }
}
