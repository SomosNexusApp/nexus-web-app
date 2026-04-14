import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ProductoCardComponent } from '../../../shared/components/marketplace/product-card/producto-card.component';
import { VehiculoCardComponent } from '../../../shared/components/vehiculo-card/vehiculo-card.component';
import { OfertaCardComponent } from '../../../shared/components/marketplace/oferta-card/oferta-card.component';
import { SearchService } from '../../../../app/core/services/search.service';
import { MarketplaceItem } from '../../../../app/models/marketplace-item.model';

@Component({
  selector: 'app-productos-recientes',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductoCardComponent, VehiculoCardComponent, OfertaCardComponent],
  templateUrl: './productos-recientes.component.html',
  styleUrls: ['./productos-recientes.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductosRecientesComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private searchService = inject(SearchService);

  productos = signal<MarketplaceItem[]>([]);
  loading = signal(true);
  error = signal(false);

  readonly skeletons = Array(12).fill(0);

  ngOnInit() {
    this.searchService.buscar({ tipo: 'TODOS', orden: 'reciente', size: 12 }).subscribe({
      next: (res) => {
        this.productos.set(res.items.slice(0, 12));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  goToAll() {
    this.router.navigate(['/search'], { queryParams: { tipo: 'TODOS' } });
  }
}
