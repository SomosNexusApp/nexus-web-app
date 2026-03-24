import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SearchService, SearchParams } from '../../../core/services/search.service';
import { AuthStore } from '../../../core/auth/auth-store';
import { ProductoCardComponent } from '../../../shared/components/marketplace/product-card/producto-card.component';
import { OfertaCardComponent } from '../../../shared/components/marketplace/oferta-card/oferta-card.component';
import { VehiculoCardComponent } from '../../../shared/components/vehiculo-card/vehiculo-card.component';
import { MarketplaceItem } from '../../../models/marketplace-item.model';

@Component({
  selector: 'app-ofertas-gratis',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ProductoCardComponent, 
    OfertaCardComponent, 
    VehiculoCardComponent
  ],
  templateUrl: './ofertas-gratis.component.html',
  styleUrls: ['./ofertas-gratis.component.css']
})
export class OfertasGratisComponent implements OnInit {
  private searchService = inject(SearchService);
  private authStore = inject(AuthStore);
  private cdr = inject(ChangeDetectorRef);

  resultados = signal<MarketplaceItem[]>([]);
  loading = signal(true);
  error = signal(false);
  
  skeletons = Array(12).fill(0);

  ngOnInit() {
    this.cargarGratis();
  }

  cargarGratis() {
    this.loading.set(true);
    const params: SearchParams = {
      tipo: 'TODOS',
      precioMax: 0,
      page: 0,
      size: 40,
      orden: 'novedades'
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
}
